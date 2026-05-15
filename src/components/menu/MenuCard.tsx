"use client";

import React from 'react';
import { Coffee } from 'lucide-react';
import type { MenuItem } from '@/src/lib/types/menu';

interface MenuCardProps {
  item: MenuItem;
  index: number;
  onClick: () => void;
}

/** Size label map for the 3 sizes shown on the card. */
const SIZE_CARD_LABELS: Record<string, string> = {
  M: "Cá Con",
  L: "Cá Vừa",
  XL: "Cá Lớn",
};

/** MenuCard — displays a single menu item in the customer menu grid. */
const MenuCard: React.FC<MenuCardProps> = ({ item, onClick }) => {
  const sizes = item.sizes.filter((s) => s.base_price_vnd != null);

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
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 bg-white">
        <h3 className="font-serif font-bold text-base text-foreground mb-3 truncate">
          {item.name}
        </h3>

        {/* Size prices row */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-end justify-between gap-1">
            {sizes.map((s) => (
              <div key={s.size} className="flex flex-col items-center gap-0.5 flex-1">
                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-wide whitespace-nowrap">
                  {SIZE_CARD_LABELS[s.size] ?? s.size}
                </span>
                <span className="text-sm font-bold text-primary">
                  {(s.base_price_vnd ?? 0) / 1000}k
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
