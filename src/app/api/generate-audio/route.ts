import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      text,
      voiceConfig,
    } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const provider = voiceConfig?.provider || 'openai';
    const apiKey = voiceConfig?.apiKey || process.env.OPENAI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider} API key is required. Please configure it in Settings.` },
        { status: 400 }
      );
    }

    let audioDataUrl: string;

    if (provider === 'openai') {
      audioDataUrl = await generateOpenAIAudio(text, voiceConfig, apiKey);
    } else if (provider === 'elevenlabs') {
      audioDataUrl = await generateElevenLabsAudio(text, voiceConfig, apiKey);
    } else {
      return NextResponse.json(
        { error: 'Unsupported voice provider' },
        { status: 400 }
      );
    }

    // Return audio as base64 data URL for persistence in exports
    return NextResponse.json({
      audioUrl: audioDataUrl,
    });
  } catch (error: any) {
    console.error('Audio generation error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate audio',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

async function generateOpenAIAudio(
  text: string,
  voiceConfig: any,
  apiKey: string
): Promise<string> {
  const voice = voiceConfig?.voiceId || 'alloy';
  const model = voiceConfig?.model || 'tts-1';
  const speed = voiceConfig?.speed || 1.0;

  console.log(`Generating OpenAI audio with voice ${voice}, model ${model}, speed ${speed}...`);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      speed,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'OpenAI TTS request failed');
  }

  // Convert audio to base64 data URL for persistence
  const audioBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString('base64');
  const dataUrl = `data:audio/mpeg;base64,${base64}`;

  console.log('OpenAI audio generated successfully');

  return dataUrl;
}

async function generateElevenLabsAudio(
  text: string,
  voiceConfig: any,
  apiKey: string
): Promise<string> {
  const voiceId = voiceConfig?.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella
  const stability = voiceConfig?.stability || 0.5;
  const similarityBoost = voiceConfig?.similarityBoost || 0.75;
  const model = voiceConfig?.model || 'eleven_monolingual_v1';

  console.log(`Generating ElevenLabs audio with voice ${voiceId}...`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS request failed: ${errorText}`);
  }

  // Convert audio to base64 data URL for persistence
  const audioBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(audioBuffer).toString('base64');
  const dataUrl = `data:audio/mpeg;base64,${base64}`;

  console.log('ElevenLabs audio generated successfully');

  return dataUrl;
}
