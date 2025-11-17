/**
 * Browser-based Video + Audio Merger using MediaSource API
 * Merges video and audio streams in real-time for preview
 */

/**
 * Merge video and audio into a single playable blob with optional subtitle
 * Uses FFmpeg.wasm for in-browser processing
 */
export async function mergeVideoAudio(
  videoUrl: string,
  audioUrl: string,
  subtitle?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    console.log('mergeVideoAudio called with:', {
      hasVideo: !!videoUrl,
      hasAudio: !!audioUrl && audioUrl.length > 0,
      hasSubtitle: !!subtitle && subtitle.length > 0,
      subtitle: subtitle
    });

    if (onProgress) onProgress(5);

    // Import FFmpeg dynamically
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    if (onProgress) onProgress(10);

    const ffmpeg = new FFmpeg();

    // Set up progress logging
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      // Map FFmpeg internal progress (0-1) to our range (20-80)
      if (onProgress) {
        const mappedProgress = 20 + Math.round(progress * 60);
        onProgress(mappedProgress);
      }
    });

    if (onProgress) onProgress(15);

    // Load FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    if (onProgress) onProgress(20);

    // Download video
    const videoData = await fetchFile(videoUrl);
    await ffmpeg.writeFile('input.mp4', videoData);

    if (onProgress) onProgress(40);

    // Download/process audio if provided
    const hasAudio = audioUrl && audioUrl.length > 0;
    if (hasAudio) {
      let audioData: Uint8Array;
      if (audioUrl.startsWith('data:')) {
        // Handle base64 data URL
        const base64Data = audioUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        audioData = bytes;
      } else {
        audioData = await fetchFile(audioUrl);
      }
      await ffmpeg.writeFile('audio.mp3', audioData);
    }

    if (onProgress) onProgress(60);

    // Process based on what we have
    if (subtitle) {
      // Create subtitle file (SRT format) - 5 seconds duration
      const srtContent = `1
00:00:00,000 --> 00:00:05,000
${subtitle}
`;
      await ffmpeg.writeFile('subtitle.srt', new TextEncoder().encode(srtContent));
      console.log('Created subtitle file with content:', srtContent);

      if (onProgress) onProgress(65);

      if (hasAudio) {
        // Merge video, audio, and burn subtitles
        // Audio is already padded to match video duration (5s)
        console.log('Executing FFmpeg with video + audio + subtitle');
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-i', 'audio.mp3',
          '-vf', `subtitles=subtitle.srt:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=30,Alignment=2'`,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-shortest',
          'output.mp4'
        ]);
      } else{
        // Only subtitle, no audio
        console.log('Executing FFmpeg with video + subtitle only');
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-vf', `subtitles=subtitle.srt:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=30,Alignment=2'`,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-an',
          'output.mp4'
        ]);
      }
    } else if (hasAudio) {
      // Only audio, no subtitle
      // Audio is already padded to match video duration (5s)
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'audio.mp3',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        'output.mp4'
      ]);
    } else {
      // No audio, no subtitle - just copy the video
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-c', 'copy',
        'output.mp4'
      ]);
    }

    if (onProgress) onProgress(80);

    // Read output
    const output = await ffmpeg.readFile('output.mp4');
    const uint8Array = output instanceof Uint8Array ? output : new Uint8Array(output as any);
    const blob = new Blob([uint8Array], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    if (onProgress) onProgress(100);

    return url;
  } catch (error) {
    console.error('Video/audio merge failed:', error);
    throw error;
  }
}

/**
 * Simple approach: Create a video element with synchronized audio
 * No actual merging, just synchronized playback
 */
export function createSyncedVideoPlayer(
  videoUrl: string,
  audioUrl: string,
  container: HTMLElement
): () => void {
  // Create video element
  const video = document.createElement('video');
  video.src = videoUrl;
  video.controls = true;
  video.style.width = '100%';
  video.style.maxHeight = '500px';

  // Create audio element
  const audio = new Audio(audioUrl);

  // Sync playback
  video.addEventListener('play', () => {
    audio.currentTime = video.currentTime;
    audio.play();
  });

  video.addEventListener('pause', () => {
    audio.pause();
  });

  video.addEventListener('seeked', () => {
    audio.currentTime = video.currentTime;
  });

  video.addEventListener('ended', () => {
    audio.pause();
    audio.currentTime = 0;
  });

  // Add to container
  container.appendChild(video);

  // Return cleanup function
  return () => {
    audio.pause();
    video.pause();
    container.removeChild(video);
  };
}

/**
 * Merge multiple videos with audio into a single preview
 */
export async function mergeMultipleVideos(
  videos: Array<{ videoUrl: string; audioUrl?: string; subtitle?: string }>,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    if (onProgress) onProgress(2);

    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    if (onProgress) onProgress(5);

    const ffmpeg = new FFmpeg();

    // Set up progress logging
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      // FFmpeg progress will be mapped during processing
      console.log('FFmpeg progress:', progress);
    });

    if (onProgress) onProgress(8);

    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    if (onProgress) onProgress(10);

    // Process each video
    const processedFiles: string[] = [];
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoFileName = `video_${i}.mp4`;

      // Download video
      const videoData = await fetchFile(video.videoUrl);
      await ffmpeg.writeFile(videoFileName, videoData);

      const mergedFileName = `merged_${i}.mp4`;

      if (video.audioUrl) {
        const audioFileName = `audio_${i}.mp3`;

        // Handle audio
        let audioData: Uint8Array;
        if (video.audioUrl.startsWith('data:')) {
          const base64Data = video.audioUrl.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          audioData = bytes;
        } else {
          audioData = await fetchFile(video.audioUrl);
        }
        await ffmpeg.writeFile(audioFileName, audioData);

        // Add subtitle if provided
        if (video.subtitle) {
          const srtFileName = `subtitle_${i}.srt`;
          const srtContent = `1
00:00:00,000 --> 00:00:05,000
${video.subtitle}
`;
          await ffmpeg.writeFile(srtFileName, new TextEncoder().encode(srtContent));

          // Merge video, audio, and burn subtitles
          await ffmpeg.exec([
            '-i', videoFileName,
            '-i', audioFileName,
            '-vf', `subtitles=${srtFileName}:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=30,Alignment=2'`,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-shortest',  // Use shortest stream (should be similar length)
            mergedFileName
          ]);
        } else {
          // Merge video with audio without subtitles
          await ffmpeg.exec([
            '-i', videoFileName,
            '-i', audioFileName,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-shortest',  // Use shortest stream (should be similar length)
            mergedFileName
          ]);
        }
        processedFiles.push(mergedFileName);
      } else if (video.subtitle) {
        // Only subtitle, no audio
        const srtFileName = `subtitle_${i}.srt`;
        const srtContent = `1
00:00:00,000 --> 00:00:05,000
${video.subtitle}
`;
        await ffmpeg.writeFile(srtFileName, new TextEncoder().encode(srtContent));

        // Burn subtitles into video
        await ffmpeg.exec([
          '-i', videoFileName,
          '-vf', `subtitles=${srtFileName}:force_style='FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=30,Alignment=2'`,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-an',
          mergedFileName
        ]);
        processedFiles.push(mergedFileName);
      } else {
        // No audio, no subtitle
        processedFiles.push(videoFileName);
      }

      if (onProgress) {
        const progress = 10 + (i + 1) / videos.length * 70;
        onProgress(Math.round(progress));
      }
    }

    // Create concat file
    const concatContent = processedFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));

    if (onProgress) onProgress(85);

    // Concatenate all videos
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy',
      'final.mp4'
    ]);

    if (onProgress) onProgress(95);

    // Read output
    const output = await ffmpeg.readFile('final.mp4');
    const uint8Array = output instanceof Uint8Array ? output : new Uint8Array(output as any);
    const blob = new Blob([uint8Array], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    if (onProgress) onProgress(100);

    return url;
  } catch (error) {
    console.error('Multiple video merge failed:', error);
    throw error;
  }
}
