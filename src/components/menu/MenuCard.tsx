"use client";

import React from 'react';
import { Coffee } from 'lucide-react';
import type { MenuItem } from '@/src/lib/types/menu';

interface MenuCardProps {
  item: MenuItem;
  index: number;
  onClick: () => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col h-full bg-white rounded-4xl overflow-hidden border border-border shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer"
    >
      {/* Image / Icon Area - Match screenshot light green */}
      <div className="aspect-4/3 bg-[#d9e4d4] relative overflow-hidden flex items-center justify-center p-10">
        <Coffee className="w-full h-full text-[#b8c9b4] group-hover:scale-110 transition-transform duration-500" />
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <h3 className="font-serif font-bold text-base text-foreground mb-2 truncate">
          {item.name}
        </h3>
        
        <div className="flex flex-wrap gap-1 mb-4 mt-auto">
          {item.tags.slice(0, 2).map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-secondary/20 text-primary border border-primary/5"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between">
          <p className="text-primary font-bold text-sm flex items-center gap-1.5">
            <span className="text-base">🐟</span> {item.type === 'daily' ? item.sizes.M.price : item.price} cá
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
