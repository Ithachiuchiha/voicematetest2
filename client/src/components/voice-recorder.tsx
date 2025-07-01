import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { localStorageManager } from "@/lib/local-storage";
import { Mic, MicOff, Keyboard, Send, Zap } from "lucide-react";
import type { InsertDiaryEntry, InsertTask } from "@shared/schema";

// Task keywords for intelligent detection
const TASK_KEYWORDS = [
  'task', 'todo', 'remind', 'remember', 'need to', 'should', 'must', 'have to',
  'appointment', 'meeting', 'call', 'email', 'buy', 'get', 'pick up', 'finish',
  'complete', 'work on', 'schedule', 'plan', 'deadline', 'due', 'urgent', 'important'
];

function detectTaskFromText(text: string): boolean {
  const lowerText = text.toLowerCase();
  return TASK_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function extractTaskInfo(text: string): { title: string; description?: string; priority: 'low' | 'medium' | 'high' } {
  const lowerText = text.toLowerCase();
  
  // Determine priority based on keywords
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (lowerText.includes('urgent') || lowerText.includes('asap') || lowerText.includes('immediately')) {
    priority = 'high';
  } else if (lowerText.includes('when possible') || lowerText.includes('sometime') || lowerText.includes('eventually')) {
    priority = 'low';
  }

  // Extract title (first sentence or up to 50 characters)
  const sentences = text.split(/[.!?]+/);
  const title = sentences[0].trim();
  
  // Use remaining text as description if available
  const description = sentences.length > 1 ? sentences.slice(1).join('. ').trim() : undefined;

  return {
    title: title.length > 50 ? title.substring(0, 47) + '...' : title,
    description: description && description.length > 0 ? description : undefined,
    priority
  };
}

export default function VoiceRecorder() {
  const [transcript, setTranscript] = useState("");
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settings = localStorageManager.getSettings();

  const saveDiaryMutation = useMutation({
    mutationFn: async (entry: InsertDiaryEntry) => {
      const response = await apiRequest("POST", "/api/diary", entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
      toast({ title: "Diary entry saved!" });
    },
    onError: () => {
      toast({ 
        title: "Failed to save diary entry", 
        variant: "destructive" 
      });
    },
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (task: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created!" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create task", 
        variant: "destructive" 
      });
    },
  });

  const processInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    
    try {
      if (detectTaskFromText(text)) {
        // Create task
        const taskInfo = extractTaskInfo(text);
        const task: InsertTask = {
          title: taskInfo.title,
          description: taskInfo.description,
          status: 'not_started',
          priority: taskInfo.priority,
          dueDate: null,
        };
        await saveTaskMutation.mutateAsync(task);
        toast({ 
          title: "Smart Task Created! 🎯",
          description: `Priority: ${taskInfo.priority}` 
        });
      } else {
        // Create diary entry
        const entry: InsertDiaryEntry = {
          content: text,
          date: new Date().toISOString().split('T')[0],
        };
        await saveDiaryMutation.mutateAsync(entry);
        toast({ 
          title: "Diary Entry Saved! 📝",
          description: "Your thoughts have been recorded" 
        });
      }
      
      setTranscript("");
    } catch (error) {
      console.error('Auto-process error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceResult = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text);
    
    // Auto-process when speech is final and contains enough content
    if (isFinal && text.length > 5) {
      setTimeout(() => {
        processInput(text);
      }, 500); // Small delay to ensure recognition is complete
    }
  }, []);

  const { isListening, startListening, stopListening, isSupported, error } = useVoiceRecognition({
    onResult: handleVoiceResult,
    lang: settings.voiceLanguage || 'en-US',
    continuous: false,
    interimResults: true,
  });

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      processInput(transcript);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      setTranscript("");
      startListening();
    }
  };

  const toggleInputMode = () => {
    if (isListening) {
      stopListening();
    }
    setInputMode(inputMode === 'voice' ? 'text' : 'voice');
    setTranscript("");
  };

  const isTaskMode = transcript && detectTaskFromText(transcript);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleInputMode}
              className="flex items-center gap-2"
            >
              {inputMode === 'voice' ? <Keyboard className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {inputMode === 'voice' ? 'Switch to Text' : 'Switch to Voice'}
            </Button>
          </div>

          {/* Voice Input */}
          {inputMode === 'voice' && (
            <div className="text-center space-y-4">
              <Button
                onClick={handleVoiceToggle}
                disabled={!isSupported || isProcessing}
                size="lg"
                className={`w-16 h-16 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground">
                {isListening ? 'Listening... Speak now' : 'Click to start speaking'}
              </p>
              
              {!isSupported && (
                <p className="text-sm text-destructive">
                  Voice recognition not supported in this browser
                </p>
              )}
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          {/* Text Input */}
          {inputMode === 'text' && (
            <div className="space-y-2">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your thoughts, tasks, or reminders here..."
                className="min-h-[120px] text-base"
                disabled={isProcessing}
              />
              <Button 
                onClick={handleManualSubmit}
                disabled={!transcript.trim() || isProcessing}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Submit'}
              </Button>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="space-y-2">
              <div className={`p-4 rounded-lg border-2 transition-colors ${
                isTaskMode 
                  ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950' 
                  : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {isTaskMode ? (
                    <>
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Task Detected</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Diary Entry</span>
                    </>
                  )}
                </div>
                <p className="text-sm leading-relaxed">{transcript}</p>
              </div>
              
              {inputMode === 'voice' && (
                <p className="text-xs text-center text-muted-foreground">
                  {isTaskMode 
                    ? '🎯 Will be added as a task automatically' 
                    : '📝 Will be saved as diary entry automatically'
                  }
                </p>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Processing your input...
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}