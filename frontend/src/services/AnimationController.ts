// AnimationController - Manages all animations in the application
// Requirements: 1.2, 1.3, 1.4, 5.4, 10.2, 10.3

import type {
  AnimationController as IAnimationController,
  Point,
  Rect,
  WordPosition,
  EmotionVector,
} from '../types';

// ============================================================================
// Constants
// ============================================================================

const WORD_ANIMATION_DURATION = 800; // milliseconds
const EATING_ANIMATION_DURATION = 300; // milliseconds
const EMOTE_ANIMATION_DURATION = 2000; // milliseconds (max 2 seconds per requirements)
const EVOLUTION_ANIMATION_DURATION = 3000; // milliseconds

// ============================================================================
// AnimationController Class
// ============================================================================

export class AnimationController implements IAnimationController {
  private canvasElement: HTMLElement | null = null;
  private gotchiElement: HTMLElement | null = null;
  private floatingAnimationId: number | null = null;

  /**
   * Set the canvas element for animations
   */
  setCanvasElement(element: HTMLElement) {
    this.canvasElement = element;
  }

  /**
   * Set the Gotchi element for animations
   */
  setGotchiElement(element: HTMLElement) {
    this.gotchiElement = element;
  }

  /**
   * Scatter words randomly within canvas bounds
   * Requirements: 1.1, 6.5
   */
  scatterWords(words: string[], canvasBounds: Rect): WordPosition[] {
    const positions: WordPosition[] = [];
    const minDistance = 60; // Minimum distance between words to avoid overlap

    for (const word of words) {
      let attempts = 0;
      let position: Point;

      // Try to find a non-overlapping position
      do {
        position = {
          x: canvasBounds.x + Math.random() * (canvasBounds.width - 100) + 50,
          y: canvasBounds.y + Math.random() * (canvasBounds.height - 100) + 50,
        };
        attempts++;
      } while (
        attempts < 50 &&
        positions.some(
          (p) =>
            Math.sqrt(Math.pow(p.position.x - position.x, 2) + Math.pow(p.position.y - position.y, 2)) <
            minDistance
        )
      );

      positions.push({
        word,
        position,
      });
    }

    return positions;
  }

  /**
   * Animate a word moving from one point to another using bezier curve
   * Requirements: 1.2, 10.2
   */
  async animateWordToGotchi(word: string, from: Point, to: Point): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = WORD_ANIMATION_DURATION;

      // Calculate bezier curve control points for organic movement
      const controlPoint1: Point = {
        x: from.x + (to.x - from.x) * 0.25 + (Math.random() - 0.5) * 100,
        y: from.y - 100, // Arc upward
      };
      const controlPoint2: Point = {
        x: from.x + (to.x - from.x) * 0.75 + (Math.random() - 0.5) * 100,
        y: to.y - 50,
      };

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Cubic bezier curve calculation
        const t = progress;
        const oneMinusT = 1 - t;
        const oneMinusTSquared = oneMinusT * oneMinusT;
        const oneMinusTCubed = oneMinusTSquared * oneMinusT;
        const tSquared = t * t;
        const tCubed = tSquared * t;

        // Calculate position on bezier curve
        const x =
          oneMinusTCubed * from.x +
          3 * oneMinusTSquared * t * controlPoint1.x +
          3 * oneMinusT * tSquared * controlPoint2.x +
          tCubed * to.x;

        const y =
          oneMinusTCubed * from.y +
          3 * oneMinusTSquared * t * controlPoint1.y +
          3 * oneMinusT * tSquared * controlPoint2.y +
          tCubed * to.y;

