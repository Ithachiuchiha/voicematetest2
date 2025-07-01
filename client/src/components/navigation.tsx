import { Book, CheckSquare, Clock } from "lucide-react";

type Tab = 'diary' | 'tasks' | 'schedule';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'diary' as Tab, label: 'Diary', icon: Book },
    { id: 'tasks' as Tab, label: 'Tasks', icon: CheckSquare },
    { id: 'schedule' as Tab, label: 'Schedule', icon: Clock },
  ];

  return (
    <nav className="max-w-md mx-auto px-4 mb-6">
      <div className="bg-background border-2 border-border rounded-xl p-2">
        <div className="flex space-x-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-1 ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
