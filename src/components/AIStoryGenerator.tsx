"use client";

import { storyStore } from "@/stores/StoryStore";
import { settingsStore } from "@/stores/SettingsStore";
import { useState } from "react";
import { addIdsToStory } from "@/utils/idGenerator";

const EXAMPLE_STORIES = [
  {
    id: "wysteria",
    title: "📚 The Secret Tomes of Wysteria",
    description: "Magic library adventure story - 3 scenes, 7 shots",
    emoji: "🧙‍♂️",
    data: {
      version: "1.0.0",
      timestamp: 1762400540295,
      story: {
        title: "The Secret Tomes of Wysteria",
        synopsis:
          "In a mystical realm, a young wizard named Elian stumbles upon a hidden magical library, unleashing a world of ancient secrets and untold powers. As he delves deeper into the mysterious tomes, he must navigate the delicate balance between knowledge and responsibility. With the guidance of the library's enigmatic guardian, Lyra, Elian embarks on a journey of discovery and growth.",
        characters: [
          {
            name: "Elian",
            description:
              "A curious and ambitious young wizard with a thirst for magical knowledge",
            prompt:
              "Elian is a slender, agile young wizard with unruly brown hair and bright green eyes. He wears a pair of round, wire-framed glasses perched on the end of his nose and carries a worn leather-bound book bag slung over his shoulder. His attire consists of a crisp white shirt with billowy sleeves, tucked into a pair of durable, earth-toned pants.",
            isGenerating: false,
            referenceImageUrl:
              "https://replicateproxy.b-cdn.net/xezq/cLm1TsPZ3MqLJ5Pa8XAmFi5WF1HWeFeFAHbdBfReeIborAysC/out-0.png",
          },
          {
            name: "Lyra",
            description: "The enigmatic guardian of the hidden magical library",
            prompt:
              "Lyra is an ethereal being with long, flowing silver hair and piercing emerald eyes. She wears a flowing, hooded cloak with intricate, swirling patterns that shimmer like stardust in the dim light of the library. Her presence exudes an aura of wisdom and mystique.",
            isGenerating: false,
            referenceImageUrl:
              "https://replicateproxy.b-cdn.net/xezq/nvjXgkUcThKGPNe05XnY6pyhaPoyBRlFpqFclLDiOZWpCIzKA/out-0.png",
          },
          {
            name: "Kael",
            description: "A skilled wizard and Elian's mentor",
            prompt:
              "Kael is a sturdy, imposing figure with a strong jawline and piercing blue eyes. He wears a long, flowing beard and a pointed hat adorned with intricate, glittering gemstones. His robes are a deep, rich purple, embroidered with intricate, swirling patterns that reflect his mastery of the arcane arts.",
            isGenerating: false,
            referenceImageUrl:
              "https://replicateproxy.b-cdn.net/xezq/R5aLLcoTQOJDFtVTZZe9epK6WV1DLLnKa6ifrwmDeWDUWAZWB/out-0.png",
          },
        ],
        scenes: [
          {
            title: "The Discovery",
            description: "Elian stumbles upon the hidden magical library",
            shots: [
              {
                subtitle:
                  "Elian's eyes widened as he stumbled upon the hidden entrance.",
                location:
                  "A dense, misty forest, with towering trees that block out most of the sunlight",
                content:
                  "Elian stands before a massive, ancient tree, its trunk twisted and gnarled with age. The camera pans across the trunk, revealing a small, intricately carved door hidden behind a tangle of vines. Elian's eyes light up with excitement as he reaches out to touch the door.",
                id: "shot-1762336907126-991nuu",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/K1U5R1POfWRBEyQY7HASoZ6dBuZa8OUbiGfqqEhUbNVYTQmVA/out-0.png?quality=80&format=webp",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/DKpfqfFcMoqQh0KI0nefOCIvmuPvslSPeoCuiSfxHBgREFkZF/tmpmblzpp53.mp4",
                isGeneratingAudio: false,
              },
              {
                subtitle:
                  "The door creaked open, revealing a dimly lit stairway.",
                location:
                  "The interior of the ancient tree, with a narrow stairway spiraling downward into darkness",
                content:
                  "Elian steps through the doorway, his eyes adjusting to the dim light. The camera follows him as he descends the stairway, the air growing thick with the scent of old books and dust.",
                id: "shot-1762336907126-ui1zuv",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/UcZzdOaaMBK8K5udhMeK5KCsnD5r0AQ5IVLkcJiUdK9sJIzKA/out-0.png?quality=80&format=webp",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/5MWDgs3ZLUboNxSDQNTWFjHkwdzo09SwkNyiJBQPvYbELnZF/tmpqi1m07cg.mp4",
                isGeneratingAudio: true,
              },
            ],
            id: "scene-1762336907126-ehyf1o",
          },
          {
            title: "The Library",
            description: "Elian explores the magical library",
            shots: [
              {
                subtitle:
                  "Elian's eyes grew wide as he beheld the endless shelves of ancient tomes.",
                location:
                  "A vast, cavernous chamber filled with row upon row of towering bookshelves",
                content:
                  "Elian stands at the edge of the chamber, his gaze sweeping across the endless shelves. The camera pans across the room, revealing tomes bound in leather, adorned with intricate symbols and gemstones. Lyra stands atop a nearby shelf, watching Elian with an enigmatic smile.",
                id: "shot-1762336907126-cqpdzt",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/QkhLDzwsgyJeR6VSxRrRfYkogHoeLMQIbrI9tvHhby9lNgMrA/out-0.png",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/Y9ISdKx6JnLZG1pevD1w2uzVu3brcHB1a8cDswHHoOIXKIzKA/tmpntjfad86.mp4",
                isGeneratingAudio: false,
              },
              {
                subtitle:
                  "Lyra descended from the shelf, her eyes gleaming with wisdom.",
                location: "A narrow aisle between two rows of bookshelves",
                content:
                  "Lyra floats down from the shelf, her cloak billowing behind her. The camera follows her as she approaches Elian, who looks up at her with a mix of awe and trepidation.",
                id: "shot-1762336907126-3sxa36",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/f6uc6EY0DXzmUquG3BBNwOfhy6EdaNpegsvfJrTj98cJbAZWB/out-0.png",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/g76OdGF4K1b6JNOsEsAhQgA67emigI6xmwnQf27NbliSscmVA/tmpi67ripgr.mp4",
                isGeneratingAudio: true,
              },
            ],
            id: "scene-1762336907126-ydp7o0",
          },
          {
            title: "The Warning",
            description:
              "Kael warns Elian of the dangers of the library's power",
            shots: [
              {
                subtitle:
                  "Kael's expression turned stern as he beheld the look of wonder on Elian's face.",
                location:
                  "A cozy, dimly lit study filled with shelves of ancient tomes and strange, glowing artifacts",
                content:
                  "Kael sits behind a massive, ornate desk, his eyes fixed intently on Elian. The camera pans across the room, revealing shelves of ancient tomes and strange, glowing artifacts. Elian stands before the desk, his eyes still shining with excitement.",
                id: "shot-1762336907126-1lwtdj",
              },
              {
                subtitle:
                  "The power of the library is not to be trifled with, Elian.",
                location:
                  "A close-up of Kael's face, his eyes burning with intensity",
                content:
                  "Kael's eyes bore into Elian's, his expression stern and serious. The camera lingers on his face, emphasizing the gravity of his words.",
                id: "shot-1762336907126-0msagf",
              },
            ],
            id: "scene-1762336907126-osweke",
          },
        ],
        style: "3D Cartoon",
        aspectRatio: "16:9",
      },
      currentStep: "edit",
      settings: {
        defaultStyle: "3D Cartoon",
        defaultAspectRatio: "16:9",
        enableAudio: true,
        textModel: {
          provider: "openrouter",
          modelId: "meta-llama/llama-3.1-405b-instruct",
          temperature: 0.7,
          maxTokens: 4000,
          apiKey: "",
        },
        imageModel: {
          provider: "replicate",
          modelId: "tencent/hunyuan-image-3",
          apiKey: "",
        },
        characterImageModel: {
          provider: "replicate",
          modelId: "tencent/hunyuan-image-3",
          apiKey: "",
        },
        videoModel: {
          provider: "replicate",
          modelId: "bytedance/seedance-1-lite",
          apiKey: "",
        },
        voiceModel: {
          provider: "openai",
          voiceId: "alloy",
          model: "tts-1",
          speed: 1,
          apiKey: "",
        },
      },
      metadata: {
        exportedAt: "2025-11-06T03:42:20.295Z",
        appVersion: "1.0.0",
      },
    },
  },
  {
    id: "sweet-serendipity",
    title: "🍬 Sweet Serendipity",
    description: "Candy wonderland adventure story - 3 characters, multi-scene sweet journey",
    emoji: "🍭",
    data: {
      version: "1.0.0",
      timestamp: 1762352495455,
      story: {
        title: "Sweet Serendipity",
        synopsis:
          "A curious little girl named Lily stumbles upon a magical door that leads her to a candy wonderland, where she meets the friendly guardians of the sugary realm and embarks on a thrilling adventure. Along the way, she learns about the value of kindness, friendship, and moderation. But can she resist the temptation of the endless sweets and find her way back home?",
        characters: [
          {
            name: "Lily",
            description:
              "A bright-eyed, curious six-year-old girl with a sweet tooth and a love for exploration",
            prompt:
              "A 3D cartoon little girl with curly brown hair, bright blue eyes, and a yellow sundress with white flowers",
            isGenerating: false,
            referenceImageUrl:
              "https://replicateproxy.b-cdn.net/xezq/jndy0flh3vQAFCb3nH7lzcOzgtobyUffyCgwuh5K4kIBthMrA/out-0.png?quality=80&format=webp",
          },
          {
            name: "Ginger",
            description:
              "The friendly, wise, and gentle guardian of the candy wonderland, who becomes Lily's guide and confidant",
            prompt:
              "A 3D cartoon woman made of gingerbread with icing for hair, candy-cane striped arms, and a warm smile",
            isGenerating: false,
            referenceImageUrl:
              "https://replicateproxy.b-cdn.net/xezq/ScOmb8reYen25EeePlVBYhaHU9yfcGqcsvAvf4E1m5AZbOkZF/out-0.png?quality=80&format=webp",
          },
          {
            name: "Minty",
            description:
              "A playful, mischievous imp who loves to play tricks on Lily and cause trouble in the candy wonderland",
            prompt:
              "A 3D cartoon imp with pale blue skin, mint-green hair, and a fondant hat shaped like a peppermint swirl",
            isGenerating: false,
            referenceImageUrl:
              "https://replicateproxy.b-cdn.net/xezq/TrsSfCebxvveOJutPPXzCb2dSkwTZuUuXnbF2Yiky6Zk3hMrA/out-0.png?quality=80&format=webp",
          },
        ],
        scenes: [
          {
            title: "The Discovery",
            description: "Lily finds the magical door to the candy wonderland",
            shots: [
              {
                subtitle: "I wonder what's behind this door...",
                location:
                  "A cozy, cluttered attic with old trunks, dusty jars, and forgotten toys",
                content:
                  "Lily (Lily) pushes aside old boxes and cobwebs, revealing a colorful door with a shiny doorknob shaped like a lollipop",
                id: "shot-0-0",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/qeR3DoTjbL1eIkINzglePU2CLO8MiUQa7yAcTviKFJOZ0hMrA/out-0.png?quality=80&format=webp",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/uv87aKEuo5Z7FtpncYvfhVfVe0KfllohieeOO6B15Om3OPkZF/tmpkw6qb3x8.mp4",
                isGeneratingAudio: false,
              },
              {
                subtitle: "Wow! A secret world!",
                location:
                  "A bright, sugary landscape with gingerbread houses, lollipop trees, and gumdrop bushes",
                content:
                  "Lily (Lily) steps through the doorway and gazes in wonder at the candy wonderland, with Ginger (Ginger) welcoming her with a warm smile",
                id: "shot-0-1",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/gNSMW99xL65mEVDjSTtbUD41JtjHcNawKdhOYWurB14nOkZF/out-0.png?quality=80&format=webp",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/rnfU7o40OiwhbKWP6xz8UfqHZfMqMrZ9jvwigBWLUwTK6hMrA/tmpblt_mxzr.mp4",
                isGeneratingAudio: false,
              },
            ],
            id: "scene-0",
          },
          {
            title: "The Temptation",
            description:
              "Lily explores the candy wonderland and samples the sweets",
            shots: [
              {
                subtitle: "Try some! It's delicious!",
                location:
                  "A bustling candy market with stalls selling gummies, chocolates, and other treats",
                content:
                  "Minty (Minty) tempts Lily (Lily) with a tray of colorful sweets, while Ginger (Ginger) cautions her to be mindful of her sugar intake",
                id: "shot-1-0",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/3J5fMpHZbVTyEq205iHkzhwhhJ3Den1xVlcer22F1uus4hMrA/out-0.png?quality=80&format=webp",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/i3qXtRY4g2pPC9Lofep44Vfbu7EvDJamcZqtfXjWpAD3zDZWB/tmp567o07co.mp4",
                isGeneratingAudio: false,
              },
              {
                subtitle: "Just one more piece...",
                location:
                  "A cozy, sugar-coated cave filled with sparkling crystals and lollipop stalactites",
                content:
                  "Lily (Lily) indulges in a sugary feast, but soon finds herself overwhelmed by the endless sweets and Ginger's (Ginger) gentle warnings",
                id: "shot-1-1",
                isGenerating: false,
                imageUrl:
                  "https://replicateproxy.b-cdn.net/xezq/ToI8eRd1BkUsSqbiSVsmTVmZDmDIBaB1qculwEJ4omoYdIzKA/out-0.png?quality=80&format=webp",
                isAnimating: false,
                animationUrl:
                  "https://replicateproxy.b-cdn.net/xezq/I7dKjwFR31rSMt9SQDefRsUEiJOs57qn50eizeW1qERb0DZWB/tmp15kjg36x.mp4",
                isGeneratingAudio: false,
              },
            ],
            id: "scene-1",
          },
          {
            title: "The Lesson",
            description: "Lily learns the value of moderation and kindness",
            shots: [
              {
                subtitle: "I think I've had enough sugar for today...",
                location:
                  "A serene, sugar-free meadow with wildflowers and a clear stream",
                content:
                  "Lily (Lily) reflects on her adventure and realizes the importance of balance, with Ginger (Ginger) nodding in approval",
                id: "shot-2-0",
              },
              {
                subtitle: "Let's help Minty clean up the mess!",
                location:
                  "A messy, sugar-coated landscape with spills and crumbs galore",
                content:
                  "Lily (Lily) and Ginger (Ginger) team up to clean up the candy wonderland, teaching Minty (Minty) the value of responsibility and kindness",
                id: "shot-2-1",
              },
            ],
            id: "scene-2",
          },
          {
            title: "The Farewell",
            description:
              "Lily says goodbye to her new friends and returns home",
            shots: [
              {
                subtitle: "I'll never forget my adventure here!",
                location:
                  "The magical doorway, now surrounded by Lily's new friends",
                content:
                  "Lily (Lily) hugs Ginger (Ginger) and Minty (Minty) goodbye, promising to share the lessons she learned with her friends back home",
                id: "shot-3-0",
              },
              {
                subtitle: "I wonder what other secrets this attic holds?",
                location: "The cozy attic, now tidy and organized",
                content:
                  "Lily (Lily) returns home, reflecting on her adventure and already planning her next discovery",
                id: "shot-3-1",
              },
            ],
            id: "scene-3",
          },
        ],
        style: "3D Cartoon",
        aspectRatio: "16:9",
      },
      currentStep: "edit",
      settings: {
        defaultStyle: "3D Cartoon",
        defaultAspectRatio: "16:9",
        enableAudio: true,
        textModel: {
          provider: "openrouter",
          modelId: "meta-llama/llama-3.1-405b-instruct",
          temperature: 0.7,
          maxTokens: 4000,
          apiKey: "",
        },
        imageModel: {
          provider: "replicate",
          modelId: "tencent/hunyuan-image-3",
          apiKey: "",
        },
        characterImageModel: {
          provider: "replicate",
          modelId: "tencent/hunyuan-image-3",
          apiKey: "",
        },
        videoModel: {
          provider: "replicate",
          modelId: "bytedance/seedance-1-lite",
          apiKey: "",
        },
        voiceModel: {
          provider: "openai",
          voiceId: "alloy",
          model: "tts-1",
          speed: 1,
          apiKey: "",
        },
      },
      metadata: {
        exportedAt: "2025-11-05T14:21:35.455Z",
        appVersion: "1.0.0",
      },
    },
  },
];

