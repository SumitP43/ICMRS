import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  PhoneCall, 
  FileText, 
  ArrowRight,
  Zap,
  BrainCircuit,
  Radio,
  CheckCircle2,
  AlertCircle,
  Lock,
  Check,
  Settings2
} from 'lucide-react';
import { CivicComplaint } from '../types';

interface CivicChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: CivicComplaint[];
  onSelectComplaint: (complaint: CivicComplaint) => void;
  onNavigateToFile: () => void;
  user?: { name?: string; email?: string; department?: string; badgeNumber?: string } | null;
  initialProblemQuery?: string;
}

export type GeminiModelChoice = 'auto' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
export type AssistantRoleChoice = 'general' | 'fast' | 'expert';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  action?: {
    label: string;
    actionType: 'open-ticket' | 'file-complaint' | 'call-emergency';
    targetId?: string;
    phoneNumber?: string;
  };
}

export const CivicChatModal: React.FC<CivicChatModalProps> = ({
  isOpen,
  onClose,
  complaints,
  onSelectComplaint,
  onNavigateToFile,
  user,
  initialProblemQuery
}) => {
  // Conversation History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-initial',
      role: 'model',
      text: `Greetings, ${user?.name || 'Citizen'}. I am your Metro District 04 Civic Response Assistant powered by Gemini. You can speak or type your civic problem (potholes, water leaks, unlit streetlights, storm debris, noise) and I will diagnose urgency, look up active crews, or assist in filing a report.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fixed AI Mode - loaded from persistent local storage
  const [selectedModel, setSelectedModel] = useState<GeminiModelChoice>(() => {
    try {
      const saved = localStorage.getItem('icmrs_fixed_ai_mode');
      if (saved && ['auto', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'].includes(saved)) {
        return saved as GeminiModelChoice;
      }
    } catch (e) {}
    return 'gemini-3.5-flash';
  });

  const [selectedRole, setSelectedRole] = useState<AssistantRoleChoice>(() => {
    try {
      const savedRole = localStorage.getItem('icmrs_fixed_ai_role');
      if (savedRole && ['general', 'fast', 'expert'].includes(savedRole)) {
        return savedRole as AssistantRoleChoice;
      }
    } catch (e) {}
    return 'general';
  });

  const [showModeSelector, setShowModeSelector] = useState(false);

  // Speech Recognition (Voice Input)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechInterim, setSpeechInterim] = useState('');
  const recognitionRef = useRef<any>(null);

  // Speech Synthesis (Read Aloud)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Scroll anchor ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, speechInterim]);

  // If initial problem query is provided, seed it
  useEffect(() => {
    if (isOpen && initialProblemQuery && initialProblemQuery.trim()) {
      setInputText(initialProblemQuery.trim());
    }
  }, [isOpen, initialProblemQuery]);

  // Setup Web Speech API on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInputText(prev => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
          setSpeechInterim('');
        } else {
          setSpeechInterim(interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechInterim('');
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone permission in your browser.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Voice input: ${event.error}. Please try typing or check microphone settings.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setSpeechInterim('');
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition not available:', e);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Toggle Voice Listening
  const toggleListening = () => {
    if (!speechSupported) {
      setErrorMsg('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechInterim('');
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Stop reading aloud
  const handleStopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  };

  // Read message aloud
  const handleReadAloud = (msg: ChatMessage) => {
    if (!window.speechSynthesis) return;

    if (speakingMessageId === msg.id) {
      handleStopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msg.id);

    const utterance = new SpeechSynthesisUtterance(msg.text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Reset conversation
  const handleResetChat = () => {
    handleStopSpeaking();
    setMessages([
      {
        id: `m-reset-${Date.now()}`,
        role: 'model',
        text: `Conversation reset. Greetings, ${user?.name || 'Citizen'}. How can I assist with your municipal inquiries or problem reports today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
    setInputText('');
    setErrorMsg(null);
  };

  // Handle Fixed Model Change
  const handleModelChange = (model: GeminiModelChoice, role: AssistantRoleChoice) => {
    setSelectedModel(model);
    setSelectedRole(role);
    try {
      localStorage.setItem('icmrs_fixed_ai_mode', model);
      localStorage.setItem('icmrs_fixed_ai_role', role);
    } catch (e) {}
    setShowModeSelector(false);
  };

  // Detect and append action buttons based on response text
  const detectActions = (text: string): ChatMessage['action'] | undefined => {
    const lower = text.toLowerCase();
    
    // Check if Oak Ave Pothole is mentioned
    if (lower.includes('001245') || (lower.includes('oak') && lower.includes('pothole'))) {
      const ticket = complaints.find(c => c.id.includes('001245'));
      return {
        label: 'Open Oak Ave Ticket Tracker',
        actionType: 'open-ticket',
        targetId: ticket?.id || '#ICMRS-2026-001245'
      };
    }

    // Check if Elmwood Streetlight is mentioned
    if (lower.includes('001198') || (lower.includes('elmwood') && (lower.includes('light') || lower.includes('luminaire')))) {
      const ticket = complaints.find(c => c.id.includes('001198'));
      return {
        label: 'View Luminaire Fixture Status',
        actionType: 'open-ticket',
        targetId: ticket?.id || '#ICMRS-2026-001198'
      };
    }

    // Check if filing a complaint is suggested
    if (lower.includes('file a complaint') || lower.includes('filing wizard') || lower.includes('report a hazard') || lower.includes('file this complaint') || lower.includes('file a new road defect')) {
      return {
        label: 'Launch Complaint Filing Wizard',
        actionType: 'file-complaint'
      };
    }

    // Emergency hotline call action
    if (lower.includes('311-990') || lower.includes('311-881') || lower.includes('downed wire') || lower.includes('gas leak')) {
      return {
        label: 'Call Emergency Dispatch (311-990)',
        actionType: 'call-emergency',
        phoneNumber: 'tel:311990'
      };
    }

    return undefined;
  };

  // Send message to Gemini Server Endpoint
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // Stop listening if speech recognition was running
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechInterim('');
    }

    const userText = inputText.trim();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update conversation history with new user message
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Send multi-turn history to server
      const payload = {
        messages: updatedHistory.map(m => ({
          role: m.role,
          text: m.text
        })),
        model: selectedModel,
        roleType: selectedRole,
        userContext: {
          name: user?.name || 'Marcus Vance',
          ward: user?.department || 'Metro District 04',
          badgeNumber: user?.badgeNumber || 'Verified Resident'
        },
        complaintsContext: complaints.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          pipelineStepName: c.pipelineStepName,
          location: c.location,
          category: c.category,
          slaRemaining: c.slaRemaining,
          priority: c.priority
        }))
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok && !data.text) {
        throw new Error(data.error || 'Failed to receive response from Gemini Assistant.');
      }

      const replyText = data.text || 'Your civic report has been logged and acknowledged by District 04 dispatch.';
      const action = detectActions(replyText);

      const botMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel,
        action
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error communicating with Gemini civic assistant:', err);
      setErrorMsg(err.message || 'Unable to connect to municipal AI service. Please check your internet connection.');
      
      // Provide empathetic client-side fallback
      const fallbackMsg: ChatMessage = {
        id: `m-err-${Date.now()}`,
        role: 'model',
        text: 'I apologize, I am temporarily having trouble reaching the telemetry server. For immediate life hazards (gas leaks, fallen wires), call 311-990 directly, or use the "File a Complaint" wizard to log your issue.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: {
          label: 'Launch Complaint Wizard',
          actionType: 'file-complaint'
        }
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle action click
  const handleActionClick = (action: ChatMessage['action']) => {
    if (!action) return;
    if (action.actionType === 'open-ticket' && action.targetId) {
      const ticket = complaints.find(c => c.id === action.targetId);
      if (ticket) {
        onSelectComplaint(ticket);
      }
      onClose();
    } else if (action.actionType === 'file-complaint') {
      onNavigateToFile();
      onClose();
    } else if (action.actionType === 'call-emergency' && action.phoneNumber) {
      window.location.href = action.phoneNumber;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="civic-chat-title"
    >
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-200 flex flex-col h-[650px] max-h-[92vh] overflow-hidden">
        
        {/* Header with Title, Model Badge, and Controls */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-white shadow-inner">
              <Bot className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="civic-chat-title" className="font-['Plus_Jakarta_Sans'] font-extrabold text-[16px] leading-tight flex items-center gap-1.5 text-white">
                  Civic Response Voice & AI Assistant
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-indigo-200 font-medium">
                District 04 Municipal Problem Diagnostic & Voice Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                handleStopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Close chat"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fixed AI Mode Status & Control Bar */}
        <div className="px-4 py-2 bg-slate-50/90 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-[11px] select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-100/70 border border-indigo-200/80 text-indigo-900 font-bold">
              <Lock className="w-3 h-3 text-indigo-700" />
              <span>AI Mode Fixed:</span>
            </span>
            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {selectedModel === 'auto'
                ? 'Smart Adaptive Triage'
                : selectedModel === 'gemini-3.1-flash-lite'
                ? 'Fast Dispatch Hotline'
                : selectedModel === 'gemini-3.1-pro-preview'
                ? 'Engineering & Code Specialist'
                : 'District 04 Municipal Triage'}
            </span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              ({selectedModel === 'auto' ? 'Gemini 3.5 & 3.1 Adaptive' : selectedModel})
            </span>
          </div>

          <div className="relative">
            <button
              id="chatbot-fixed-ai-mode-toggle-btn"
              type="button"
              onClick={() => setShowModeSelector(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
              title="View or configure locked AI mode profile"
            >
              <Settings2 className="w-3 h-3 text-gray-500" />
              <span>{showModeSelector ? 'Close' : 'Lock Profile'}</span>
            </button>

            {/* Dropdown to adjust fixed AI mode profile */}
            {showModeSelector && (
              <div className="absolute right-0 top-full mt-1.5 w-68 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-30 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 border-b border-gray-100 mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-indigo-600" />
                    Fixed AI Mode Profiles:
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">LOCKED</span>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleModelChange('gemini-3.5-flash', 'general')}
                    className={`text-left px-2.5 py-2 rounded-xl text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      selectedModel === 'gemini-3.5-flash'
                        ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <span>General Civic Triage</span>
                      </div>
                      <div className="text-[10px] text-gray-500">Standard municipal reports (gemini-3.5-flash)</div>
                    </div>
                    {selectedModel === 'gemini-3.5-flash' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModelChange('gemini-3.1-flash-lite', 'fast')}
                    className={`text-left px-2.5 py-2 rounded-xl text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      selectedModel === 'gemini-3.1-flash-lite'
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Fast Response Mode</span>
                      </div>
                      <div className="text-[10px] text-gray-500">Rapid hotline numbers (gemini-3.1-flash-lite)</div>
                    </div>
                    {selectedModel === 'gemini-3.1-flash-lite' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModelChange('gemini-3.1-pro-preview', 'expert')}
                    className={`text-left px-2.5 py-2 rounded-xl text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      selectedModel === 'gemini-3.1-pro-preview'
                        ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <span>Complex Specialist Mode</span>
                      </div>
                      <div className="text-[10px] text-gray-500">Code §14-B & engineering (gemini-3.1-pro-preview)</div>
                    </div>
                    {selectedModel === 'gemini-3.1-pro-preview' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModelChange('auto', 'general')}
                    className={`text-left px-2.5 py-2 rounded-xl text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      selectedModel === 'auto'
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        <span>Smart Adaptive (Auto)</span>
                      </div>
                      <div className="text-[10px] text-gray-500">Auto-routes model by query complexity</div>
                    </div>
                    {selectedModel === 'auto' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification Bar */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-800 text-[12px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-600 font-bold hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Conversation Thread */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/50"
          tabIndex={0}
          aria-label="Chat messages thread"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = speakingMessageId === msg.id;

            return (
              <div 
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`rounded-2xl p-4 text-[13px] leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-gray-900 rounded-tl-xs border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Action buttons if detected */}
                    {msg.action && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.action)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {msg.action.actionType === 'file-complaint' && <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                          {msg.action.actionType === 'open-ticket' && <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                          {msg.action.actionType === 'call-emergency' && <PhoneCall className="w-3.5 h-3.5 text-red-600" />}
                          <span>{msg.action.label}</span>
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Meta / Controls */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-gray-400">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200 text-[9px]">
                        {msg.modelUsed}
                      </span>
                    )}

                    {/* Read Aloud Button for Bot messages */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleReadAloud(msg)}
                        className={`flex items-center gap-0.5 hover:text-indigo-600 transition-colors cursor-pointer ${
                          isSpeaking ? 'text-indigo-600 font-bold' : ''
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3 text-indigo-600" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-gray-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-time Voice Transcription Bubble while speaking */}
          {isListening && speechInterim && (
            <div className="flex gap-2.5 justify-end animate-pulse">
              <div className="max-w-[85%] rounded-2xl rounded-tr-xs p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-950 text-[13px]">
                <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px] mb-1">
                  <Radio className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing speech in real time...</span>
                </div>
                <p className="italic">"{speechInterim}"</p>
              </div>
              <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Mic className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          )}

          {/* Thinking / Typing Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-xs p-4 text-[13px] shadow-2xs flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[12px] text-gray-500 font-medium">
                  {selectedModel === 'gemini-3.1-pro-preview' 
                    ? 'Synthesizing municipal code & engineering triage with Gemini 3.1 Pro...'
                    : 'Municipal triage assistant formulating response...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Recording Active Banner */}
        {isListening && (
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-rose-800 text-[12px]">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              <span className="font-bold">Listening to your voice... Speak your problem clearly.</span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Done Speaking
            </button>
          </div>
        )}

        {/* Quick Problem Prompts */}
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-gray-400 font-bold shrink-0">Ask:</span>
          <button
            type="button"
            onClick={() => {
              setInputText('Report a severe pothole damaging car tires on my street');
            }}
            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
          >
            🕳️ Pothole Damage
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('Water main leaking and flooding the road near Ring Road AIIMS');
            }}
            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
          >
            💧 Water Main Leak
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('Streetlight outage at night making intersection dark');
            }}
            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
          >
            💡 Unlit Streetlight
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('What is the status of Oak Ave pothole repair #001245?');
            }}
            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
          >
            📋 Ticket #001245 Status
          </button>
          <button
            type="button"
            onClick={() => {
              setInputText('Who should I call for emergency downed power wire?');
            }}
            className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer"
          >
            🚨 Downed Wires Hotline
          </button>
        </div>

        {/* Input Bar with Voice Button & Send */}
        <form 
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2"
        >
          {/* Microphone Voice Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-[12px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to talk (Voice Input)'}
            aria-label={isListening ? 'Stop microphone' : 'Start microphone voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-600" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Talk'}</span>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or click 'Talk' to speak your problem..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-indigo-600 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Footer Note */}
        <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
          <span>Municipal Code §14 Triage Engine • Multi-turn Gemini AI</span>
          <span>Hotline: 311-990</span>
        </div>
      </div>
    </div>
  );
};