        // This would update the word element position
        // In practice, this will be handled by the component using this controller
        // For now, we just calculate the trajectory

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Play eating animation when Gotchi consumes a word
   * Requirements: 1.3
   */
  async playEatingAnimation(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = EATING_ANIMATION_DURATION;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Simple scale animation - grow then shrink
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;

        // This would update the Gotchi element scale
        // In practice, this will be handled by the component

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Play emotion-specific emote animation
   * Requirements: 1.4, 1.5, 10.3
   */
  async playEmote(emotion: string): Promise<void> {
    const duration = EMOTE_ANIMATION_DURATION;

    switch (emotion.toLowerCase()) {
      case 'joy':
        return this.playJoyEmote(duration);
      case 'sadness':
        return this.playSadnessEmote(duration);
      case 'anger':
        return this.playAngerEmote(duration);
      case 'fear':
        return this.playFearEmote(duration);
      case 'surprise':
        return this.playSurpriseEmote(duration);
      case 'disgust':
        return this.playDisgustEmote(duration);
      case 'trust':
        return this.playTrustEmote(duration);
      default:
        return this.playNeutralEmote(duration);
    }
  }

  /**
   * Joy emote: jumping animation
   * Requirements: 1.5
   */
  private async playJoyEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Multiple jumps using sine wave
        const jumpCount = 3;
        const jumpHeight = 40;
        const yOffset = -Math.abs(Math.sin(progress * Math.PI * jumpCount)) * jumpHeight;

        // This would update the Gotchi position
        // In practice, this will be handled by the component

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Sadness emote: sinking animation
   * Requirements: 1.4
   */
  private async playSadnessEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Slow sink down and back up
        const sinkDepth = 30;
        const yOffset = Math.sin(progress * Math.PI) * sinkDepth;

        // This would update the Gotchi position
        // In practice, this will be handled by the component

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Anger emote: shaking animation
   * Requirements: 1.4
   */
  private async playAngerEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Rapid shaking
        const shakeIntensity = 10;
        const shakeFrequency = 20;
        const xOffset = Math.sin(progress * Math.PI * shakeFrequency) * shakeIntensity * (1 - progress);

        // This would update the Gotchi position
        // In practice, this will be handled by the component

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Fear emote: trembling animation
   */
  private async playFearEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Small trembling motion
        const trembleIntensity = 5;
        const trembleFrequency = 30;
        const xOffset = Math.sin(progress * Math.PI * trembleFrequency) * trembleIntensity;
        const yOffset = Math.cos(progress * Math.PI * trembleFrequency) * trembleIntensity;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Surprise emote: sudden expansion
   */
  private async playSurpriseEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Quick expansion then return to normal
        const scale = progress < 0.3 ? 1 + progress * 2 : 1 + (1 - progress) * 0.3;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Disgust emote: recoiling motion
   */
  private async playDisgustEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Recoil backward
        const recoilDistance = 20;
        const xOffset = Math.sin(progress * Math.PI) * recoilDistance;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Trust emote: gentle pulsing
   */
  private async playTrustEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Gentle pulsing glow
        const pulseCount = 2;
        const glowIntensity = 0.5 + Math.sin(progress * Math.PI * pulseCount) * 0.3;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Neutral emote: subtle bob
   */
  private async playNeutralEmote(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Subtle bobbing motion
        const bobHeight = 10;
        const yOffset = Math.sin(progress * Math.PI * 2) * bobHeight;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Start floating animation (idle animation)
   * Requirements: 6.2, 10.5
   */
  startFloatingAnimation(): void {
    // This is already implemented in Canvas component
    // This method is here for interface compliance
  }

  /**
   * Stop floating animation
   */
  stopFloatingAnimation(): void {
    if (this.floatingAnimationId !== null) {
      cancelAnimationFrame(this.floatingAnimationId);
      this.floatingAnimationId = null;
    }
  }

  /**
   * Play evolution animation
   * Requirements: 5.4
   */
  async playEvolutionAnimation(fromStage: number, toStage: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = EVOLUTION_ANIMATION_DURATION;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          resolve();
          return;
        }

        // Screen-wide light effect
        // This will be implemented in the component
        // For now, we just track the animation progress

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Update glow effect based on emotion vector
   * Requirements: 6.4
   */
  updateGlowEffect(emotionVector: EmotionVector): void {
    // This is handled by the GlowEffect component
    // This method is here for interface compliance
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const animationController = new AnimationController();
