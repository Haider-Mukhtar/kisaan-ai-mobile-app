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

/**
 * Gemini emits signed 16-bit little-endian mono PCM at 24 kHz. The native
 * streaming player accepts 16, 44.1, or 48 kHz, so interpolate to 48 kHz.
 */
export function resamplePcm16Base64From24kTo48k(base64: string): string {
  if (!base64) {
    return "";
  }

  const sourceBytes = decodeBase64(base64);
  const sourceLength = Math.floor(sourceBytes.byteLength / 2);

  if (sourceLength === 0) {
    return "";
  }

  const sourceView = new DataView(
    sourceBytes.buffer,
    sourceBytes.byteOffset,
    sourceLength * 2,
  );
  const outputBytes = new Uint8Array(sourceLength * 4);
  const outputView = new DataView(outputBytes.buffer);

  for (let index = 0; index < sourceLength; index += 1) {
    const current = sourceView.getInt16(index * 2, true);
    const next =
      index + 1 < sourceLength
        ? sourceView.getInt16((index + 1) * 2, true)
        : current;
    const midpoint = Math.round((current + next) / 2);

    outputView.setInt16(index * 4, current, true);
    outputView.setInt16(index * 4 + 2, midpoint, true);
  }

  return encodeBase64(outputBytes);
}
