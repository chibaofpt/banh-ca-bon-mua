"use client";

import React from 'react';
import { Coffee } from 'lucide-react';
import type { MenuItem } from '@/src/lib/types/menu';

interface MenuCardProps {
  item: MenuItem;
  index: number;
  onClick: () => void;
}

/** MenuCard — displays a single menu item in the customer menu grid. */
const MenuCard: React.FC<MenuCardProps> = ({ item, onClick }) => {
  // Phase 2: all items use base_price_vnd from sizes. Show L as reference price.
  const displayPrice =
    item.sizes.find((s) => s.size === "L")?.base_price_vnd
    ?? item.sizes[0]?.base_price_vnd
    ?? 0;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col h-full bg-white rounded-4xl overflow-hidden border border-border shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer"
    >
      {/* Image / Icon Area */}
      <div className="aspect-4/3 bg-[#d9e4d4] relative overflow-hidden flex items-center justify-center p-10">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Coffee className="w-full h-full text-[#b8c9b4] group-hover:scale-110 transition-transform duration-500" />
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <h3 className="font-serif font-bold text-base text-foreground mb-2 truncate">
          {item.name}
        </h3>

        <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
          <p className="text-primary font-bold text-sm flex items-center gap-1.5">
            <span className="text-base">🐟</span> {displayPrice / 1000} ca
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
