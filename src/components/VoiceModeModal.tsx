import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Loader2 } from 'lucide-react';
import { pcmToBase64, playAudioChunk, resetAudioPlayback } from '../lib/audioUtils';
import { safeStringify } from '../lib/safeStringify';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
}

export default function VoiceModeModal({ isOpen, onClose, messages }: VoiceModeModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const unmountedRef = useRef(false);

  const connect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported in this environment or permission was denied.");
      }
      
      // Input: 16kHz for mic capture
      const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = inputAudioCtx;
      
      // Output: 24kHz for model output playback
      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (unmountedRef.current || !isOpen) {
        stream.getTracks().forEach(track => track.stop());
        inputAudioCtx.close();
        outputAudioCtx.close();
        return;
      }
      
      streamRef.current = stream;
      
      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(inputAudioCtx.destination);
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        // Send initial context and request the AI to start speaking immediately
        ws.send(safeStringify({ 
          setup: true,
          messages: messages 
        }));
      };
      
      ws.onclose = () => {
        setIsConnected(false);
      };
      
      ws.onerror = (e) => {
        console.error('WebSocket error');
        setError("Connection error");
        setIsConnecting(false);
      };
      
      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          ws.send(safeStringify({ audio: base64 }));
        }
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(outputAudioCtx, msg.audio);
        }
        if (msg.interrupted) {
          resetAudioPlayback();
        }
      };
    } catch (err: any) {
      console.log("Audio mode connection issue:", err?.message || 'Error');
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        setError("Mic permission denied. Please allow it in your browser settings (lock icon).");
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setError("Mic is being used by another app (like Google or ChatGPT). Close it and retry.");
      } else {
        setError("Failed to access microphone.");
      }
      setIsConnecting(false);
    }
  };
  
  const disconnect = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    resetAudioPlayback();
    setIsConnected(false);
  };

  useEffect(() => {
    unmountedRef.current = false;
    if (isOpen) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      unmountedRef.current = true;
      disconnect();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col items-center bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-inner w-full">
      <div className="flex items-center space-x-4 w-full">
        <div className="relative shrink-0">
          {isConnecting ? (
            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : isConnected ? (
            <>
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></div>
              <div className="w-12 h-12 rounded-full bg-blue-600 shadow-md flex items-center justify-center shadow-blue-500/30 z-10 relative border-2 border-white">
                <Mic className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600">
              <Mic className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {isConnecting ? (
            <p className="text-blue-800 text-sm font-bold truncate">Connecting to Tutor...</p>
          ) : isConnected ? (
            <p className="text-blue-800 text-sm font-bold animate-pulse truncate">Listening... speak now</p>
          ) : (
            <p className="text-red-500 text-xs font-bold leading-tight">{error || "Disconnected"}</p>
          )}
          <p className="text-[11px] text-blue-600/80 mt-1 font-medium uppercase tracking-wider">Voice Chat Active</p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          {!isConnecting && !isConnected && (
            <button 
              onClick={connect}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-xs font-bold"
            >
              Retry
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
            title="End Voice Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
