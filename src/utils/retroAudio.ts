// Web Audio API Cinematic Spatial Sound Synthesizer
// Generates ambient cinematic chime tones, volumetric harmonic swells, and tactile interface feedback

class CinematicAudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    try {
      const stored = localStorage.getItem('citymind_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('citymind_sound_enabled', String(enabled));
    } catch {}
  }

  // Play a rich, cinematic sound effect based on notification severity
  public play(severity: 'CRITICAL' | 'WARNING' | 'EVENT' | 'INFO' | 'DISMISS' | 'CLICK') {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (severity === 'CRITICAL') {
        // Dramatic cinematic alert: Deep bass foundation + two-tone resonant siren
        // Sub bass pulse
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(110, now);
        subOsc.frequency.exponentialRampToValueAtTime(73.4, now + 0.5);
        subGain.gain.setValueAtTime(0.18, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.55);

        // High alert harmonics
        const highOsc = ctx.createOscillator();
        const highGain = ctx.createGain();
        highOsc.type = 'triangle';
        highOsc.frequency.setValueAtTime(587.33, now); // D5
        highOsc.frequency.setValueAtTime(440.0, now + 0.18); // A4
        highOsc.frequency.setValueAtTime(587.33, now + 0.36);
        highGain.gain.setValueAtTime(0.12, now);
        highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        highOsc.connect(highGain);
        highGain.connect(ctx.destination);
        highOsc.start(now);
        highOsc.stop(now + 0.55);
      } else if (severity === 'WARNING') {
        // Cinematic warm amber chime: Dual sine chord (E5 + B5)
        const chord = [659.25, 987.77];
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        });
      } else if (severity === 'EVENT') {
        // Cinematic harmonic arpeggio: Pure glass harmonics (F5, A5, C6, E6)
        const notes = [698.46, 880.0, 1046.5, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = now + idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.07, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.35);
        });
      } else if (severity === 'INFO') {
        // Soft futuristic spatial interface chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (severity === 'DISMISS' || severity === 'CLICK') {
        // Subtle haptic glass tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(severity === 'DISMISS' ? 440 : 660, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // Audio fails gracefully if user hasn't interacted
    }
  }
}

export const retroAudio = new CinematicAudioSynthesizer();
