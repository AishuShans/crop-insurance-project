import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

const Chatbot = () => {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: t('chatbot.welcome'), language: 'Auto' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeLang, setActiveLang] = useState('Auto');
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message if language changes and it's the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
        setMessages([{ sender: 'bot', text: t('chatbot.welcome'), language: 'Auto' }]);
    }
  }, [language, t]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    // Add user message to UI
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      // Setup request payload
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          language: activeLang === 'Auto' ? (language === 'ta' ? 'ta' : 'en') : activeLang
        })
      });

      if (!response.ok) {
        const errDetails = await response.text();
        throw new Error(`Network response was not ok: ${response.status} ${errDetails}`);
      }

      const data = await response.json();
      
      // Update active language from backend detection
      if (data.language && data.language !== 'Auto') {
        setActiveLang(data.language);
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply, language: data.language }]);
    } catch (error) {
      console.error('Chat API Error:', error);
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: t('chatbot.error'),
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`transition-all duration-300 ease-in-out transform origin-bottom-right mb-4 overflow-hidden shadow-2xl glass rounded-2xl flex flex-col w-80 sm:w-96 border border-emerald-200/50 ${
          isOpen ? 'scale-100 opacity-100 h-[500px]' : 'scale-0 opacity-0 h-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <div className="font-semibold tracking-wide">{t('chatbot.title')}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs bg-white/20 px-2 py-1 rounded-full border border-white/30 backdrop-blur-sm shadow-sm" title="Active Language">
              {activeLang === 'Auto' ? (language === 'ta' ? 'Tamil' : 'English') : activeLang}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 shadow-md rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-sm' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                      : 'bg-white text-gray-800 border border-emerald-100 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-emerald-100 text-emerald-600 p-3 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-2">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{animationDelay: "0.2s"}}>●</span>
                <span className="animate-bounce" style={{animationDelay: "0.4s"}}>●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white/60 border-t border-emerald-100 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chatbot.placeholder')}
              className="w-full pl-4 pr-12 py-3 rounded-full bg-white/80 border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner transition-all placeholder:text-gray-400"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center transform hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-red-500 hover:bg-red-600 text-white rotate-90' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white animate-pulse-slow'
        }`}
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <span className="text-2xl font-light">✕</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </button>

      {/* Basic keyframes for subtle animation, could also go into index.css */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
      `}} />
    </div>
  );
};

export default Chatbot;
