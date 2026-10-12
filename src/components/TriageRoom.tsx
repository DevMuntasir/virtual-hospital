import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, ArrowLeft, FileText, ChevronRight, Stethoscope, ShieldCheck, MessageCircle, Globe2, PhoneCall, Keyboard, Pause, Play, X } from 'lucide-react';
import { PatientToken, ChatMessage, Prescription, UrgencyCode } from '../types/hospital';
import { HospitalAPI } from '../services/api';
import { startBrowserTranscription, startLiveTranscription, type LiveTranscription } from '../services/liveTranscription';

interface TriageRoomProps {
  token: PatientToken;
  language: 'bn' | 'en';
  onLanguageChange: (language: 'bn' | 'en') => void;
  onBack: () => void;
  onPrescriptionGenerated: (prescription: Prescription) => void;
}

export const TriageRoom: React.FC<TriageRoomProps> = ({
  token,
  language,
  onLanguageChange,
  onBack,
  onPrescriptionGenerated,
}) => {
  const isBn = language === 'bn';

  // Initial welcome message from Dr. Shasthya
  const initialGreeting = isBn
    ? `স্বাগতম, ${token.patient.name}। সময় নিয়ে বলুন, আজ আপনার কী সমস্যা হচ্ছে?`
    : `Welcome, ${token.patient.name}. Take your time. What is bothering you today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'ai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isQuestion: true,

    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [canFinalize, setCanFinalize] = useState(false);
  const [currentUrgency, setCurrentUrgency] = useState<UrgencyCode>(token.urgencyCode || 'GREEN');
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showText, setShowText] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [reportText, setReportText] = useState('');

  const roomRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const transcriptionRef = useRef<LiveTranscription | null>(null);
  const voiceConversationRef = useRef(false);
  const audioRequestRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Follow the visible viewport when the mobile keyboard or browser bars resize it.
  useEffect(() => {
    const viewport = window.visualViewport;
    const updateViewport = () => {
      roomRef.current?.style.setProperty('--consultation-height', `${viewport?.height ?? window.innerHeight}px`);
    };
    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    window.addEventListener('resize', updateViewport);
    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  useEffect(() => {
    if (showText && !isRecording && !isConnecting && !isTranscribing) answerRef.current?.focus({ preventScroll: true });
  }, [showText, isRecording, isConnecting, isTranscribing]);

  // Auto scroll
  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTo({ top: showHistory ? chat.scrollHeight : 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [messages, isAiThinking, showHistory]);

  const stopAudio = () => {
    audioRequestRef.current += 1;
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPlayingAudioId(null);
    setIsSpeaking(false);
  };

  useEffect(() => () => {
    audioRequestRef.current += 1;
    transcriptionRef.current?.close();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const toggleRecording = async () => {
    if (isAiThinking || isFinalizing || isConnecting || isTranscribing) return;
    setVoiceError('');
    if (transcriptionRef.current) {
      setIsRecording(false);
      setIsTranscribing(true);
      transcriptionRef.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setShowText(true);
      setVoiceError(isBn ? 'এই ব্রাউজারে লাইভ ভয়েস চালু করা যাচ্ছে না। লিখে উত্তর দিন।' : 'Live voice is unavailable in this browser. Please type your answer.');
      return;
    }
    stopAudio();
    setShowText(true);
    setInputText('');
    setIsConnecting(true);
    const onPartial = (partial: string) => setInputText(partial);
    const onComplete = (finalText: string) => {
      transcriptionRef.current = null;
      setInputText(finalText);
      setIsTranscribing(false);
      setIsRecording(false);
      voiceConversationRef.current = !!finalText.trim();
      if (!finalText.trim()) setVoiceError(isBn ? 'কথা বোঝা যায়নি। আবার বলুন অথবা লিখুন।' : 'No speech was detected. Try again or type.');
    };
    const onError = () => {
      transcriptionRef.current = null;
      setIsTranscribing(false);
      setIsRecording(false);
      setVoiceError(isBn ? 'ট্রান্সক্রিপশন বন্ধ হয়েছে। আবার চেষ্টা করুন অথবা লিখুন।' : 'Transcription stopped. Try again or type.');
    };
    try {
      const session = await startLiveTranscription(language, onPartial, onComplete, onError);
      transcriptionRef.current = session;
      setIsRecording(true);
    } catch (error) {
      console.warn('OpenAI live transcription unavailable:', error);
      if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
        try {
          const fallback = startBrowserTranscription(language, onPartial, onComplete, onError);
          if (fallback) {
            transcriptionRef.current = fallback;
            setIsRecording(true);
            setVoiceError(isBn ? 'OpenAI লাইভ ট্রান্সক্রিপশন পাওয়া যায়নি। ব্রাউজারের ভয়েস ব্যবহার হচ্ছে।' : 'OpenAI live transcription is unavailable. Using browser voice input.');
            return;
          }
        } catch (fallbackError) {
          console.warn('Browser voice input unavailable:', fallbackError);
        }
      }
      transcriptionRef.current = null;
      setIsRecording(false);
      setIsTranscribing(false);
      setVoiceError(isBn ? 'ভয়েস চালু হয়নি। মাইক্রোফোনের অনুমতি দেখে আবার চেষ্টা করুন অথবা লিখুন।' : 'Voice input could not start. Check microphone permission or type your answer.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePlayAudio = async (message: ChatMessage) => {
    const wasPlaying = playingAudioId === message.id;
    stopAudio();
    if (wasPlaying) return;
    transcriptionRef.current?.close();
    transcriptionRef.current = null;
    const requestId = audioRequestRef.current;
    setPlayingAudioId(message.id);
    try {
      const speech = message.audioBase64
        ? { audioBase64: message.audioBase64 }
        : await HospitalAPI.getTTSAudio(message.text, language);
      const base64 = speech.audioBase64;
      if (requestId !== audioRequestRef.current) return;
      if (speech.issue) {
        setVoiceError(speech.issue === 'account'
          ? (isBn ? 'OpenAI ভয়েসের ক্রেডিট বা খরচের সীমা শেষ। ডিভাইসের কণ্ঠ ব্যবহার হচ্ছে।' : 'OpenAI voice credits or spend limit reached. Using your device voice.')
          : speech.issue === 'rate'
            ? (isBn ? 'OpenAI ভয়েসের অনুরোধের সীমা হয়েছে। ডিভাইসের কণ্ঠ ব্যবহার হচ্ছে।' : 'OpenAI voice rate limit reached. Using your device voice.')
            : (isBn ? 'OpenAI ভয়েস পাওয়া যায়নি। ডিভাইসের কণ্ঠ ব্যবহার হচ্ছে।' : 'OpenAI voice is unavailable. Using your device voice.'));
      }
      if (base64) {
        message.audioBase64 = base64;
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        audioRef.current = audio;
        audio.onplaying = () => { if (requestId === audioRequestRef.current) setIsSpeaking(true); };
        audio.onended = audio.onerror = () => { if (requestId === audioRequestRef.current) { setPlayingAudioId(null); setIsSpeaking(false); } };
        await audio.play();
      } else if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = isBn ? 'bn-BD' : 'en-US';
        utterance.onstart = () => { if (requestId === audioRequestRef.current) setIsSpeaking(true); };
        utterance.onend = utterance.onerror = () => { if (requestId === audioRequestRef.current) { setPlayingAudioId(null); setIsSpeaking(false); } };
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudioId(null);
        setVoiceError(isBn ? 'এখন অডিও শোনা যাচ্ছে না। উত্তরটি উপরে পড়তে পারেন।' : 'Audio is unavailable. You can read the response above.');
      }
    } catch {
      if (requestId === audioRequestRef.current) {
        setIsSpeaking(false);
        setPlayingAudioId(null);
        setVoiceError(isBn ? 'অডিও চালু হয়নি। আবার চেষ্টা করুন।' : 'Audio could not play. Please try again.');
      }
    }
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isAiThinking || isFinalizing) return;
    transcriptionRef.current?.close();
    transcriptionRef.current = null;
    stopAudio();
    setCanFinalize(false);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'patient',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newConversation = [...messages, userMessage];
    setMessages(newConversation);
    setInputText('');
    setIsAiThinking(true);

    try {
      const aiResponse = await HospitalAPI.sendTriageMessage(
        newConversation,
        token.patient,
        language
      );

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.reply || (isBn ? 'আপনার বিবরণটি বিবেচনা করা হয়েছে।' : 'Your input has been recorded.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isQuestion: aiResponse.isQuestion ?? false,
        isRedFlagWarning: aiResponse.isRedFlagWarning ?? false,
        quickReplies: aiResponse.suggestedQuickReplies || [],
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (voiceConversationRef.current) void handlePlayAudio(aiMessage);

      if (aiResponse.triageCode) {
        setCurrentUrgency(aiResponse.triageCode);
      }

      setCanFinalize(aiResponse.readyForDraft === true);
    } catch (err) {
      console.error(err);
      const fallbackAi: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: isBn
          ? 'সংযোগে সমস্যা হয়েছে। আপনার উত্তরটি আবার পাঠান, যাতে তথ্য সংগ্রহ চালিয়ে যেতে পারি।'
          : 'There was a connection problem. Please send your answer again so we can continue gathering your details.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isQuestion: false,
      };
      setMessages((prev) => [...prev, fallbackAi]);
      setCanFinalize(false);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Finalize triage and generate prescription draft
  const handleFinalizePrescription = async () => {
    if (!canFinalize || isAiThinking || isFinalizing) return;
    stopAudio();
    setIsFinalizing(true);
    try {
      const rx = await HospitalAPI.finalizeTriage(
        messages,
        token.patient,
        token.id,
        language
      );
      onPrescriptionGenerated(rx);
    } catch (err) {
      console.error('Finalize error', err);
      alert(isBn ? 'প্রেসক্রিপশন তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to finalize draft prescription.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const latestMessage = messages[messages.length - 1];
  const latestAiMessage = [...messages].reverse().find((message) => message.sender === 'ai');
  const visibleMessages = showHistory ? messages : (isAiThinking ? [] : latestAiMessage ? [latestAiMessage] : []);
  const busy = isAiThinking || isFinalizing || isConnecting || isTranscribing;
  const presence = isRecording
    ? (isBn ? 'শুনছি, বলুন…' : 'Listening to you…')
    : isConnecting
    ? (isBn ? 'লাইভ ভয়েস সংযুক্ত হচ্ছে…' : 'Connecting live voice…')
    : isTranscribing
    ? (isBn ? 'আপনার কথা লিখছি…' : 'Finishing transcript…')
    : playingAudioId
    ? (isBn ? 'আপনার সঙ্গে কথা বলছি…' : 'Speaking with you…')
    : isAiThinking
    ? (isBn ? 'আপনার উত্তরটি পড়ছি…' : 'Reading your answer…')
    : (isBn ? 'আপনার কথা শুনতে প্রস্তুত' : 'Here to listen to you');

  return (
    <div ref={roomRef} className={`consultation-room ${showText ? 'text-entry-open' : ''} ${isRecording || isConnecting || isTranscribing ? 'voice-active' : ''} ${showReport ? 'report-entry-open' : ''}`}>
      <header className="consultation-heading">
        <div className="consultation-title">
          <button onClick={onBack} className="consultation-back" aria-label={isBn ? 'ফিরে যান' : 'Go back'}><ArrowLeft size={19} /></button>
          <h1>{isBn ? 'পরামর্শের ঘর' : 'Consultation room'}</h1>
        </div>
        <div className="consultation-header-actions">
          <button className="consultation-ticket" onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails} aria-controls="patient-ticket">{isBn ? 'টিকিট' : 'Ticket'} <strong>{token.tokenNumber}</strong></button>
          <button className="consultation-language" onClick={() => onLanguageChange(isBn ? 'en' : 'bn')} aria-label={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}><Globe2 size={17} /><span>{isBn ? 'EN' : 'বাং'}</span></button>
          <a className="consultation-emergency" href="tel:999" aria-label={isBn ? 'জরুরি কল ৯৯৯' : 'Call emergency 999'}><PhoneCall size={15} /><span>999</span></a>
        </div>
      </header>
      {showDetails && <div id="patient-ticket" className="consultation-ticket-panel"><div><strong>{token.patient.name}</strong><button onClick={() => setShowDetails(false)} aria-label={isBn ? 'বন্ধ করুন' : 'Close'}><X size={18} /></button></div><p>{token.patient.age} {isBn ? 'বছর' : 'years'} · {token.patient.phone}</p><p>{token.tokenNumber}</p></div>}

      {currentUrgency !== 'GREEN' && <div className={`consultation-alert ${currentUrgency === 'RED' ? 'urgent' : ''}`} role="alert">
        <ShieldCheck size={20} />
        <p>{currentUrgency === 'RED'
          ? (isBn ? 'জরুরি সহায়তা প্রয়োজন। AI-এর জরুরি নির্দেশনাটি পড়ুন।' : 'Urgent care is needed. Please read the AI’s emergency guidance.')
          : (isBn ? 'আপনার জন্য বিশেষজ্ঞের পরামর্শ প্রয়োজন।' : 'Specialist attention is recommended for you.')}</p>
      </div>}

      <section className="consultation-space" aria-label={isBn ? 'পরামর্শের ঘর' : 'Consultation room'}>
        <div className="chamber-stage">
          <div className={`conversation-messages ${showHistory ? 'history-open' : ''}`} ref={chatRef} role="log" aria-live="polite" aria-relevant="additions" aria-label={isBn ? 'কথোপকথনের বার্তা' : 'Conversation messages'}>
            {visibleMessages.map((msg) => <div key={msg.id} className={`care-message ${msg.sender === 'patient' ? 'from-patient' : 'from-assistant'} ${msg.isRedFlagWarning ? 'emergency-message' : ''}`}>
              {showHistory && <span className="care-message-author">{msg.sender === 'ai' ? (isBn ? 'স্বাস্থ্যসেবা · AI' : 'ShasthyaSheba · AI') : (isBn ? 'আপনি' : 'You')}</span>}
              <div className="care-message-body"><p>{msg.text}</p>
                {msg.sender === 'ai' && <button className="message-listen" onClick={() => handlePlayAudio(msg)} aria-label={playingAudioId === msg.id ? (isBn ? 'অডিও বন্ধ করুন' : 'Stop audio') : (isBn ? 'উত্তরটি শুনুন' : 'Listen to this response')}>
                  {playingAudioId === msg.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  {playingAudioId === msg.id ? (isBn ? 'বন্ধ করুন' : 'Stop audio') : (isBn ? 'শুনুন' : 'Listen')}
                </button>}
              </div>
              {msg === latestMessage && msg.sender === 'ai' && !!msg.quickReplies?.length && <div className="care-quick-replies">{msg.quickReplies.map((reply, idx) => <button key={idx} disabled={busy || isRecording} onClick={() => handleSendMessage(reply)}>{reply}</button>)}</div>}
            </div>)}
            {isAiThinking && <div className="care-thinking" role="status"><span /><span /><span /><p>{isBn ? 'আপনার উত্তরটি পড়ছি…' : 'Reading your answer…'}</p></div>}
          </div>

        <aside className={`care-companion ${isSpeaking ? 'is-speaking' : ''} ${isRecording ? 'is-listening' : ''} ${motionEnabled ? '' : 'motion-paused'}`}>
          <div className="scene-label"><Stethoscope size={15} />{isBn ? 'স্বাস্থ্যসেবা' : 'ShasthyaSheba'}<span>AI</span></div>
          <button className="scene-motion" onClick={() => setMotionEnabled(!motionEnabled)} aria-label={motionEnabled ? (isBn ? 'অ্যানিমেশন বন্ধ করুন' : 'Pause animation') : (isBn ? 'অ্যানিমেশন চালু করুন' : 'Play animation')} aria-pressed={!motionEnabled}>{motionEnabled ? <Pause size={15} /> : <Play size={15} />}</button>
          <div className="room-window" aria-hidden="true" /><div className="room-frame" aria-hidden="true"><Stethoscope size={30} /></div>
          <div className="room-plant" aria-hidden="true"><i /><i /><i /><i /><span /></div>
          <div className="companion-portrait">
            <svg viewBox="0 0 240 260" aria-hidden="true">
              <defs><linearGradient id="coat-shade" x1="0" x2="1"><stop stopColor="#dce5df"/><stop offset=".45" stopColor="#fffef9"/><stop offset="1" stopColor="#d5dfdb"/></linearGradient><radialGradient id="skin-shade"><stop stopColor="#f2d0b2"/><stop offset="1" stopColor="#dfae8c"/></radialGradient></defs>
              <rect x="57" y="108" width="126" height="144" rx="40" fill="#547268" />
              <rect x="64" y="115" width="112" height="130" rx="34" fill="#658278" />
              <g className="doctor-body">
              <path d="M40 222v-30c0-45 160-45 160 0v30" fill="#bfd3c6" />
              <path d="M64 229v-45c0-27 28-40 56-40s56 13 56 40v45" fill="url(#coat-shade)" />
              <path d="m102 145 18 15 18-15 8 84H94z" fill="#367a69" />
              <path d="M105 126h30v26c-7 12-23 12-30 0z" fill="#d9a785" />
              <g className="doctor-head">
              <ellipse cx="83" cy="99" rx="8" ry="12" fill="#e4b694" />
              <ellipse cx="157" cy="99" rx="8" ry="12" fill="#e4b694" />
              <path d="M82 78c0-49 76-49 76 0v29c0 26-18 40-38 40s-38-14-38-40z" fill="url(#skin-shade)" />
              <path d="M82 92c-10-35 7-56 37-56 34 0 46 25 39 56l-10-22c-22 9-39 5-48-2L84 93z" fill="#354c43" />
              <path d="M101 43c10-8 27-8 38 0" fill="none" stroke="#5f7366" strokeWidth="5" strokeLinecap="round" />
              <path d="M94 93h20m12 0h20m-32 2h12" stroke="#526457" strokeWidth="3" strokeLinecap="round" />
              <rect x="91" y="89" width="25" height="18" rx="7" fill="none" stroke="#526457" strokeWidth="2.5" />
              <rect x="124" y="89" width="25" height="18" rx="7" fill="none" stroke="#526457" strokeWidth="2.5" />
              <g className="doctor-eyes"><circle cx="104" cy="98" r="2" fill="#354c43" /><circle cx="136" cy="98" r="2" fill="#354c43" /></g>
              <path d="m120 101-3 11h6" fill="none" stroke="#c78f70" strokeWidth="2" strokeLinecap="round" />
              <ellipse className="doctor-speaking-mouth" cx="120" cy="123" rx="7" ry="3" fill="#854e45" />
              <path className="doctor-smile" d="M109 121q11 10 22 0" fill="none" stroke="#9c6052" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <path d="m100 145-14 13 10 18-8 11 18 42m34-84 14 13-10 18 8 11-18 42" fill="none" stroke="#d8e3d9" strokeWidth="2" />
              <path d="M99 153v28c0 22 33 22 33 0v-28m0 38v13h17v-17" fill="none" stroke="#416956" strokeWidth="3" strokeLinecap="round" />
              <circle cx="149" cy="183" r="7" fill="#dbe7dc" stroke="#416956" strokeWidth="3" />
              <path d="M74 164Q55 174 51 213q-2 13 17 16l42 5 4-13-34-13 8-35" fill="url(#coat-shade)" stroke="#cedad2" />
              <g className="doctor-hand"><path d="M163 165q22 6 25 43 2 17-14 20l-44 5-4-13 34-14-8-33" fill="url(#coat-shade)" stroke="#cedad2" /><path d="m130 219-16 2-8 7q-3 5 4 6l25-4z" fill="#e5b894" /></g>
              <path d="m109 219 16 3 8 7q2 6-5 6l-23-6z" fill="#edc6a5" />
              </g>
            </svg>
          </div>
          <div className="room-desk" aria-hidden="true"><span className="desk-notebook"/><span className="desk-pen"/><span className="desk-cup"/></div>
          <div className="companion-presence" role="status"><span />{presence}</div>
        </aside>
        </div>

        <div className={`care-conversation ${showReport ? 'report-open' : ''}`}>

          <div className="care-composer">
            {canFinalize && <button className="care-next" onClick={handleFinalizePrescription} disabled={busy || isRecording}><FileText size={18} />{isFinalizing ? (isBn ? 'খসড়া তৈরি হচ্ছে…' : 'Preparing your draft…') : (isBn ? 'ডাক্তারের যাচাইয়ের জন্য খসড়া তৈরি করুন' : 'Prepare a draft for doctor review')}<ChevronRight size={18} /></button>}
            <div className="voice-answer">
              <button className={`care-mic ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} disabled={busy} aria-pressed={isRecording}>
                {isRecording ? <MicOff size={21} /> : <Mic size={21} />}
                {isRecording ? (isBn ? 'থামুন' : 'Stop') : (isBn ? 'বলুন' : 'Speak')}
              </button>
              <button className={`care-keyboard ${showText ? 'selected' : ''}`} onClick={() => setShowText(!showText)} aria-expanded={showText} aria-controls="spoken-answer" aria-label={isBn ? 'লিখে উত্তর দিন' : 'Type your answer'}><Keyboard size={22} /></button>
            </div>
            <p className="voice-disclosure">{isBn ? 'শোনা কণ্ঠটি AI-তৈরি, মানুষ নয়।' : 'The voice you hear is AI-generated, not a person.'}</p>
            {voiceError && <p className="care-input-error" role="alert">{voiceError}</p>}
            {showText && <form id="spoken-answer" className="care-text-form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <button type="button" className="close-text-entry" onClick={() => { answerRef.current?.blur(); setShowText(false); }} aria-label={isBn ? 'কথা বলায় ফিরুন' : 'Return to voice'}><X size={18} /></button>
              <textarea ref={answerRef} enterKeyHint="send" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!isRecording) handleSendMessage(); } }} rows={1} value={inputText} onChange={(e) => setInputText(e.target.value)} disabled={busy || isRecording} aria-label={isBn ? 'আপনার উত্তর' : 'Your answer'} placeholder={isBn ? 'উত্তর লিখুন…' : 'Your answer…'} />
              <button type="submit" disabled={!inputText.trim() || busy || isRecording} aria-label={isBn ? 'উত্তর পাঠান' : 'Send your answer'}><Send size={19} /></button>
            </form>}
            <div className="composer-footer"><button onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}><MessageCircle size={16} />{isBn ? 'কথোপকথন' : 'History'}</button><button onClick={() => setShowReport(!showReport)} aria-expanded={showReport} aria-controls="consultation-report"><FileText size={16} />{isBn ? 'রিপোর্ট' : 'Report'}</button></div>
            {showReport && <form id="consultation-report" className="care-report" onSubmit={(e) => { e.preventDefault(); if (!reportText.trim() || busy || isRecording) return; handleSendMessage(`${isBn ? 'আমার রিপোর্টের তথ্য' : 'My report details'}: ${reportText.trim()}`); setReportText(''); setShowReport(false); }}>
              <div><label htmlFor="report-details">{isBn ? 'রিপোর্টের নাম ও ফলাফল লিখুন' : 'Enter the report name and results'}</label><button type="button" onClick={() => setShowReport(false)} aria-label={isBn ? 'বন্ধ করুন' : 'Close'}><X size={17} /></button></div>
              <textarea id="report-details" rows={3} value={reportText} onChange={(e) => setReportText(e.target.value)} required />
              <button type="submit" disabled={!reportText.trim() || busy || isRecording}>{isBn ? 'কথোপকথনে পাঠান' : 'Send to conversation'}<Send size={15} /></button>
            </form>}
          </div>
        </div>
      </section>
      <p className="consultation-footnote">{isBn ? 'এই কণ্ঠ AI-তৈরি, মানুষ নয় · প্রেসক্রিপশন ডাক্তার যাচাই করবেন' : 'This voice is AI-generated, not a person · Prescriptions reviewed by a doctor'}</p>

    </div>
  );
};
