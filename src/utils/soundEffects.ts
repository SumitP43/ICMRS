/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// AudioContext singleton to avoid re-creation overhead and browser restrictions
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignored until user interaction unlocks audio
    });
  }
  return audioCtx;
}

// Unlock audio on first user gesture
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}

const STORAGE_SOUND_KEY = 'icmrs_officer_sound_enabled';

/**
 * Checks if browser sound notifications are enabled by the officer.
 * Defaults to true.
 */
export function isOfficerSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(STORAGE_SOUND_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

/**
 * Update the officer sound notification preference.
 */
export function setOfficerSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SOUND_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('[Sound] Could not save preference:', err);
  }
}

/**
 * Plays a subtle, pleasant municipal chime for newly filed civic complaints.
 * Tuned with dual soft harmonics (F#5 -> A5) and gentle exponential decay.
 */
export function playNewComplaintChime(): void {
  if (!isOfficerSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gain node for subtle, non-intrusive volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    masterGain.connect(ctx.destination);

    // Note 1: F#5 (739.99 Hz) - warm sine
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, now);
    osc1.connect(masterGain);

    // Note 2: A5 (880.00 Hz) - starts 80ms later for melodic harmony
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.00, now + 0.08);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.14, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.48);
  } catch (err) {
    console.warn('[Sound] Web Audio new complaint chime notice:', err);
  }
}

/**
 * Plays an alert chime when an existing complaint is escalated in priority.
 * Three ascending energetic tones (E5 -> G#5 -> B5) signifying urgency while remaining refined.
 */
export function playEscalationChime(): void {
  if (!isOfficerSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    masterGain.connect(ctx.destination);

    const notes = [
      { freq: 659.25, time: 0.00, dur: 0.16 }, // E5
      { freq: 830.61, time: 0.10, dur: 0.18 }, // G#5
      { freq: 987.77, time: 0.20, dur: 0.35 }, // B5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.15, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (err) {
    console.warn('[Sound] Web Audio escalation chime notice:', err);
  }
}
