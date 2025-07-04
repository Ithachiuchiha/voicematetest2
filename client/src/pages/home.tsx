import { useState } from "react";
import VoiceRecorder from "../components/voice-recorder";
import DiaryCalendar from "../components/diary-calendar";
import KanbanBoard from "../components/kanban-board";
import TimetableManager from "../components/timetable-manager";
import Navigation from "../components/navigation";
import AuthDialog from "../components/auth-dialog";
import { useAuth } from "../contexts/auth-context";
import { Mic, Settings, Bell, LogOut } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";

type Tab = 'diary' | 'tasks' | 'schedule';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('diary');
  const { user, isAuthenticated, isLoading, signOut, setUser } = useAuth();

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Mobile Header */}
      <header className="bg-background border-b-2 border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-border">
                <Mic className="text-secondary w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Voice Mate</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/settings">
                <button className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-border hover:bg-accent transition-colors">
                  <Settings className="text-secondary w-4 h-4" />
                </button>
              </Link>
              <button className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-border">
                <Bell className="text-accent-foreground w-4 h-4" />
              </button>
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="w-8 h-8 p-0 bg-red-400 hover:bg-red-500 border-2 border-border"
                >
                  <LogOut className="w-4 h-4 text-white" />
                </Button>
              ) : (
                <AuthDialog onAuthSuccess={handleAuthSuccess} />
              )}
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="bg-card border-2 border-border rounded-lg p-8">
            <Mic className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-4">Welcome to Voice Mate</h2>
            <p className="text-muted-foreground mb-6">
              Your personal voice diary, task manager, and schedule organizer. 
              Please sign in or create an account to get started.
            </p>
            <AuthDialog onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      ) : (
        <>
          {/* Voice Recording Section */}
          <section className="max-w-md mx-auto px-4 py-6">
            <VoiceRecorder />
          </section>

          {/* Navigation Tabs */}
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <section className="max-w-4xl mx-auto px-4 pb-20">
            {activeTab === 'diary' && <DiaryCalendar />}
            {activeTab === 'tasks' && <KanbanBoard />}
            {activeTab === 'schedule' && <TimetableManager />}
          </section>
        </>
      )}

      {/* Floating Action Button - Only show when authenticated */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-30">
          <button className="w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg border-2 border-border hover:bg-accent/90 transition-all duration-200 hover:scale-105">
            <Mic className="w-6 h-6 mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
}
