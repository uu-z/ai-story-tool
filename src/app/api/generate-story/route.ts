import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/utils/openrouter';

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      style = '3D Cartoon',
      aspectRatio = '16:9',
      modelConfig,
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get model configuration from request or use defaults
    const apiKey = modelConfig?.apiKey || process.env.OPENROUTER_API_KEY || '';
    const modelId = modelConfig?.modelId || 'meta-llama/llama-3.1-405b-instruct';
    const temperature = modelConfig?.temperature || 0.7;
    const maxTokens = modelConfig?.maxTokens || 4000;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is required. Please configure it in Settings.' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a professional storytelling assistant. Generate a complete story structure in JSON format based on the user's prompt.

The story should include:
1. A compelling title
2. A brief synopsis (2-3 sentences)
3. 2-4 main characters with detailed descriptions
4. 2-4 scenes, each with 2-4 shots

Each shot should have:
- A subtitle (narration or dialogue)
- A detailed location description
- A detailed visual content description for image generation

CRITICAL: Return ONLY valid JSON. Do NOT include any explanatory text, markdown formatting, or comments. Start directly with { and end with }.

Return in this exact format:
{
  "title": "Story Title",
  "synopsis": "Brief story description...",
  "characters": [
    {
      "name": "Character Name",
      "description": "Brief description",
      "prompt": "Detailed visual description for image generation (appearance, clothing, style, etc.)"
    }
  ],
  "scenes": [
    {
      "title": "Scene Title",
      "description": "Scene description",
      "shots": [
        {
          "subtitle": "Narration or dialogue",
          "location": "Detailed location description",
          "content": "Detailed visual content (what happens, camera angle, lighting, mood, characters present, actions, etc.)"
        }
      ]
    }
  ]
}

Important:
- Make descriptions vivid and visual
- Include character names using @CharacterName format in content
- Ensure continuity between shots
- Match the style: ${style}
- Keep it concise but complete (aim for 8-12 total shots)`;

    console.log(`Generating story with ${modelId}...`);

    // Call OpenRouter API with JSON mode if supported
    const requestConfig: any = {
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    };

    // Enable JSON mode for compatible models (GPT-4, Claude 3+, etc.)
    if (modelId.includes('gpt-4') || modelId.includes('gpt-3.5') ||
        modelId.includes('claude-3') || modelId.includes('claude-sonnet') ||
        modelId.includes('gemini')) {
      requestConfig.response_format = { type: 'json_object' };
      console.log('Using JSON mode for model:', modelId);
    }

    const responseText = await callOpenRouter(apiKey, requestConfig);

    console.log('Raw LLM response (first 200 chars):', responseText.substring(0, 200));

    // Extract JSON from response (handle markdown code blocks and other formats)
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const parts = jsonText.split('```json');
      if (parts.length > 1) {
        jsonText = parts[1].split('```')[0].trim();
      }
    } else if (jsonText.includes('```')) {
      const parts = jsonText.split('```');
      if (parts.length > 1) {
        jsonText = parts[1].split('```')[0].trim();
      }
    }

    // Try to find JSON object if response starts with non-JSON text
    if (!jsonText.startsWith('{')) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
    }

    // Clean up common JSON issues
    // Fix trailing commas before closing brackets
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

    // Remove potential BOM or invisible characters
    jsonText = jsonText.replace(/^\uFEFF/, '');

    console.log('Extracted JSON (first 200 chars):', jsonText.substring(0, 200));

    // Parse JSON with better error handling
    let storyData;
    try {
      storyData = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Failed at position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
      console.error('JSON text length:', jsonText.length);
      console.error('JSON preview (first 500 chars):', jsonText.substring(0, 500));
      console.error('JSON preview (last 100 chars):', jsonText.substring(Math.max(0, jsonText.length - 100)));

      // Try to provide helpful error message
      const position = parseError.message.match(/position (\d+)/)?.[1];
      if (position) {
        const pos = parseInt(position);
        const context = jsonText.substring(Math.max(0, pos - 50), Math.min(jsonText.length, pos + 50));
        console.error('Context around error:', context);
      }

      throw new Error(`Failed to parse story JSON: ${parseError.message}. The AI may have returned invalid JSON. Please try again.`);
    }

    // Add style and aspectRatio
    storyData.style = style;
    storyData.aspectRatio = aspectRatio;

    // Validate structure
    if (!storyData.title || !storyData.synopsis || !storyData.characters || !storyData.scenes) {
      throw new Error('Invalid story structure generated');
    }

    console.log('Story generated successfully:', storyData.title);

    return NextResponse.json({
      story: storyData
    });
  } catch (error: any) {
    console.error('Story generation error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate story',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