export default function AIStoryGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExampleStory = (storyId: string) => {
    try {
      const exampleStory = EXAMPLE_STORIES.find((s) => s.id === storyId);
      if (!exampleStory) {
        setError("Example story not found");
        return;
      }

      // Load story data with freshly generated unique IDs
      const storyWithNewIds = addIdsToStory(exampleStory.data.story);
      storyStore.setStory(storyWithNewIds as any);

      // Update settings without overwriting existing API keys
      const exSettings = exampleStory.data.settings;
      const currentSettings = settingsStore.settings;

      // Update models (preserve existing API keys)
      if (exSettings.textModel) {
        settingsStore.updateTextModel({
          ...(exSettings.textModel as any),
          apiKey:
            currentSettings.textModel.apiKey || exSettings.textModel.apiKey,
        });
      }

      if (exSettings.imageModel) {
        settingsStore.updateImageModel({
          ...(exSettings.imageModel as any),
          apiKey:
            currentSettings.imageModel.apiKey || exSettings.imageModel.apiKey,
        });
      }

      if (exSettings.characterImageModel) {
        settingsStore.updateCharacterImageModel({
          ...(exSettings.characterImageModel as any),
          apiKey:
            currentSettings.characterImageModel.apiKey ||
            exSettings.characterImageModel.apiKey,
        });
      }

      if (exSettings.videoModel) {
        settingsStore.updateVideoModel({
          ...(exSettings.videoModel as any),
          apiKey:
            currentSettings.videoModel.apiKey || exSettings.videoModel.apiKey,
        });
      }

      if (exSettings.voiceModel) {
        settingsStore.updateVoiceModel({
          ...(exSettings.voiceModel as any),
          apiKey:
            currentSettings.voiceModel.apiKey || exSettings.voiceModel.apiKey,
        });
      }

      // Update general settings
      settingsStore.updateGeneralSettings({
        defaultStyle: exSettings.defaultStyle,
        defaultAspectRatio: exSettings.defaultAspectRatio,
        enableAudio: exSettings.enableAudio,
      });

      // Navigate to edit step
      storyStore.setCurrentStep("edit");

      alert(
        `✅ Example story "${exampleStory.data.story.title}" loaded! You can now preview and export videos.`
      );
    } catch (err: any) {
      console.error("Failed to load example story:", err);
      setError("Failed to load example story");
    }
  };

  const examplePrompts = [
    "A young wizard discovers a hidden magical library",
    "A robot learns about human emotions in a futuristic city",
    "A brave knight rescues a dragon from an evil prince",
    "A little girl finds a door to a candy wonderland",
  ];

  const generateStory = async () => {
    if (!prompt.trim()) {
      setError("Please enter a story idea");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Get model config from settings
      const { textModel } = settingsStore.settings;

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: settingsStore.settings.defaultStyle,
          aspectRatio: settingsStore.settings.defaultAspectRatio,
          modelConfig: textModel,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate story");
      }

      const data = await response.json();

      // Add unique IDs to scenes and shots
      const processedStory = addIdsToStory(data.story);

      storyStore.setStory(processedStory);

      // Navigate to review step for manual approval
      storyStore.setCurrentStep("review");

      alert(`Story "${data.story.title}" generated successfully! Please review and confirm to proceed to storyboard.`);
    } catch (err: any) {
      console.error("Story generation error:", err);
      setError(err.message || "Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generateStory();
    }
  };

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-2xl">
          ✨
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-purple-300 mb-2">
            Quick Start
          </h3>
          <p className="text-sm text-purple-400 mb-4">
            Load example stories to quickly test subtitles and export features, or use AI to generate new stories
          </p>

          <div className="space-y-4">
            {/* Example Stories Grid */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-3">
                Select example stories to get started quickly
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXAMPLE_STORIES.map((story) => (
                  <div
                    key={story.id}
                    className="p-4 bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-lg hover:border-green-600/70 transition"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-2xl">{story.emoji}</div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-green-300 mb-1">
                          {story.title}
                        </h5>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {story.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadExampleStory(story.id)}
                      className="w-full py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      Load This Story
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-purple-700/30"></div>
              <span className="text-xs text-gray-500">
                Or create a new story with AI
              </span>
              <div className="flex-1 h-px bg-purple-700/30"></div>
            </div>

            {/* Input */}
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your story idea, e.g.: A young wizard discovers a hidden magical library..."
                className="w-full p-4 bg-gray-800/50 border border-purple-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition min-h-[100px] resize-y"
                disabled={isGenerating}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {prompt.length} characters • Press Enter to generate
                </span>
              </div>
            </div>

            {/* Example Prompts */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 bg-purple-800/30 hover:bg-purple-700/50 border border-purple-600/30 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateStory}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="spinner w-5 h-5 border-2"></div>
                  Generating story with AI...
                </>
              ) : (
                <>✨ Generate Complete Story with AI</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
