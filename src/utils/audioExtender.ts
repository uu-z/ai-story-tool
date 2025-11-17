/**
 * Extends audio to a target duration by padding with silence at the end
 * Uses Web Audio API to decode, extend, and re-encode audio
 *
 * @param audioDataUrl - Base64 data URL of the audio (e.g., "data:audio/mpeg;base64,...")
 * @param targetDuration - Target duration in seconds (default: 5)
 * @returns Promise<string> - Extended audio as base64 data URL
 */
export async function extendAudioToTargetDuration(
  audioDataUrl: string,
  targetDuration: number = 5
): Promise<string> {
  try {
    // Convert data URL to array buffer
    const base64Data = audioDataUrl.split(',')[1];
    const binaryData = atob(base64Data);
    const arrayBuffer = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      arrayBuffer[i] = binaryData.charCodeAt(i);
    }

    // Create audio context
    const audioContext = new AudioContext();

    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.buffer);

    const originalDuration = audioBuffer.duration;
    console.log(`Original audio duration: ${originalDuration.toFixed(2)}s, target: ${targetDuration}s`);

    // If audio is already long enough, return as-is
    if (originalDuration >= targetDuration) {
      console.log('Audio already meets target duration');
      audioContext.close();
      return audioDataUrl;
    }

    // Create a new buffer with target duration
    const extendedBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      Math.ceil(targetDuration * audioBuffer.sampleRate),
      audioBuffer.sampleRate
    );

    // Copy original audio data to the new buffer
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const originalData = audioBuffer.getChannelData(channel);
      const extendedData = extendedBuffer.getChannelData(channel);

      // Copy original audio
      extendedData.set(originalData);

      // The rest of the buffer is already zeroed (silence) by default
    }

    // Convert the extended buffer back to a data URL
    const extendedDataUrl = await audioBufferToDataUrl(extendedBuffer);

    audioContext.close();

    console.log(`Audio extended to ${targetDuration}s with silence padding`);
    return extendedDataUrl;
  } catch (error) {
    console.error('Failed to extend audio:', error);
    // Return original audio if extension fails
    return audioDataUrl;
  }
}

/**
 * Converts an AudioBuffer to a WAV data URL
 * WAV format is used because it's simple and widely supported
 */
async function audioBufferToDataUrl(audioBuffer: AudioBuffer): Promise<string> {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  // Create WAV file
  const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(wavBuffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  // Convert to base64 data URL
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const base64 = await blobToBase64(blob);

  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
