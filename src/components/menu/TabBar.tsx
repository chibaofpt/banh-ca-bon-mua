"use client";

import React from 'react';

type TabId = 'daily' | 'seasonal' | 'taiyaki';

interface Tab {
  id: TabId;
  label: string;
}

interface TabBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const tabs: Tab[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'seasonal', label: 'Theo Mùa' },
  { id: 'taiyaki', label: 'Bánh Cá' },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-6 mt-8 no-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-400 ${
            activeTab === tab.id
              ? 'bg-primary text-white shadow-lg'
              : 'bg-[#d9e4d4] text-primary/70 hover:bg-[#c9d4c4]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
export type { TabId };
