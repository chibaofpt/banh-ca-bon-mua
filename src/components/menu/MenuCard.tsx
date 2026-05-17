"use client";

import React from 'react';
import { Coffee } from 'lucide-react';
import type { MenuItem } from '@/src/lib/types/menu';
import { usePowderStore } from '@/src/lib/store/powderStore';
import { calcLattePrice, calcFusionPrice, resolveGram } from '@/src/utils/pricing';

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
  const powders = usePowderStore((s) => s.data);
  const defaultPowderGrams = usePowderStore((s) => s.defaultPowderGram);

  const isLatte = item.category === "latte";
  const defaultPowderId = isLatte ? item.powder?.id : item.resolved_default_powder_id;
  const defaultMilk = item.milk_types?.find(m => m.is_default) ?? item.milk_types?.[0];

  const getDisplayPrice = (sizeObj: MenuItem["sizes"][0]) => {
    const s = sizeObj.size;
    const base = sizeObj.base_price_vnd ?? 0;
    const pwd = powders.find(p => p.id === defaultPowderId);
    const pwdPrice = pwd?.price_per_gram ?? 0;
    const gram = resolveGram(s, item.custom_powder_grams, pwd?.size_config ?? [], defaultPowderGrams);

    if (isLatte) {
      return calcLattePrice({
        base_price_vnd: base,
        gram,
        powder_price_per_gram: pwdPrice,
        milk_ml: sizeObj.milk_ml ?? 0,
        milk_price_per_ml: defaultMilk?.price_per_ml ?? 40
      });
    } else {
      return calcFusionPrice({
        base_price_vnd: base,
        gram,
        powder_price_per_gram: pwdPrice,
        premium_latte: 0
      });
    }
  };

  return (
    <div
      onClick={onClick}
      className="group flex flex-col h-full bg-white rounded-4xl overflow-hidden border border-border shadow-sm hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer"
    >
      {/* Image / Icon Area */}
      <div className="aspect-4/3 bg-[#d9e4d4] relative overflow-hidden flex items-center justify-center">
        {item.is_seasonal && (
          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-amber-600 text-[9px] font-medium uppercase tracking-[0.2em] px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-amber-200/50">
            <span>✨ Seasonal</span>
          </div>
        )}
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
        <h3 className="font-serif font-light text-base text-foreground mb-3 truncate">
          {item.name}
        </h3>

        {/* Size prices row */}
        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-1">
            {sizes.map((s) => (
              <div key={s.size} className="flex flex-col items-center gap-0.5 flex-1">
                <span className="text-[8px] font-bold text-primary/40 uppercase tracking-wide whitespace-nowrap">
                  {SIZE_CARD_LABELS[s.size] ?? s.size}
                </span>
                <span className="text-sm font-bold text-primary">
                  {getDisplayPrice(s) / 1000}k
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
