import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { localStorageManager } from "@/lib/local-storage";
import { Mic, MicOff, Keyboard, Send } from "lucide-react";
import type { InsertDiaryEntry, InsertTask } from "@shared/schema";

export default function VoiceRecorder() {
  const [transcript, setTranscript] = useState("");
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settings = localStorageManager.getSettings();
  const { isListening, startListening, stopListening, isSupported, error } = useVoiceRecognition({
    onResult: setTranscript,
    lang: settings.voiceLanguage || 'en-US',
    continuous: true,
    interimResults: true,
  });

  const saveDiaryMutation = useMutation({
    mutationFn: async (entry: InsertDiaryEntry) => {
      const response = await apiRequest("POST", "/api/diary", entry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
      toast({ title: "Diary entry saved successfully!" });
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
      toast({ title: "Task created successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create task", 
        variant: "destructive" 
      });
    },
  });

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
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

  const handleSaveEntry = () => {
    if (!transcript.trim()) {
      toast({ 
        title: "No content to save", 
        variant: "destructive" 
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if transcript contains "Task" keyword for automatic categorization
    if (transcript.toLowerCase().includes('task')) {
      // Extract task content (remove "Task" prefix if present)
      const taskContent = transcript.replace(/^task:?\s*/i, '').trim();
      const [title, ...descriptionParts] = taskContent.split('.');
      
      const task: InsertTask = {
        title: title.trim() || taskContent,
        description: descriptionParts.join('.').trim() || undefined,
        status: 'not_started',
        priority: 'medium',
        dueDate: today,
      };
      
      saveTaskMutation.mutate(task);
    } else {
      // Save as diary entry
      const entry: InsertDiaryEntry = {
        content: transcript,
        date: today,
      };
      
      saveDiaryMutation.mutate(entry);
    }
    
    setTranscript("");
  };

  const handleClear = () => {
    setTranscript("");
    stopListening();
  };

  if (!isSupported) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Voice recognition is not supported in your browser
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-border">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              {inputMode === 'voice' ? 'Voice Input' : 'Manual Input'}
            </h2>
            <Button
              onClick={toggleInputMode}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              {inputMode === 'voice' ? <Keyboard className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Type or say "Task" at the beginning to create a to-do item
          </p>
          {error && error.includes('not-allowed') && (
            <p className="text-sm text-red-500 mt-2">
              Please allow microphone access to use voice input
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          {inputMode === 'voice' ? (
            <button
              onClick={handleVoiceToggle}
              disabled={!isSupported}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-border transition-all duration-200 ${
                isListening 
                  ? 'bg-accent voice-pulse' 
                  : 'bg-primary hover:bg-accent'
              } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? (
                <MicOff className="text-accent-foreground w-8 h-8" />
              ) : (
                <Mic className="text-primary-foreground w-8 h-8" />
              )}
            </button>
          ) : (
            <div className="w-full">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your entry here... Start with 'Task' to create a to-do item"
                className="min-h-[120px] border-2 border-border resize-none"
              />
            </div>
          )}
          
          {inputMode === 'voice' && (
            <div className="w-full">
              <div className="bg-muted border-2 border-border rounded-lg p-4 min-h-[100px]">
                <p className="text-foreground text-sm">
                  {transcript || (
                    <span className="text-muted-foreground">
                      {!isSupported ? "Voice recognition not supported in this browser" :
                       isListening ? "Listening... Speak now" : "Tap the microphone to start recording..."}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 w-full">
            <Button 
              onClick={handleSaveEntry}
              disabled={!transcript.trim() || saveDiaryMutation.isPending || saveTaskMutation.isPending}
              className="flex-1 bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Save Entry
            </Button>
            <Button 
              onClick={handleClear}
              variant="outline"
              className="flex-1 border-2 border-border"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
