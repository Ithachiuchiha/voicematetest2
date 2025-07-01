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
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
      
      // Additional settings for better performance
      if ('grammars' in recognition) {
        recognition.grammars = null;
      }
      if ('serviceURI' in recognition) {
        recognition.serviceURI = '';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on successful start
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
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
        
        // Always update with latest transcript (final or interim)
        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript) {
          onResult(currentTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different error types appropriately
        if (event.error === 'no-speech' && shouldRestartRef.current) {
          // No speech detected - restart silently
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              recognition.start();
            }
          }, 100);
          return;
        }
        
        if (event.error === 'network' && shouldRestartRef.current) {
          retryCountRef.current += 1;
          if (retryCountRef.current <= maxRetries) {
            console.log(`Network error, retrying... (${retryCountRef.current}/${maxRetries})`);
            setTimeout(() => {
              if (shouldRestartRef.current && recognitionRef.current) {
                recognition.start();
              }
            }, 1000 * retryCountRef.current); // Increasing delay
            return;
          } else {
            console.log('Max retries reached for network error');
            retryCountRef.current = 0;
            // Continue silently without showing error
            return;
          }
        }
        
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions.');
          setIsListening(false);
          shouldRestartRef.current = false;
          if (onError) onError(event);
          return;
        }
        
        if (event.error === 'service-not-allowed') {
          setError('Speech recognition service not available.');
          setIsListening(false);
          shouldRestartRef.current = false;
          if (onError) onError(event);
          return;
        }
        
        // For aborted or other minor errors, don't show to user, just restart
        if (event.error === 'aborted') {
          return;
        }
        
        // Only show error for serious issues
        console.warn('Speech recognition issue:', event.error);
        // Don't set error state for network issues, just continue
      };

      recognition.onend = () => {
        // Auto-restart if we should continue listening
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current && recognitionRef.current) {
              recognition.start();
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('Failed to start speech recognition');
      setIsListening(false);
      shouldRestartRef.current = false;
    }
  }, [isSupported, continuous, interimResults, lang, onResult, onError]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
