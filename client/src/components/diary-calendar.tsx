import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import type { DiaryEntry } from "@shared/schema";

export default function DiaryCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/diary/${selectedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch diary entries');
      }
      return response.json();
    },
  });

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const selected = new Date(year, month, day).toISOString().split('T')[0];
    setSelectedDate(selected);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getDaysInMonth(currentDate);
  const today = new Date().toISOString().split('T')[0];
  const selectedDay = parseInt(selectedDate.split('-')[2]);

  return (
    <div className="max-w-md mx-auto">
      {/* Calendar */}
      <Card className="border-2 border-border mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex space-x-2">
              <Button
                onClick={handlePreviousMonth}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 border-2 border-border"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleNextMonth}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 border-2 border-border"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                className={`w-8 h-8 text-sm rounded transition-colors relative ${
                  !day
                    ? 'text-transparent'
                    : day === selectedDay
                    ? 'bg-primary text-primary-foreground font-medium border-2 border-border'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {day}
                {day && Math.random() > 0.8 && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Diary Entries */}
      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedDate === today ? 'Today' : new Date(selectedDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No diary entries for this date
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-muted border-2 border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(entry.timestamp)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">
                    {entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
