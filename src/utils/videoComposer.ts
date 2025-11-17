/**
 * Browser-side video composition using ffmpeg.wasm
 * Fallback when Docker service is not available
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

export async function loadFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();

  ffmpeg.on('log', ({ message }) => {
    console.log('FFmpeg:', message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) {
      onProgress(Math.round(progress * 100));
    }
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export interface VideoSegment {
  url: string;
  subtitle?: string;
  audioUrl?: string;
  duration?: number;
}

export interface QualitySettings {
  crf: number;      // Constant Rate Factor (18-28, lower = better quality)
  preset: string;   // Encoding speed (ultrafast, fast, medium, slow)
  resolution?: string; // Optional resolution scaling (480p, 720p, 1080p, original)
}

// Quality presets (optimized for speed)
export const QUALITY_PRESETS = {
  low: { crf: 30, preset: 'ultrafast' },      // Fastest, lower quality
  medium: { crf: 26, preset: 'ultrafast' },   // Fast, acceptable quality
  high: { crf: 23, preset: 'veryfast' },      // Balanced
  ultra: { crf: 20, preset: 'fast' },         // Better quality, slower
};

/**
 * Process single video: add audio if needed (subtitles not supported in wasm)
 */
async function processVideo(
  ffmpeg: FFmpeg,
  videoFile: string,
  audioUrl: string | undefined,
  subtitle: string | undefined,
  outputFile: string,
  quality: QualitySettings = QUALITY_PRESETS.high
): Promise<void> {
  try {
    const hasAudio = audioUrl && audioUrl.length > 10; // Check for meaningful data, not just empty string
    const hasSubtitle = subtitle && subtitle.length > 0;

    console.log(`\n>>> Processing ${videoFile} -> ${outputFile}`);
    console.log('Options:', {
      hasAudio,
      audioLength: audioUrl?.length || 0,
      hasSubtitle,
      subtitleLength: subtitle?.length || 0
    });

    // Verify input file exists
    try {
      const inputCheck = await ffmpeg.readFile(videoFile);
      console.log(`✓ Input file verified: ${videoFile} (${inputCheck.length} bytes)`);
    } catch (e) {
      console.error(`✗ Input file missing: ${videoFile}`, e);
      throw new Error(`Input file not found: ${videoFile}`);
    }

    // If no audio, just copy the file (skip subtitles - ffmpeg.wasm doesn't have fonts)
    if (!hasAudio) {
      console.log('→ No audio, copying video as-is...');
      if (hasSubtitle) {
        console.warn('⚠️  Subtitle ignored: ffmpeg.wasm does not support text rendering (no fonts)');
      }
      const videoData = await ffmpeg.readFile(videoFile);
      await ffmpeg.writeFile(outputFile, videoData);

      // Verify output
      const outputCheck = await ffmpeg.readFile(outputFile);
      console.log(`✓ Video copied: ${outputFile} (${outputCheck.length} bytes)`);
      return;
    }

    // Handle audio
    console.log('→ Loading audio file...');
    try {
      if (audioUrl.startsWith('data:')) {
        const base64Data = audioUrl.split(',')[1];
        if (!base64Data || base64Data.length === 0) {
          console.warn('⚠️  Empty audio data, skipping audio');
          // Just copy video
          const videoData = await ffmpeg.readFile(videoFile);
          await ffmpeg.writeFile(outputFile, videoData);
          console.log(`✓ Video copied (no audio): ${outputFile}`);
          return;
        }
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await ffmpeg.writeFile('temp_audio.mp3', bytes);
        console.log(`✓ Audio loaded from data URL (${bytes.length} bytes)`);
      } else {
        const audioData = await fetchFile(audioUrl);
        await ffmpeg.writeFile('temp_audio.mp3', audioData);
        console.log(`✓ Audio loaded from URL (${audioData.length} bytes)`);
      }
    } catch (e) {
      console.error('✗ Failed to load audio:', e);
      console.warn('⚠️  Continuing without audio...');
      // Just copy video
      const videoData = await ffmpeg.readFile(videoFile);
      await ffmpeg.writeFile(outputFile, videoData);
      console.log(`✓ Video copied (audio failed): ${outputFile}`);
      return;
    }

    // Add audio to video (ignore subtitles - not supported in wasm)
    console.log('→ Running FFmpeg (Video + Audio)...');
    if (hasSubtitle) {
      console.warn('⚠️  Subtitle ignored: ffmpeg.wasm does not support text rendering (no fonts)');
    }

    await ffmpeg.exec([
      '-i', videoFile,
      '-i', 'temp_audio.mp3',
      '-c:v', 'copy',  // Copy video (fast)
      '-c:a', 'aac',   // Encode audio to AAC
      '-b:a', '128k',
      '-shortest',     // Match shortest input duration
      '-movflags', '+faststart',
      '-y',
      outputFile
    ]);
    console.log('✓ FFmpeg completed');

    // Verify output file was created with actual data
    try {
      const outputCheck = await ffmpeg.readFile(outputFile);
      if (outputCheck.length === 0) {
        throw new Error('Output file is empty (0 bytes)');
      }
      console.log(`✓ Output verified: ${outputFile} (${outputCheck.length} bytes)`);
    } catch (e) {
      console.error(`✗ Output file not created or empty: ${outputFile}`, e);
      throw new Error(`Output file not created: ${outputFile}`);
    }

    // Clean up temp files
    try {
      await ffmpeg.deleteFile('temp_audio.mp3');
      console.log('✓ Cleaned up temp_audio.mp3');
    } catch (e) {
      console.warn('Warning: Could not delete temp_audio.mp3');
    }

    console.log(`✓✓✓ Video processed successfully: ${outputFile}\n`);
  } catch (error) {
    console.error(`\n✗✗✗ Video processing error for ${videoFile}:`, error);
    throw error;
  }
}

