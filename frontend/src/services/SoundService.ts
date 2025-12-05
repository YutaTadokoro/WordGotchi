// Sound Service - Manages audio playback for WordGotchi
// Requirements: 5.4

/**
 * Sound Service for managing audio effects
 * 
 * This service provides methods to play sound effects for various game events.
 * Sounds are generated using the Web Audio API to avoid external dependencies.
 */
export class SoundService {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialize AudioContext lazily (requires user interaction)
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Initialize audio context (call after user interaction)
   */
  private ensureAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Play eating sound effect
   * A short, pleasant "nom" sound
   */
  playEatingSound(): void {
    if (this.isMuted) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      // Create a short, playful eating sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Quick chirp sound
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

      // Envelope
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.error('Error playing eating sound:', error);
    }
  }

  /**
   * Play evolution music
   * A triumphant, ascending melody
   */
  playEvolutionMusic(): void {
    if (this.isMuted) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      // Create a Japanese-inspired evolution melody
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.3 },   // C5
        { freq: 587.33, time: 0.3, duration: 0.3 },   // D5
        { freq: 659.25, time: 0.6, duration: 0.3 },   // E5
        { freq: 783.99, time: 0.9, duration: 0.3 },   // G5
        { freq: 880.00, time: 1.2, duration: 0.6 },   // A5
        { freq: 1046.50, time: 1.8, duration: 0.8 },  // C6 (climax)
      ];

      notes.forEach(note => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Use sine wave for a pure, bell-like tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

        // Envelope for each note
        gainNode.gain.setValueAtTime(0, ctx.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + note.duration);

        oscillator.start(ctx.currentTime + note.time);
        oscillator.stop(ctx.currentTime + note.time + note.duration);
      });

      // Add a reverb-like effect with a second layer
      notes.forEach(note => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(note.freq * 2, ctx.currentTime + note.time + 0.05);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + note.time + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + note.time + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + note.duration + 0.2);

        oscillator.start(ctx.currentTime + note.time + 0.05);
        oscillator.stop(ctx.currentTime + note.time + note.duration + 0.2);
      });
    } catch (error) {
      console.error('Error playing evolution music:', error);
    }
  }

  /**
   * Play ambient background music (optional)
   * A gentle, meditative loop
   */
  playAmbientMusic(): void {
    if (this.isMuted) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      // Create a gentle, ambient drone
      const oscillator1 = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Two oscillators for a richer sound
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      oscillator1.frequency.setValueAtTime(220, ctx.currentTime); // A3
      oscillator2.frequency.setValueAtTime(330, ctx.currentTime); // E4

      // Very low volume for ambient
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);

      oscillator1.start(ctx.currentTime);
      oscillator2.start(ctx.currentTime);

      // Stop after 10 seconds (can be extended or looped)
      oscillator1.stop(ctx.currentTime + 10);
      oscillator2.stop(ctx.currentTime + 10);
    } catch (error) {
      console.error('Error playing ambient music:', error);
    }
  }

  /**
   * Play a subtle UI interaction sound
   */
  playClickSound(): void {
    if (this.isMuted) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  }

  /**
   * Play completion sound when all words are eaten
   * A pleasant, satisfying melody
   */
  playCompletionSound(): void {
    if (this.isMuted) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      // Create a pleasant ascending melody
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.15 },   // C5
        { freq: 659.25, time: 0.15, duration: 0.15 },  // E5
        { freq: 783.99, time: 0.3, duration: 0.3 },    // G5
      ];

      notes.forEach(note => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

        gainNode.gain.setValueAtTime(0, ctx.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + note.time + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + note.duration);

        oscillator.start(ctx.currentTime + note.time);
        oscillator.stop(ctx.currentTime + note.time + note.duration);
      });
    } catch (error) {
      console.error('Error playing completion sound:', error);
    }
  }

  /**
   * Play emotion-specific sound
   */
  playEmotionSound(emotion: string): void {
    if (this.isMuted) return;
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      switch (emotion.toLowerCase()) {
        case 'joy':
          // 明るく跳ねる音
          this.playJoySound(ctx);
          break;
        case 'sadness':
          // 低く沈む音
          this.playSadnessSound(ctx);
          break;
        case 'anger':
          // 激しい音
          this.playAngerSound(ctx);
          break;
        case 'fear':
          // 不安な音
          this.playFearSound(ctx);
          break;
        case 'surprise':
          // 驚きの音
          this.playSurpriseSound(ctx);
          break;
        case 'disgust':
          // 不快な音
          this.playDisgustSound(ctx);
          break;
        case 'trust':
          // 温かい音
          this.playTrustSound(ctx);
          break;
        default:
          // ニュートラルな音
          this.playNeutralSound(ctx);
          break;
      }
    } catch (error) {
      console.error('Error playing emotion sound:', error);
    }
  }

  private playJoySound(ctx: AudioContext): void {
    // 明るく跳ねる音階
    const notes = [
      { freq: 523.25, time: 0.0 },   // C5
      { freq: 659.25, time: 0.1 },   // E5
      { freq: 783.99, time: 0.2 },   // G5
      { freq: 1046.50, time: 0.3 },  // C6
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + note.time);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + note.time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + 0.2);
      
      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + 0.2);
    });
  }

  private playSadnessSound(ctx: AudioContext): void {
    // 低く沈む音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  }

  private playAngerSound(ctx: AudioContext): void {
    // 激しい音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  private playFearSound(ctx: AudioContext): void {
    // 不安な音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    
    // 震える効果
    for (let i = 0; i < 10; i++) {
      const time = ctx.currentTime + i * 0.05;
      osc.frequency.setValueAtTime(600 + (i % 2) * 50, time);
    }
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }

  private playSurpriseSound(ctx: AudioContext): void {
    // 驚きの音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  private playDisgustSound(ctx: AudioContext): void {
    // 不快な音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  private playTrustSound(ctx: AudioContext): void {
    // 温かい音
    const notes = [
      { freq: 523.25, time: 0.0 },   // C5
      { freq: 659.25, time: 0.2 },   // E5
      { freq: 523.25, time: 0.4 },   // C5
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + note.time);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + note.time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + 0.3);
      
      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + 0.3);
    });
  }

  private playNeutralSound(ctx: AudioContext): void {
    // ニュートラルな音
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  /**
   * Mute/unmute all sounds
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Check if sounds are muted
   */
  isSoundMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Resume audio context (needed for some browsers)
   */
  async resumeAudioContext(): Promise<void> {
    const ctx = this.ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }
}

// Export singleton instance
export const soundService = new SoundService();
