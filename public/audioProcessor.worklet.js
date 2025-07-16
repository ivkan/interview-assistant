/**
 * Audio Worklet Processor for Google Speech-to-Text
 * Handles audio processing in a separate thread for optimal performance
 * Converts Float32Array audio data to Int16Array (LINEAR16) format
 */
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Configuration - increased buffer size to reduce frequency of data sends
    this.bufferSize = 8192; // Increased from 2048 to reduce frequency
    this.inputSampleRate = sampleRate; // AudioContext sample rate (usually 48000)
    this.outputSampleRate = 16000; // Google Speech requirement
    
    // Buffer management
    this._buffer = new Float32Array(this.bufferSize);
    this._bytesWritten = 0;
    
    // Send configuration to main thread
    this.port.postMessage({
      type: 'config',
      sampleRate: this.outputSampleRate
    });
  }

  /**
   * Process incoming audio data
   * @param {Float32Array[][]} inputs - Input audio data
   * @param {Float32Array[][]} outputs - Output audio data (unused)
   * @param {Object} parameters - Audio parameters (unused)
   * @returns {boolean} - Keep processor alive
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    // Handle mono audio (use first channel)
    if (input.length > 0) {
      const channelData = input[0];
      this.appendToBuffer(channelData);
    }
    
    // Keep processor alive
    return true;
  }

  /**
   * Append audio data to internal buffer
   * @param {Float32Array} channelData - Single channel audio data
   */
  appendToBuffer(channelData) {
    if (!channelData) return;
    
    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bytesWritten++] = channelData[i];
      
      // Flush when buffer is full
      if (this._bytesWritten >= this.bufferSize) {
        this.flush();
      }
    }
  }

  /**
   * Flush buffer and send processed audio to main thread
   */
  flush() {
    // Get the actual data (trim if not full)
    const floatData = this._bytesWritten < this.bufferSize
      ? this._buffer.slice(0, this._bytesWritten)
      : this._buffer;
    
    // Downsample and convert to Int16
    const int16Data = this.downsampleAndConvert(
      floatData,
      this.inputSampleRate,
      this.outputSampleRate
    );
    
    // Send as ArrayBuffer to main thread
    this.port.postMessage({
      type: 'audio',
      data: int16Data,
      sampleRate: this.outputSampleRate
    });
    
    // Reset buffer
    this._bytesWritten = 0;
  }

  /**
   * Downsample audio and convert to Int16Array
   * @param {Float32Array} buffer - Input audio buffer
   * @param {number} inputRate - Input sample rate
   * @param {number} outputRate - Output sample rate
   * @returns {ArrayBuffer} - Downsampled Int16 audio data
   */
  downsampleAndConvert(buffer, inputRate, outputRate) {
    if (outputRate === inputRate) {
      // Just convert to Int16
      return this.convertToInt16(buffer);
    }
    
    if (outputRate > inputRate) {
      throw new Error('Output sample rate must be less than or equal to input sample rate');
    }
    
    // Calculate downsampling ratio
    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;
    
    // Downsample using interpolation
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      
      // Average samples in the window
      let sum = 0;
      let count = 0;
      
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        sum += buffer[i];
        count++;
      }
      
      // Convert averaged float sample to int16
      const avgSample = count > 0 ? sum / count : 0;
      result[offsetResult] = this.floatToInt16(avgSample);
      
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    
    return result.buffer;
  }

  /**
   * Convert Float32Array to Int16Array
   * @param {Float32Array} floatData - Input float data
   * @returns {ArrayBuffer} - Int16 array buffer
   */
  convertToInt16(floatData) {
    const int16Data = new Int16Array(floatData.length);
    
    for (let i = 0; i < floatData.length; i++) {
      int16Data[i] = this.floatToInt16(floatData[i]);
    }
    
    return int16Data.buffer;
  }

  /**
   * Convert single float sample to int16
   * @param {number} sample - Float sample (-1.0 to 1.0)
   * @returns {number} - Int16 sample (-32768 to 32767)
   */
  floatToInt16(sample) {
    // Clamp to prevent overflow
    const clamped = Math.max(-1, Math.min(1, sample));
    // Convert to int16 range
    return Math.round(clamped * 32767);
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);