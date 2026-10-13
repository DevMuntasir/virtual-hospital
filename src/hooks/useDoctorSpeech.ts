import { useEffect, useRef, useState } from 'react';

export const restingFace = { open: 0, round: 0, emphasis: 0 };

/** Audio energy controls the jaw; spectral balance adds rounded/spread lips.
 * This is audio-reactive animation, not phoneme alignment. Browser TTS exposes
 * no PCM, so its fallback uses word boundaries and an estimated syllable rhythm.
 */
export function useDoctorSpeech() {
  const [face, setFace] = useState(restingFace);
  const context = useRef<AudioContext | null>(null);
  const frame = useRef(0);
  const release = useRef<(() => void) | null>(null);

  const stop = () => {
    cancelAnimationFrame(frame.current);
    release.current?.();
    release.current = null;
    const current = context.current;
    context.current = null;
    if (current && current.state !== 'closed') void current.close().catch(() => {});
    setFace(restingFace);
  };

  // Call during the user gesture, before waiting for the TTS request.
  const prepare = () => {
    try {
      const current = new AudioContext();
      context.current = current;
      void current.resume().catch(() => {});
    } catch { /* Audio playback still works without Web Audio. */ }
  };

  const follow = (audio: HTMLAudioElement) => {
    const current = context.current;
    if (!current || current.state !== 'running') return false;
    let source: MediaElementAudioSourceNode | undefined;
    try {
      const analyser = current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.35;
      source = current.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(current.destination);
      release.current = () => { source?.disconnect(); analyser.disconnect(); };
      const wave = new Float32Array(analyser.fftSize);
      const spectrum = new Uint8Array(analyser.frequencyBinCount);
      let opening = 0;
      let previous = 0;
      const tick = (now: number) => {
        if (now - previous >= 32) {
          previous = now;
          analyser.getFloatTimeDomainData(wave);
          analyser.getByteFrequencyData(spectrum);
          const rms = Math.sqrt(wave.reduce((sum, sample) => sum + sample * sample, 0) / wave.length);
          const target = audio.paused || audio.ended || rms < 0.009 ? 0 : Math.min(1, (rms - 0.009) * 8);
          opening += (target - opening) * (target > opening ? 0.8 : 0.6);
          let low = 0;
          let high = 0;
          for (let i = 1; i < spectrum.length; i++) {
            const hz = i * current.sampleRate / analyser.fftSize;
            if (hz < 1000) low += spectrum[i];
            else if (hz < 4000) high += spectrum[i];
          }
          setFace({ open: opening < 0.015 ? 0 : opening, round: low / (low + high + 1), emphasis: target });
        }
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
      return true;
    } catch {
      // If routing was already created, preserve audible playback on failure.
      source?.disconnect();
      source?.connect(current.destination);
      return false;
    }
  };

  const approximate = (text: string, audio?: HTMLAudioElement) => {
    cancelAnimationFrame(frame.current);
    const started = performance.now();
    let boundaryAt = started;
    let boundaryIndex = 0;
    let hasBoundary = false;
    let paused = false;
    let previous = 0;
    const tick = (now: number) => {
      if (now - previous >= 32) {
        previous = now;
        const elapsed = audio ? audio.currentTime * 1000 : now - started;
        const index = hasBoundary
          ? Math.min(text.length - 1, boundaryIndex + Math.floor((now - boundaryAt) / 85))
          : Math.min(text.length - 1, Math.floor(elapsed / 85));
        const letter = text[index] ?? '';
        const closed = paused || audio?.paused || audio?.ended || /[\s.,!?;:।মবপmbp]/i.test(letter);
        const open = closed ? 0 : 0.18 + 0.62 * Math.abs(Math.sin(elapsed / 95));
        setFace({ open, round: /[উঊুঊূওোৌouOwW]/.test(letter) ? 0.9 : 0.15, emphasis: open * 0.6 });
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return {
      boundary: (event: SpeechSynthesisEvent) => {
        boundaryIndex = event.charIndex;
        boundaryAt = performance.now();
        hasBoundary = true;
      },
      pause: () => { paused = true; setFace(restingFace); },
      resume: () => { paused = false; },
    };
  };

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    release.current?.();
    if (context.current && context.current.state !== 'closed') void context.current.close().catch(() => {});
  }, []);

  return { face, stop, prepare, follow, approximate };
}
