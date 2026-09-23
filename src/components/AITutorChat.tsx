import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, Loader2, GripHorizontal, ImageIcon, XCircle, Mic } from 'lucide-react';
import Draggable from 'react-draggable';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { safeStringify } from '../lib/safeStringify';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import VoiceModeModal from './VoiceModeModal';

type Message = {
  role: 'user' | 'model';
  content: string;
  image?: string; // base64
};

const formatLaTeX = (text: string) => {
  if (!text) return text;
  // Fallback to fixing literal unescaped brackets and escaped parentheses if LLM misbehaves
  let formatted = text
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');
    
  // Sometimes OpenRouter GPT-4o-mini outputs raw brackets for block math: [ ... ]
  // We can try to replace ^[ and ]$ on lines if they contain math, but it's tricky.
  // We'll replace lines that start with [ and end with ] if they look like math.
  formatted = formatted.replace(/(?:^|\n)\s*\[\s(.*?)\s\]\s*(?=\n|$)/g, '\n$$$$ $1 $$$$\n');
  
  return formatted;
};

export default function AITutorChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your JEE AI Tutor. Ask me any doubt, or upload a photo of your math, physics, or chemistry question!" }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dragStartTime = useRef<number>(0);
  const dragStartPos = useRef<{x: number, y: number}>({x: 0, y: 0});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  if (!user) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    
    const userMsg: Message = { 
      role: 'user', 
      content: input.trim(),
      ...(selectedImage ? { image: selectedImage } : {})
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: safeStringify({ messages: newMessages })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', content: data.text || data.answer }]);
    } catch (error) {
      console.error(error?.message || 'Error');
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Draggable 
          nodeRef={buttonRef} 
          bounds="parent"
          onStart={(e, data) => {
            dragStartTime.current = Date.now();
            dragStartPos.current = { x: data.x, y: data.y };
          }}
          onStop={(e, data) => {
            const timeDiff = Date.now() - dragStartTime.current;
            const dist = Math.sqrt(Math.pow(data.x - dragStartPos.current.x, 2) + Math.pow(data.y - dragStartPos.current.y, 2));
            if (timeDiff < 250 || dist < 5) {
              setIsOpen(true);
            }
          }}
        >
          <button
            ref={buttonRef}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="fixed bottom-40 right-6 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-[100] group flex items-center justify-center cursor-move"
          >
            <Bot className="w-7 h-7 pointer-events-none" />
            <span className="absolute right-full mr-4 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-semibold py-1.5 px-3 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Drag or Click to Ask
            </span>
          </button>
        </Draggable>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Draggable nodeRef={windowRef} handle=".chat-drag-handle" cancel=".no-drag" bounds="parent">
          <div ref={windowRef} className={cn(
            "fixed bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all z-[100] border border-slate-200 dark:border-slate-700",
            isExpanded 
              ? "w-[90vw] h-[90vh] sm:w-[800px] sm:h-[80vh] bottom-[5vh] right-[5vw] sm:bottom-6 sm:right-6" 
              : "w-[90vw] sm:w-[380px] h-[550px] bottom-24 right-[5vw] sm:right-6"
          )}>
            {/* Header */}
            <div className="chat-drag-handle bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0 shadow-sm z-10 cursor-move">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 dark:bg-slate-900/20 p-2 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[15px]">JEE AI Tutor</h3>
                <p className="text-blue-100 text-[11px] font-medium tracking-wide uppercase mt-0.5">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 no-drag">
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-lg transition-colors text-white/90 hover:text-white" title={isExpanded ? "Minimize" : "Expand"}>
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 dark:hover:bg-slate-900/20 rounded-lg transition-colors text-white/90 hover:text-white" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-800">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex w-full flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-sm ml-8" 
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-800 mr-8"
                )}>
                  {msg.image && (
                    msg.image.startsWith("data:application/pdf") ? (
                      <div className="mb-2 p-3 bg-white/10 dark:bg-slate-900/10 rounded-lg flex items-center space-x-2 border border-white/20">
                        <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">PDF</div>
                        <span className="text-sm font-medium">Document attached</span>
                      </div>
                    ) : (
                      <img src={msg.image} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-2 border border-white/20" />
                    )
                  )}
                  {msg.role === 'model' ? (
                    <div className="prose prose-sm prose-slate max-w-none prose-p:leading-snug prose-p:my-1.5 prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:p-3 prose-pre:rounded-lg">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatLaTeX(msg.content)}
                      </Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{formatLaTeX(msg.content)}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            {isVoiceModeOpen && (
              <div className="mb-3">
                <VoiceModeModal isOpen={isVoiceModeOpen} onClose={() => setIsVoiceModeOpen(false)} messages={messages} />
              </div>
            )}
            {selectedImage && (
              <div className="relative inline-block mb-2">
                {selectedImage.startsWith("data:application/pdf") ? (
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">PDF</div>
                  </div>
                ) : (
                  <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                )}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-white dark:bg-slate-900 rounded-full text-slate-500 dark:text-slate-400 hover:text-red-500 shadow-sm"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex items-end space-x-2">
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:bg-slate-700 transition-colors shrink-0"
                title="Upload Image or PDF"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsVoiceModeOpen(!isVoiceModeOpen)}
                className={cn(
                  "p-3.5 rounded-xl transition-colors shrink-0",
                  isVoiceModeOpen ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                )}
                title="Voice Chat"
              >
                <Mic className="w-5 h-5" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question or share a concept..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-3 text-sm outline-none resize-none min-h-[46px] max-h-[140px] overflow-y-auto"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-center mt-2.5">
              <p className="text-[10px] text-slate-400">AI Tutor can make mistakes. Verify important formulas.</p>
            </div>
          </div>
        </div>
        </Draggable>
      )}
    </>
  );
}