
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { Bell, Clock, Trash2 } from 'lucide-react';

export default function NotificationScheduler() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const { 
    permission, 
    requestPermission, 
    scheduleRecurringNotification, 
    cancelScheduledNotification,
    getScheduledNotifications 
  } = useNotifications();
  const { toast } = useToast();

  const scheduledNotifications = getScheduledNotifications();

  const handleScheduleNotification = async () => {
    if (permission !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') {
        toast({
          title: "Permission Required",
          description: "Please allow notifications to schedule reminders.",
          variant: "destructive"
        });
        return;
      }
    }

    if (!title || !time) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and time for the notification.",
        variant: "destructive"
      });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time is in the past, schedule for tomorrow
    if (scheduledTime.getTime() <= new Date().getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const notification = {
      id: `custom-${Date.now()}`,
      title,
      body,
      scheduledTime,
      repeat
    };

    scheduleRecurringNotification(notification);

    toast({
      title: "Notification Scheduled",
      description: `"${title}" will remind you at ${time}${repeat !== 'none' ? ` (${repeat})` : ''}`,
    });

    // Reset form
    setTitle('');
    setBody('');
    setTime('');
    setRepeat('none');
  };

  const handleCancelNotification = (id: string) => {
    cancelScheduledNotification(id);
    toast({
      title: "Notification Cancelled",
      description: "The scheduled notification has been removed.",
    });
  };

  // Quick presets for common medicine times
  const quickPresets = [
    { name: 'Morning Medicine', time: '08:00', title: 'Take Morning Medicine', body: 'Time for your morning medication' },
    { name: 'Evening Medicine', time: '21:30', title: 'Take Evening Medicine', body: 'Time for your evening medication' },
    { name: 'Lunch Reminder', time: '12:30', title: 'Lunch Time', body: 'Time to have lunch' },
    { name: 'Water Reminder', time: '14:00', title: 'Drink Water', body: 'Stay hydrated! Time to drink some water' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Schedule Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="e.g., Take Medicine"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message (Optional)</Label>
            <Input
              id="body"
              placeholder="Additional details..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repeat">Repeat</Label>
            <Select value={repeat} onValueChange={(value: 'none' | 'daily' | 'weekly') => setRepeat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleScheduleNotification} className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            Schedule Notification
          </Button>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Quick Presets</h4>
            <div className="grid grid-cols-1 gap-2">
              {quickPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTitle(preset.title);
                    setBody(preset.body);
                    setTime(preset.time);
                    setRepeat('daily');
                  }}
                >
                  {preset.name} ({preset.time})
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {scheduledNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scheduledNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {notification.repeat !== 'none' && ` (${notification.repeat})`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
