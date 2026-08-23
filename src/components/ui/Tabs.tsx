import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
}

export function Tabs({ tabs, active, onChange, variant = 'underline' }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className="flex gap-1 p-1 bg-ink-100 rounded-xl overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              active === tab.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1 border-b border-ink-200 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
            active === tab.id
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-ink-500 hover:text-ink-800 hover:border-ink-300'
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function useTabs(defaultTab: string) {
  const [active, setActive] = useState(defaultTab);
  return { active, setActive };
}
