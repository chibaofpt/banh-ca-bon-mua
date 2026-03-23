import React from 'react';
import type { MenuItem } from '@/src/lib/types/menu';
import { formatPrice } from '@/src/utils/formatPrice';

interface MenuCardProps {
  item: MenuItem;
  onClick: () => void;
  index: number;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onClick, index }) => {
  const price = item.type === 'daily' ? item.sizes.M.price : item.price;

  return (
    <div
      onClick={onClick}
      className="bg-white flex flex-col cursor-pointer transform transition-all duration-700 animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative w-full aspect-4/3 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-[8px_10px_10px] flex flex-col gap-1.5 h-full">
        <h3 className="uppercase font-semibold text-[11px] text-[#16610C] tracking-[0.04em] leading-tight line-clamp-1">
          {item.name}
        </h3>
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-[#eaf5e4] text-[#3d7a26] text-[9px] rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-[12px] text-[#16610C] font-bold mt-auto">
          {formatPrice(price)}
        </p>
      </div>
    </div>
  );
};

export default MenuCard;
