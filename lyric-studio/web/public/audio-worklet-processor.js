/**
 * RecorderProcessor — collects Float32 PCM frames from the microphone
 * and posts them to the main thread as transferable Float32Arrays.
 * The main thread assembles them into a WAV blob.
 */
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._active = true;
    this.port.onmessage = (e) => {
      if (e.data === "stop") this._active = false;
    };
  }

  process(inputs) {
    if (!this._active) return false;
    const input = inputs[0];
    if (input && input.length > 0 && input[0].length > 0) {
      // Copy channel 0 (mono). Slice needed because the buffer is reused.
      const chunk = input[0].slice();
      this.port.postMessage(chunk, [chunk.buffer]);
    }
    return true;
  }
}

registerProcessor("recorder-processor", RecorderProcessor);
