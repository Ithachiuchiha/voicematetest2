import { useState } from "react";
import VoiceRecorder from "@/components/voice-recorder";
import DiaryCalendar from "@/components/diary-calendar";
import KanbanBoard from "@/components/kanban-board";
import TimetableManager from "@/components/timetable-manager";
import Navigation from "@/components/navigation";
import { Mic, Settings, Bell } from "lucide-react";
import { Link } from "wouter";

type Tab = 'diary' | 'tasks' | 'schedule';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('diary');

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
            </div>
          </div>
        </div>
      </header>

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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-30">
        <button className="w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg border-2 border-border hover:bg-accent/90 transition-all duration-200 hover:scale-105">
          <Mic className="w-6 h-6 mx-auto" />
        </button>
      </div>
    </div>
  );
}
