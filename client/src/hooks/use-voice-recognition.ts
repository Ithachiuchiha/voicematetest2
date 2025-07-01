import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecognitionOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Event) => void;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

interface VoiceRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  transcript: string;
}

export function useVoiceRecognition({
  onResult,
  onError,
  continuous = false,
  interimResults = true,
  lang = 'en-US',
}: VoiceRecognitionOptions): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);
  const finalTranscriptRef = useRef('');

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (isActiveRef.current) {
      return; // Already listening
    }

    try {
      const SpeechRecognition = 
        window.SpeechRecognition || window.webkitSpeechRecognition;
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      isActiveRef.current = true;
      finalTranscriptRef.current = '';
      
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript + ' ';
          const fullTranscript = finalTranscriptRef.current.trim();
          setTranscript(fullTranscript);
          onResult(fullTranscript, true);
        } else if (interimTranscript) {
          const currentTranscript = (finalTranscriptRef.current + interimTranscript).trim();
          setTranscript(currentTranscript);
          onResult(currentTranscript, false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions.');
          setIsListening(false);
          isActiveRef.current = false;
          if (onError) onError(event);
          return;
        }
        
        if (event.error === 'no-speech') {
          // Silently handle no speech
          return;
        }
        
        if (event.error === 'network') {
          // Don't spam user with network errors
          console.log('Network error detected');
          return;
        }
        
        // For other errors, just log them
        console.warn('Speech recognition issue:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        isActiveRef.current = false;
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Voice recognition failed: ${errorMessage}`);
      setIsListening(false);
      isActiveRef.current = false;
    }
  }, [isSupported, continuous, interimResults, lang, onResult, onError]);

  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Error stopping recognition');
      }
    }
    
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Cleanup recognition');
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
    transcript,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}