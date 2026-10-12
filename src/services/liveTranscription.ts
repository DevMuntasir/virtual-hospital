export interface LiveTranscription {
  stop: () => void;
  close: () => void;
}

let liveCooldownUntil = 0;
let liveAccountLimitReached = false;

export class LiveTranscriptionError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = '',
    public requestId = '',
  ) {
    super(message);
  }
}

export function startBrowserTranscription(
  language: 'bn' | 'en',
  onPartial: (text: string) => void,
  onComplete: (text: string) => void,
  onError: () => void,
): LiveTranscription | null {
  const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  let closed = false;
  let transcript = '';
  recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (event: any) => {
    transcript = Array.from(event.results as ArrayLike<any>)
      .map((result: any) => result[0]?.transcript || '').join(' ').trim();
    onPartial(transcript);
  };
  recognition.onerror = () => {
    if (!closed) {
      closed = true;
      onError();
    }
  };
  recognition.onend = () => {
    if (!closed) {
      closed = true;
      onComplete(transcript);
    }
  };
  recognition.start();
  return {
    stop: () => { if (!closed) recognition.stop(); },
    close: () => { closed = true; recognition.abort(); },
  };
}

export async function startLiveTranscription(
  language: 'bn' | 'en',
  onPartial: (text: string) => void,
  onComplete: (text: string) => void,
  onError: () => void,
): Promise<LiveTranscription> {
  if (liveAccountLimitReached) throw new LiveTranscriptionError('OpenAI account limit reached', 429, 'credit_balance_exhausted');
  if (Date.now() < liveCooldownUntil) throw new LiveTranscriptionError('OpenAI live transcription is cooling down', 429);
  const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
  const peer = new RTCPeerConnection();
  const events = peer.createDataChannel('oai-events');
  let transcript = '';
  let closed = false;
  let stopping = false;
  let completionTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let resolveStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => { resolveStarted = resolve; });

  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(completionTimer);
    clearTimeout(closeTimer);
    microphone.getTracks().forEach((track) => track.stop());
    events.close();
    peer.close();
  };

  events.addEventListener('message', ({ data }) => {
    if (closed) return;
    const event = JSON.parse(data);
    if (event.type === 'session.started') {
      resolveStarted?.();
    } else if (event.type === 'session.input_transcript.delta') {
      transcript += event.delta || '';
      onPartial(transcript);
    } else if (event.type === 'session.input_audio.muted' && stopping) {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (events.readyState === 'open') events.send(JSON.stringify({ type: 'session.close' }));
      }, 600);
    } else if (event.type === 'session.closed') {
      onComplete(transcript.trim());
      close();
    } else if (event.type === 'error') {
      onError();
      close();
    }
  });
  events.addEventListener('close', () => {
    if (!closed) {
      onError();
      close();
    }
  });
  peer.addEventListener('connectionstatechange', () => {
    if (peer.connectionState === 'failed' && !closed) {
      onError();
      close();
    }
  });

  try {
    for (const track of microphone.getAudioTracks()) peer.addTrack(track, microphone);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const sdp = peer.localDescription?.sdp;
    if (!sdp) throw new Error('Missing microphone offer');
    const response = await fetch('/api/realtime/transcribe-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp, language }),
    });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      if (response.status === 429) {
        if (/credit_balance_exhausted|spend_limit_exceeded|usage_limit_exceeded|insufficient_quota/.test(details.code || '')) {
          liveAccountLimitReached = true;
        } else {
          const retrySeconds = Number(response.headers.get('Retry-After'));
          liveCooldownUntil = Date.now() + (Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds : 30) * 1000;
        }
      } else if (response.status >= 500) {
        liveCooldownUntil = Date.now() + 10_000;
      }
      throw new LiveTranscriptionError(
        details.error || 'Live transcription unavailable',
        response.status,
        details.code || '',
        details.requestId || '',
      );
    }
    const session = await response.json();
    if (typeof session.sdp !== 'string') throw new Error('Missing Live SDP answer');
    await peer.setRemoteDescription({ type: 'answer', sdp: session.sdp });
    await new Promise<void>((resolve, reject) => {
      if (events.readyState === 'open') return resolve();
      const timeout = setTimeout(() => reject(new Error('Transcription connection timed out')), 10000);
      events.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, { once: true });
      events.addEventListener('close', () => { clearTimeout(timeout); reject(new Error('Transcription connection closed')); }, { once: true });
    });
    await Promise.race([
      started,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Live session did not start')), 10000)),
    ]);
    return {
      close,
      stop: () => {
        if (closed || stopping || events.readyState !== 'open') return;
        stopping = true;
        microphone.getAudioTracks().forEach((track) => { track.enabled = false; });
        events.send(JSON.stringify({ type: 'session.input_audio.mute' }));
        closeTimer = setTimeout(() => {
          if (events.readyState === 'open') events.send(JSON.stringify({ type: 'session.close' }));
        }, 1500);
        completionTimer = setTimeout(() => {
          if (transcript.trim()) onComplete(transcript.trim());
          else onError();
          close();
        }, 15000);
      },
    };
  } catch (error) {
    close();
    throw error;
  }
}
