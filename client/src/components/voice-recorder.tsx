import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff } from "lucide-react";
import type { InsertDiaryEntry, InsertTask } from "@shared/schema";

export default function VoiceRecorder() {
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition({
    onResult: setTranscript,
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
          <h2 className="text-lg font-semibold text-foreground mb-2">Voice Input</h2>
          <p className="text-sm text-muted-foreground">Say "Task" to create a to-do item</p>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleVoiceToggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-border transition-all duration-200 ${
              isListening 
                ? 'bg-accent voice-pulse' 
                : 'bg-primary hover:bg-accent'
            }`}
          >
            {isListening ? (
              <MicOff className="text-accent-foreground w-8 h-8" />
            ) : (
              <Mic className="text-primary-foreground w-8 h-8" />
            )}
          </button>
          
          <div className="w-full">
            <div className="bg-muted border-2 border-border rounded-lg p-4 min-h-[100px]">
              <p className="text-foreground text-sm">
                {transcript || (
                  <span className="text-muted-foreground">
                    {isListening ? "Listening... Speak now" : "Tap the microphone to start recording..."}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 w-full">
            <Button 
              onClick={handleSaveEntry}
              disabled={!transcript.trim() || saveDiaryMutation.isPending || saveTaskMutation.isPending}
              className="flex-1 bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/90"
            >
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
