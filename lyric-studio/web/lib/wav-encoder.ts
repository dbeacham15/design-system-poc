export const WAV_HEADER_SIZE = 44;

export function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + totalSamples * 4);
  const view = new DataView(buffer);

  function writeStr(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  const byteRate = sampleRate * 4; // 1 channel * 4 bytes/sample
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + totalSamples * 4, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);       // PCM chunk size
  view.setUint16(20, 3, true);        // IEEE float
  view.setUint16(22, 1, true);        // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 4, true);        // block align
  view.setUint16(34, 32, true);       // bits per sample
  writeStr(36, "data");
  view.setUint32(40, totalSamples * 4, true);

  let offset = WAV_HEADER_SIZE;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      view.setFloat32(offset, chunk[i], true);
      offset += 4;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}
