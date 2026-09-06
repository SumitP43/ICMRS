import React, { useState } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { CivicComplaint } from '../types';

interface CivicChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: CivicComplaint[];
  onSelectComplaint: (complaint: CivicComplaint) => void;
  onNavigateToFile: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  action?: {
    label: string;
    actionType: 'open-ticket' | 'file-complaint';
    targetId?: string;
  };
}

export const CivicChatModal: React.FC<CivicChatModalProps> = ({
  isOpen,
  onClose,
  complaints,
  onSelectComplaint,
  onNavigateToFile
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: 'Greetings, Citizen Marcus. I am the Metro District 04 Civic Response Assistant. How can I assist you with municipal dispatches, SLA timelines, or emergency hotlines today?'
    }
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: inputText.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputText.toLowerCase();
    setInputText('');

    setTimeout(() => {
      let botReply: Message = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: 'Your request has been logged. Our dispatch officers monitor Ward 04 continuously.'
      };

      if (query.includes('pothole') || query.includes('oak ave') || query.includes('001245')) {
        const ticket = complaints.find(c => c.id.includes('001245'));
        botReply = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `Ticket #ICMRS-2026-001245 on Oak Ave is currently at Step 3: Asphalt Crew Deployed. Crew 09 is on site with hot mix. Estimated completion is within 18 hours.`,
          action: {
            label: 'Open Oak Ave Ticket Tracker',
            actionType: 'open-ticket',
            targetId: ticket?.id
          }
        };
      } else if (query.includes('streetlight') || query.includes('light') || query.includes('wiring') || query.includes('001198')) {
        const ticket = complaints.find(c => c.id.includes('001198'));
        botReply = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `Ticket #ICMRS-2026-001198 on Elmwood & Maple Dr has work order issued. Power node #SL-402 is de-energized for public safety.`,
          action: {
            label: 'View Luminaire Fixture Live Feed',
            actionType: 'open-ticket',
            targetId: ticket?.id
          }
        };
      } else if (query.includes('report') || query.includes('hazard') || query.includes('file') || query.includes('new')) {
        botReply = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `You can file a new municipal report in under 60 seconds with automated camera geotagging and AI dispatch routing.`,
          action: {
            label: 'Launch Filing Wizard',
            actionType: 'file-complaint'
          }
        };
      } else if (query.includes('emergency') || query.includes('gas') || query.includes('leak') || query.includes('wire')) {
        botReply = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `For immediate life hazards, call direct emergency hotlines: Gas/Water Main: 311-990, Downed Power Wire: 311-881. Crews are on 24/7 priority standby.`
        };
      } else {
        botReply = {
          id: `b-${Date.now()}`,
          sender: 'bot',
          text: `Understood. In District 04, all civic tickets carry dynamic SLA guarantees. You currently have 2 active investigations in your registered Oak Ridge sector.`
        };
      }

      setMessages(prev => [...prev, botReply]);
    }, 600);
  };

  const handleActionClick = (action: Message['action']) => {
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-6 relative border border-gray-200 flex flex-col h-[560px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[16px] text-[#111827] flex items-center gap-1.5">
                Civic Response Virtual Assistant
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">Metro District 04 Telemetry AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto space-y-3 p-1">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div 
                className={`max-w-[80%] rounded-2xl p-3.5 text-[13px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-gray-50 text-[#111827] rounded-tl-none border border-gray-200'
                }`}
              >
                <p>{msg.text}</p>
                {msg.action && (
                  <button
                    onClick={() => handleActionClick(msg.action)}
                    className="mt-2.5 px-3 py-1.5 bg-white text-indigo-600 font-bold text-[11px] rounded-xl shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-1.5 border border-indigo-100"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{msg.action.label}</span>
                  </button>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex gap-1.5 overflow-x-auto py-2.5 border-t border-gray-100 scrollbar-none">
          <button 
            type="button"
            onClick={() => setInputText('Status of Oak Ave pothole?')}
            className="px-3 py-1 rounded-full bg-gray-100 text-[11px] text-gray-600 font-medium whitespace-nowrap hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            Oak Ave Pothole status
          </button>
          <button 
            type="button"
            onClick={() => setInputText('How do I report a water leak?')}
            className="px-3 py-1 rounded-full bg-gray-100 text-[11px] text-gray-600 font-medium whitespace-nowrap hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            Report water leak
          </button>
          <button 
            type="button"
            onClick={() => setInputText('What is emergency hotline number?')}
            className="px-3 py-1 rounded-full bg-gray-100 text-[11px] text-gray-600 font-medium whitespace-nowrap hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            Emergency lines
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-1.5">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your municipal inquiry..."
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-[13px] border border-gray-200 focus:outline-none focus:bg-white focus:border-indigo-600 font-medium"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center shadow-sm active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
