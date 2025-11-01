export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The byte length of the buffer must be a multiple of 2 to create an Int16Array.
  // If it's not, it's likely due to a slight imperfection in the stream.
  // We can safely truncate the last byte to make it even.
  const bufferForInt16 = data.byteLength % 2 === 0 ? data.buffer : data.buffer.slice(0, data.byteLength - 1);

  const dataInt16 = new Int16Array(bufferForInt16);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function concatAudioBuffers(buffers: AudioBuffer[], context: AudioContext): AudioBuffer {
    if (!buffers || buffers.length === 0) {
        return context.createBuffer(1, 1, context.sampleRate);
    }

    const numberOfChannels = Math.max(...buffers.map(buffer => buffer.numberOfChannels));
    const totalLength = buffers.map(buffer => buffer.length).reduce((a, b) => a + b, 0);
    const concatenatedBuffer = context.createBuffer(numberOfChannels, totalLength, buffers[0].sampleRate);

    let offset = 0;
    for (const buffer of buffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = concatenatedBuffer.getChannelData(channel);
            // If the current buffer has data for this channel, copy it
            if (channel < buffer.numberOfChannels) {
                channelData.set(buffer.getChannelData(channel), offset);
            }
        }
        offset += buffer.length;
    }

    return concatenatedBuffer;
}