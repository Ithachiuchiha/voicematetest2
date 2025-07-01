import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecognitionOptions {
  onResult: (transcript: string) => void;
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
}

export function useVoiceRecognition({
  onResult,
  onError,
  continuous = true,
  interimResults = true,
  lang = 'en-US',
}: VoiceRecognitionOptions): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Stopping existing recognition');
      }
    }

    try {
      const SpeechRecognition = 
        window.SpeechRecognition || window.webkitSpeechRecognition;
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      shouldRestartRef.current = true;
      
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
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
        
        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript) {
          onResult(currentTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different types of errors
        if (event.error === 'no-speech' && shouldRestartRef.current) {
          // Just restart silently for no-speech
          return;
        }
        
        if (event.error === 'network') {
          // Network errors are common, don't show to user
          console.log('Network error detected, will retry');
          return;
        }
        
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions.');
          setIsListening(false);
          shouldRestartRef.current = false;
          if (onError) onError(event);
          return;
        }
        
        // For other errors, just log them
        console.warn('Speech recognition issue:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        
        // Auto-restart if we should continue listening
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current) {
              startListening();
            }
          }, 500);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Voice recognition failed: ${errorMessage}`);
      setIsListening(false);
      shouldRestartRef.current = false;
    }
  }, [isSupported, continuous, interimResults, lang, onResult, onError]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    
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
      shouldRestartRef.current = false;
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