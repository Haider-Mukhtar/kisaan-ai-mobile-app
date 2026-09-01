const BYTE_STRING_CHUNK_SIZE = 8_192;

function decodeBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += BYTE_STRING_CHUNK_SIZE) {
    const chunk = bytes.subarray(
      offset,
      Math.min(offset + BYTE_STRING_CHUNK_SIZE, bytes.length),
    );

    for (let index = 0; index < chunk.length; index += 1) {
      binary += String.fromCharCode(chunk[index]);
    }
  }

  return globalThis.btoa(binary);
}

/** Converts Gemini's signed 16-bit little-endian PCM into Web Audio samples. */
export function pcm16Base64ToFloat32(
  base64: string,
): Float32Array<ArrayBuffer> {
  if (!base64) {
    return new Float32Array(0);
  }

  const sourceBytes = decodeBase64(base64);
  const sourceLength = Math.floor(sourceBytes.byteLength / 2);

  if (sourceLength === 0) {
    return new Float32Array(0);
  }

  const sourceView = new DataView(
    sourceBytes.buffer,
    sourceBytes.byteOffset,
    sourceLength * 2,
  );
  const samples = new Float32Array(sourceLength);

  for (let index = 0; index < sourceLength; index += 1) {
    const sample = sourceView.getInt16(index * 2, true);
    samples[index] = sample < 0 ? sample / 32_768 : sample / 32_767;
  }

  return samples;
}

/** Converts normalized microphone samples to signed 16-bit LE PCM base64. */
export function float32ToPcm16Base64(
  samples: Float32Array<ArrayBufferLike>,
): string {
  if (samples.length === 0) {
    return "";
  }

  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    const pcm16 =
      clamped < 0 ? Math.round(clamped * 32_768) : Math.round(clamped * 32_767);
    view.setInt16(index * 2, pcm16, true);
  }

  return encodeBase64(bytes);
}

/** Resamples mono float PCM when a device cannot provide the requested rate. */
export function resampleFloat32(
  samples: Float32Array<ArrayBufferLike>,
  sourceRate: number,
  targetRate: number,
): Float32Array<ArrayBuffer> {
  if (
    samples.length === 0 ||
    sourceRate <= 0 ||
    targetRate <= 0 ||
    sourceRate === targetRate
  ) {
    return new Float32Array(samples);
  }

  const outputLength = Math.max(
    1,
    Math.round((samples.length * targetRate) / sourceRate),
  );
  const output = new Float32Array(outputLength);
  const ratio = sourceRate / targetRate;

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * ratio;
    const leftIndex = Math.min(Math.floor(sourcePosition), samples.length - 1);
    const rightIndex = Math.min(leftIndex + 1, samples.length - 1);
    const fraction = sourcePosition - leftIndex;
    output[index] =
      samples[leftIndex] +
      (samples[rightIndex] - samples[leftIndex]) * fraction;
  }

  return output;
}
