import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";
import { useNotifications } from "../hooks/use-notifications";
import { localStorageManager } from "../lib/local-storage";
import { ArrowLeft, Bell, Mic, Palette, Download, Upload, Trash2, Volume2 } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const { toast } = useToast();
  const { permission, requestPermission } = useNotifications();
  const [settings, setSettings] = useState(localStorageManager.getSettings());
  const [customSound, setCustomSound] = useState<string | null>(null);

  useEffect(() => {
    // Load custom notification sound from localStorage
    const savedSound = localStorage.getItem('voice_mate_notification_sound');
    setCustomSound(savedSound);
  }, []);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorageManager.saveSettings(newSettings);
    toast({ title: "Settings saved successfully!" });
  };

  const handleNotificationPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast({ title: "Notification permission granted!" });
    } else {
      toast({ 
        title: "Notification permission denied",
        variant: "destructive"
      });
    }
  };

  const handleSoundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file (mp3, wav, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const audioData = e.target?.result as string;
        localStorage.setItem('voice_mate_notification_sound', audioData);
        setCustomSound(audioData);
        toast({ title: "Custom notification sound uploaded!" });
      };
      reader.readAsDataURL(file);
    }
  };

  const playTestSound = () => {
    if (customSound) {
      const audio = new Audio(customSound);
      audio.play().catch(() => {
        toast({
          title: "Cannot play sound",
          description: "Your browser blocked audio playback",
          variant: "destructive"
        });
      });
    } else {
      // Play default browser notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0LFHC37tuJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwUDFCp5/CrVQ0L');
      audio.play().catch(() => {
        toast({
          title: "Cannot play sound",
          description: "Your browser blocked audio playback",
          variant: "destructive"
        });
      });
    }
  };

  const exportData = () => {
    const data = localStorageManager.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-mate-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Data exported successfully!" });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const success = localStorageManager.importData(jsonData);
          if (success) {
            toast({ title: "Data imported successfully!" });
            window.location.reload();
          } else {
            toast({
              title: "Import failed",
              description: "Invalid backup file format",
              variant: "destructive"
            });
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Unable to read backup file",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL your data? This cannot be undone!')) {
      localStorageManager.clearAllData();
      toast({ title: "All data cleared successfully!" });
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b-2 border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Notifications */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <Switch
                id="notifications"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
              />
            </div>
            
            {permission !== 'granted' && (
              <Button 
                onClick={handleNotificationPermission}
                variant="outline" 
                className="w-full"
              >
                Grant Notification Permission
              </Button>
            )}

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Custom Notification Sound</span>
              </Label>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => document.getElementById('sound-upload')?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  Upload Sound
                </Button>
                <Button
                  onClick={playTestSound}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              
              <input
                id="sound-upload"
                type="file"
                accept="audio/*"
                onChange={handleSoundUpload}
                className="hidden"
              />
              
              {customSound && (
                <p className="text-xs text-muted-foreground">
                  Custom sound uploaded ✓
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Settings */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>Voice Recognition</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Voice Language</Label>
              <Select
                value={settings.voiceLanguage}
                onValueChange={(value) => handleSettingChange('voiceLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="es-ES">Spanish</SelectItem>
                  <SelectItem value="fr-FR">French</SelectItem>
                  <SelectItem value="de-DE">German</SelectItem>
                  <SelectItem value="it-IT">Italian</SelectItem>
                  <SelectItem value="pt-PT">Portuguese</SelectItem>
                  <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                  <SelectItem value="ja-JP">Japanese</SelectItem>
                  <SelectItem value="ko-KR">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => handleSettingChange('theme', value as 'light' | 'dark')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={exportData}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
              
              <Button
                onClick={() => document.getElementById('data-import')?.click()}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </Button>
            </div>
            
            <input
              id="data-import"
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />

            <Separator />

            <Button
              onClick={clearAllData}
              variant="destructive"
              className="w-full flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle>About Voice Mate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
            <p className="text-sm text-muted-foreground">
              Your voice-powered assistant for diary, tasks, and scheduling
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}