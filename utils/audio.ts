'use client';

/**
 * Handles playing a silent audio loop to keep the browser awake on mobile devices (bypassing setTimeout throttling)
 * and plays a subtle "beep" when the timer completes.
 */

let audioContext: AudioContext | null = null;
let silentOscillator: OscillatorNode | null = null;
let silenceGain: GainNode | null = null;

function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

export function startSilentAudioLoop() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    if (silentOscillator) {
        silentOscillator.stop();
        silentOscillator.disconnect();
    }
    if (silenceGain) {
        silenceGain.disconnect();
    }

    // Create an inaudible high-frequency oscillator
    silentOscillator = ctx.createOscillator();
    silentOscillator.type = 'sine';
    silentOscillator.frequency.value = 20000; // 20kHz is mostly inaudible

    silenceGain = ctx.createGain();
    silenceGain.gain.value = 0.01; // extremely low volume

    silentOscillator.connect(silenceGain);
    silenceGain.connect(ctx.destination);

    silentOscillator.start();
}

export function stopSilentAudioLoop() {
    if (silentOscillator) {
        try {
            silentOscillator.stop();
            silentOscillator.disconnect();
        } catch (e) {
            // Ignore if already stopped
        }
        silentOscillator = null;
    }
    if (silenceGain) {
        silenceGain.disconnect();
        silenceGain = null;
    }
}

export function playTimerCompleteBeep() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    // Play a pleasant double beep
    const playBeep = (startTime: number, freq: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playBeep(now, 600, 0.2);
    playBeep(now + 0.3, 800, 0.4);
}
