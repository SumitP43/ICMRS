/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Audio Notification Service for ICMRS Admin Portal
 * Uses the browser-native Web Audio API without external libraries or audio files.
 */

const STORAGE_MUTE_KEY = 'icmrs_admin_audio_muted';

type MuteListener = (muted: boolean) => void;
const muteListeners: Set<MuteListener> = new Set();

let sharedAudioContext: AudioContext | null = null;
let isAudioUnlocked = false;

/**
 * Safely retrieves or initializes the singleton AudioContext.
 * Reuses the existing instance to prevent resource leaks and avoid browser limits.
 */
function getOrCreateAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!sharedAudioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioContext = new AudioContextClass();
      }
    }

    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {
        // Expected until user interaction unlocks audio playback
      });
    }

    return sharedAudioContext;
  } catch (err) {
    console.warn('[AudioNotificationService] Web Audio API initialization notice:', err);
    return null;
  }
}

/**
 * Unlocks the audio context on user interaction (pointerdown, click, keydown).
 * Modern browsers block automatic audio until a user gesture occurs.
 */
export function unlockAudio(): boolean {
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
      return true;
    }
    if (ctx && ctx.state === 'running') {
      isAudioUnlocked = true;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Auto-register one-time unlock listeners on the document for seamless UX
if (typeof window !== 'undefined') {
  const handleInteraction = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', handleInteraction);
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('keydown', handleInteraction);
  };

  window.addEventListener('pointerdown', handleInteraction, { once: true, passive: true });
  window.addEventListener('click', handleInteraction, { once: true, passive: true });
  window.addEventListener('keydown', handleInteraction, { once: true, passive: true });
}

/**
 * Checks if the Admin Portal audio is currently muted.
 * Persists in localStorage under `icmrs_admin_audio_muted`. Default is unmuted (false).
 */
export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(STORAGE_MUTE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets the muted state and persists to localStorage.
 * Notifies all active subscribers across the UI.
 */
export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_MUTE_KEY, muted ? 'true' : 'false');
    muteListeners.forEach(listener => listener(muted));
  } catch (err) {
    console.warn('[AudioNotificationService] Could not persist mute preference:', err);
  }
}

/**
 * Toggles the current muted state and returns the new state.
 */
export function toggleMuted(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

/**
 * Subscribes a UI component to changes in the mute preference.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeMuteChange(listener: MuteListener): () => void {
  muteListeners.add(listener);
  return () => {
    muteListeners.delete(listener);
  };
}

/**
 * 1. NEW COMPLAINT CHIME
 * Specification:
 * - Tone 1: F#5 (739.99 Hz)
 * - Tone 2: A5 (880.00 Hz)
 * - Double-harmonic chime
 * - Soft, professional municipal command sound with exponential gain decay
 * - Short duration (~0.45s)
 */
export function playNewComplaintChime(force = false): boolean {
  if (!force && isMuted()) return false;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return false;

    const now = ctx.currentTime;

    // Master gain node with exponential decay
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    masterGain.connect(ctx.destination);

    // Tone 1: F#5 (739.99 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, now);
    osc1.connect(masterGain);

    // Tone 2: A5 (880.00 Hz) - staggered slightly by 70ms for harmonic resonance
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle'; // adds warm double-harmonic overtone
    osc2.frequency.setValueAtTime(880.00, now + 0.07);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.14, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    osc2.start(now + 0.07);
    osc2.stop(now + 0.45);

    return true;
  } catch (err) {
    console.warn('[AudioNotificationService] New complaint chime playback prevented:', err);
    return false;
  }
}

/**
 * 2. CRITICAL ESCALATION CHIME
 * Specification:
 * - Tone 1: E5 (659.25 Hz)
 * - Tone 2: G#5 (830.61 Hz)
 * - Tone 3: B5 (987.77 Hz)
 * - Three ascending tones
 * - Crisp but professional municipal command sound
 * - Slightly more noticeable than normal chime, short duration (~0.55s)
 */
export function playCriticalEscalationChime(force = false): boolean {
  if (!force && isMuted()) return false;

  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return false;

    const now = ctx.currentTime;

    // Master gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
    masterGain.connect(ctx.destination);

    // Three ascending tones: E5 -> G#5 -> B5
    const notes = [
      { freq: 659.25, timeOffset: 0.00, duration: 0.16 }, // E5
      { freq: 830.61, timeOffset: 0.10, duration: 0.18 }, // G#5
      { freq: 987.77, timeOffset: 0.20, duration: 0.35 }, // B5
    ];

    notes.forEach(({ freq, timeOffset, duration }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      noteGain.gain.setValueAtTime(0.15, now + timeOffset);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + duration);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + duration + 0.04);
    });

    return true;
  } catch (err) {
    console.warn('[AudioNotificationService] Critical escalation chime playback prevented:', err);
    return false;
  }
}
