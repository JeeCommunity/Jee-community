import React, { useState } from 'react';
import { X, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { safeStringify } from '../lib/safeStringify';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';


interface AISolverModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AISolverModal({ post, isOpen, onClose }: AISolverModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSolve = async () => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    // Add initial user message (context) if empty
    if (messages.length === 0) {
      setMessages([{ role: 'user', content: "Please help me solve this doubt: " + post.text }]);
    }
    
    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: safeStringify({ 
          problemText: post.text,
          images: post.images || []
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error?.includes('high demand') || data.error?.includes('try again later')) {
           throw new Error("The AI is currently under high demand. Please try again in a few moments.");
        }
        throw new Error(data.error || 'Failed to get solution');
      }
      
      setMessages(prev => [
        ...prev, 
        ...(prev.length === 0 ? [{ role: 'user', content: "Please help me solve this doubt: " + post.text } as Message] : []),
        { role: 'ai', content: data.answer }
      ]);
      
    } catch (err: any) {
      console.error(err?.message || 'Error');
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if opened and no messages
  React.useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleSolve();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200">AI Doubt Solver</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-800">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex space-x-4", msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400" : "bg-blue-600 text-white shadow-md"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={cn(
                "max-w-[85%] rounded-2xl px-5 py-4",
                msg.role === 'user' 
                  ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tr-sm" 
                  : "bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm prose prose-sm max-w-none"
              )}>
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <div className="text-sm leading-relaxed space-y-4">
                    {(() => {
                      const parts = msg.content.split(/(?:#+\s*|\*\*\s*|✅\s*)?Final Answer:?\s*\**\n?/i);
                      if (parts.length > 1) {
                        return (
                          <>
                            <div className="markdown-body">
                              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{parts[0]}</Markdown>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 shadow-sm">
                              <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Final Answer
                              </h4>
                              <div className="markdown-body text-blue-900">
                                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{parts[1]}</Markdown>
                              </div>
                            </div>
                          </>
                        );
                      }
                      return (
                        <div className="markdown-body">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</Markdown>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">Thinking...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <p className="text-xs text-center text-slate-400">
            AI can make mistakes. Verify complex concepts with your teachers.
          </p>
        </div>
      </div>
    </div>
  );
}
