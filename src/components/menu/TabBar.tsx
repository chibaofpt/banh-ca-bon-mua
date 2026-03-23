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
    <div className="flex w-full border-b-[1px] border-[#e0eed8] mb-8 bg-white sticky top-[72px] z-40">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 text-center py-2.5 text-[12px] font-medium tracking-[0.05em] uppercase transition-all duration-300 ${
            activeTab === tab.id
              ? 'text-[#16610C] border-b-2 border-[#16610C] bg-white'
              : 'text-[#888] bg-transparent'
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
