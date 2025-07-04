import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body?: string;
  scheduledTime: Date;
  repeat?: 'daily' | 'weekly' | 'none';
  taskId?: number;
  scheduleId?: number;
}

interface NotificationHook {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (options: NotificationOptions) => void;
  scheduleNotification: (options: NotificationOptions, delay: number) => void;
  scheduleTaskNotification: (task: any) => void;
  scheduleRecurringNotification: (notification: ScheduledNotification) => void;
  cancelScheduledNotification: (id: string) => void;
  getScheduledNotifications: () => ScheduledNotification[];
}

export function useNotifications(): NotificationHook {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
      // Load scheduled notifications from localStorage
      const stored = localStorage.getItem('scheduledNotifications');
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          scheduledTime: new Date(n.scheduledTime)
        }));
        setScheduledNotifications(notifications);
        // Set up timers for existing notifications
        notifications.forEach(setupNotificationTimer);
      }
    }
  }, [isSupported]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications));
  }, [scheduledNotifications]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  const showNotification = useCallback((options: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Notifications not supported or permission not granted');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
      });

      // Auto-close after 5 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click events
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission]);

  const scheduleNotification = useCallback((options: NotificationOptions, delay: number) => {
    setTimeout(() => {
      showNotification(options);
    }, delay);
  }, [showNotification]);

  const setupNotificationTimer = useCallback((notification: ScheduledNotification) => {
    const now = new Date();
    const scheduledTime = new Date(notification.scheduledTime);
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        showNotification({
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          tag: notification.id,
          requireInteraction: true
        });

        // Handle recurring notifications
        if (notification.repeat === 'daily') {
          const nextDay = new Date(scheduledTime);
          nextDay.setDate(nextDay.getDate() + 1);
          const updatedNotification = { ...notification, scheduledTime: nextDay };
          setScheduledNotifications(prev => 
            prev.map(n => n.id === notification.id ? updatedNotification : n)
          );
          setupNotificationTimer(updatedNotification);
        } else if (notification.repeat === 'weekly') {
          const nextWeek = new Date(scheduledTime);
          nextWeek.setDate(nextWeek.getDate() + 7);
          const updatedNotification = { ...notification, scheduledTime: nextWeek };
          setScheduledNotifications(prev => 
            prev.map(n => n.id === notification.id ? updatedNotification : n)
          );
          setupNotificationTimer(updatedNotification);
        }
      }, delay);
    }
  }, [showNotification]);

  const scheduleTaskNotification = useCallback((task: any) => {
    if (!task.dueDate && !task.reminderTime) return;

    const notificationId = `task-${task.id}`;
    const reminderTime = task.reminderTime || task.dueDate;
    const scheduledTime = new Date(reminderTime);

    const notification: ScheduledNotification = {
      id: notificationId,
      title: `Task Reminder: ${task.title}`,
      body: task.description || 'You have a task due soon!',
      scheduledTime,
      repeat: 'none',
      taskId: task.id
    };

    setScheduledNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notificationId);
      return [...filtered, notification];
    });

    setupNotificationTimer(notification);
  }, [setupNotificationTimer]);

  const scheduleRecurringNotification = useCallback((notification: ScheduledNotification) => {
    setScheduledNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notification.id);
      return [...filtered, notification];
    });

    setupNotificationTimer(notification);
  }, [setupNotificationTimer]);

  const cancelScheduledNotification = useCallback((id: string) => {
    setScheduledNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getScheduledNotifications = useCallback(() => {
    return scheduledNotifications;
  }, [scheduledNotifications]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleNotification,
    scheduleTaskNotification,
    scheduleRecurringNotification,
    cancelScheduledNotification,
    getScheduledNotifications,
  };
}
