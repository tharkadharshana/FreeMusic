/**
 * Web Audio API engine for real-time audio playback, synthesized demos,
 * caution alert sounds, and frequency analysis.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeOscillators: (OscillatorNode | GainNode)[] = [];
  private isSynthesizing = false;
  private synthInterval: number | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext();
    return this.analyser;
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  /**
   * Dual-tone red alert caution chime
   */
  public playCautionAlert() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const alertGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Harsh caution frequencies (880Hz -> 440Hz alert)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(330, now + 0.18);

      alertGain.gain.setValueAtTime(0.2, now);
      alertGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(alertGain);
      osc2.connect(alertGain);
      alertGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (err) {
      console.warn('Audio alert unavailable:', err);
    }
  }

  /**
   * Starts a musical synth simulation corresponding to the track's vibe/BPM
   */
  public startTrackSynth(profile: 'pop' | 'rock' | 'ambient' | 'synthwave' | 'acoustic', onTick?: (seconds: number) => void) {
    this.stopSynth();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isSynthesizing = true;
    let step = 0;
    const bpm = profile === 'rock' ? 130 : profile === 'pop' ? 120 : profile === 'synthwave' ? 110 : 85;
    const intervalMs = (60 / bpm) * 1000 * 0.5; // Eighth-notes

    // Scale notes
    const chordsByProfile = {
      pop: [
        [261.63, 329.63, 392.00], // C
        [220.00, 261.63, 329.63], // Am
        [174.61, 220.00, 261.63], // F
        [196.00, 246.94, 293.66], // G
      ],
      rock: [
        [164.81, 246.94, 329.63], // E power
        [220.00, 329.63, 440.00], // A power
        [196.00, 293.66, 392.00], // G
        [146.83, 220.00, 293.66], // D
      ],
      synthwave: [
        [130.81, 196.00, 261.63], // C minor
        [155.56, 233.08, 311.13], // Eb
        [116.54, 174.61, 233.08], // Bb
        [174.61, 261.63, 349.23], // F
      ],
      ambient: [
        [220.00, 277.18, 329.63],
        [174.61, 220.00, 261.63],
        [196.00, 246.94, 293.66],
        [146.83, 185.00, 220.00],
      ],
      acoustic: [
        [261.63, 329.63, 392.00],
        [196.00, 246.94, 293.66],
        [220.00, 261.63, 329.63],
        [174.61, 220.00, 261.63],
      ],
    };

    const currentChords = chordsByProfile[profile];
    let elapsedSeconds = 0;

    this.synthInterval = window.setInterval(() => {
      if (!this.isSynthesizing || !this.ctx || !this.masterGain) return;

      const chordIndex = Math.floor(step / 8) % currentChords.length;
      const chord = currentChords[chordIndex];
      const noteFreq = chord[step % chord.length];

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = profile === 'rock' ? 'sawtooth' : profile === 'pop' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(noteFreq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) * 0.95);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + (intervalMs / 1000) * 0.95);

      step++;
      elapsedSeconds += intervalMs / 1000;
      if (onTick) {
        onTick(Math.round(elapsedSeconds));
      }
    }, intervalMs);
  }

  public stopSynth() {
    this.isSynthesizing = false;
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public async startMicrophoneCapture(): Promise<boolean> {
    try {
      this.initContext();
      if (!this.ctx || !this.analyser) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser);
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return false;
    }
  }

  public stopMicrophoneCapture() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  public getEnergyLevel(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / data.length / 255;
  }
}

export const audioEngine = new AudioEngine();