export async function composeVideos(
  videos: VideoSegment[],
  onProgress?: (progress: number) => void,
  quality: QualitySettings = QUALITY_PRESETS.high
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg(onProgress);

  try {
    console.log(`\n=== Starting video composition: ${videos.length} videos ===`);
    const processedFiles: string[] = [];

    // Process each video (add audio/subtitle if needed)
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const inputFile = `input${i}.mp4`;
      const processedFile = `processed${i}.mp4`;

      console.log(`\n[${i + 1}/${videos.length}] Processing video...`);

      // Write video file
      const videoData = await fetchFile(video.url);
      console.log(`✓ Fetched video data, size: ${videoData.length} bytes`);

      await ffmpeg.writeFile(inputFile, videoData);
      console.log(`✓ Written to ${inputFile}`);

      // Process video (add audio/subtitle if needed)
      await processVideo(ffmpeg, inputFile, video.audioUrl, video.subtitle, processedFile, quality);
      await ffmpeg.deleteFile(inputFile);

      processedFiles.push(processedFile);

      if (onProgress) {
        const progress = Math.round((i + 1) / videos.length * 50);
        onProgress(progress);
      }
    }

    console.log(`\n✓ All videos processed: ${processedFiles.join(', ')}`);

    // Verify all processed files exist
    console.log('\n→ Verifying all processed files...');
    for (const file of processedFiles) {
      try {
        const fileData = await ffmpeg.readFile(file);
        console.log(`  ✓ ${file} exists (${fileData.length} bytes)`);
      } catch (e) {
        console.error(`  ✗ ${file} NOT FOUND!`, e);
        throw new Error(`Processed file missing: ${file}`);
      }
    }

    // If only one video, return it directly
    if (processedFiles.length === 1) {
      console.log('Only one video, returning directly...');
      const data = await ffmpeg.readFile(processedFiles[0]);
      const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data as any);
      await ffmpeg.deleteFile(processedFiles[0]);

      if (onProgress) onProgress(100);
      console.log(`✓ Export complete! File size: ${uint8Array.length} bytes`);
      return new Blob([uint8Array], { type: 'video/mp4' });
    }

    // Create concat list
    console.log('\n→ Concatenating multiple videos...');
    const concatList = processedFiles
      .map(file => `file '${file}'`)
      .join('\n');
    await ffmpeg.writeFile('concat.txt', concatList);
    console.log('✓ Concat list created:', concatList);

    // Concatenate all videos - use copy mode for speed
    console.log('Running ffmpeg concat...');
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy',  // Copy streams without re-encoding (faster)
      '-y',
      'output.mp4'
    ]);

    if (onProgress) onProgress(90);

    // Read output file
    console.log('Reading output file...');
    const data = await ffmpeg.readFile('output.mp4');
    const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data as any);
    console.log(`✓ Output file read, size: ${uint8Array.length} bytes`);

    // Clean up
    console.log('Cleaning up temporary files...');
    for (const file of processedFiles) {
      await ffmpeg.deleteFile(file);
    }
    await ffmpeg.deleteFile('concat.txt');
    await ffmpeg.deleteFile('output.mp4');
    console.log('✓ Cleanup complete');

    if (onProgress) onProgress(100);
    console.log(`\n✓✓✓ Export complete! Final file size: ${uint8Array.length} bytes\n`);

    return new Blob([uint8Array], { type: 'video/mp4' });
  } catch (error) {
    console.error('\n✗✗✗ FFmpeg composition error:', error);
    throw error;
  }
}

export async function addSubtitleToVideo(
  videoUrl: string,
  subtitle: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg(onProgress);

  try {
    // Write video file
    const videoData = await fetchFile(videoUrl);
    await ffmpeg.writeFile('input.mp4', videoData);

    // Add subtitle using drawtext filter
    const escapedSubtitle = subtitle.replace(/'/g, "\\\\'").replace(/:/g, '\\:');

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', `drawtext=text='${escapedSubtitle}':fontsize=32:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-text_h-50`,
      '-c:a', 'copy',
      'output.mp4'
    ]);

    // Read output
    const data = await ffmpeg.readFile('output.mp4');
    const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data as any);

    // Clean up
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');

    return new Blob([uint8Array], { type: 'video/mp4' });
  } catch (error) {
    console.error('FFmpeg subtitle error:', error);
    throw error;
  }
}

/**
 * DEPRECATED: Audio functionality removed to reduce export file size
 * This function is kept for reference but should not be used
 */
/*
export async function addAudioToVideo(
  videoUrl: string,
  audioUrl: string,
  volume: number = 0.5,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg(onProgress);

  try {
    // Write files
    const videoData = await fetchFile(videoUrl);
    const audioData = await fetchFile(audioUrl);
    await ffmpeg.writeFile('input.mp4', videoData);
    await ffmpeg.writeFile('audio.mp3', audioData);

    // Mix audio
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-i', 'audio.mp3',
      '-filter_complex', `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=first`,
      '-c:v', 'copy',
      'output.mp4'
    ]);

    // Read output
    const data = await ffmpeg.readFile('output.mp4');
    const uint8Array = data instanceof Uint8Array ? data : new Uint8Array(data as any);

    // Clean up
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('audio.mp3');
    await ffmpeg.deleteFile('output.mp4');

    return new Blob([uint8Array], { type: 'video/mp4' });
  } catch (error) {
    console.error('FFmpeg audio mixing error:', error);
    throw error;
  }
}
*/

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
