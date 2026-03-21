"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const menuItems = [
  {
    name: "Matcha Latte Đá",
    price: "35k",
    description: "Matcha ceremonial grade, sữa tươi, đá viên",
  },
  {
    name: "Matcha Sữa Nóng",
    price: "30k",
    description: "Ấm từng ngụm, matcha thuần vị Nhật",
  },
  {
    name: "Matcha Thuần",
    price: "25k",
    description: "Nguyên chất 100%, không thêm gì",
  },
  {
    name: "Matcha Theo Mùa",
    price: "40k",
    description: "Đặc biệt theo từng mùa, hỏi staff để biết thêm",
  },
];

export default function MenuPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(menuItems.length).fill(false));

  useEffect(() => {
    setMounted(true);
    
    // Staggered animation
    menuItems.forEach((_, i) => {
      setTimeout(() => {
        setVisibleItems(prev => {
          const newState = [...prev];
          newState[i] = true;
          return newState;
        });
      }, 100 * (i + 1));
    });
  }, []);

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a] font-sans pb-20 px-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-8 left-6 md:left-12 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary-green transition-colors z-50 group"
      >
        <span className="transition-transform group-hover:-translate-x-1">←</span>
        <span>Trang chủ</span>
      </button>

      <div className="max-w-4xl mx-auto pt-24 flex flex-col items-center">
        {/* Header */}
        <header className={`text-center mb-16 transition-all duration-1000 transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="font-serif text-primary-green text-5xl md:text-6xl font-medium mb-4">
            Thực Đơn
          </h1>
          <p className="text-gray-400 uppercase tracking-[0.2em] text-[10px] md:text-xs">
            Chọn đúng mùa, đúng vị, đúng giá
          </p>
        </header>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {menuItems.map((item, i) => (
            <div
              key={i}
              className={`bg-white border-[0.5px] border-[#C8DEC4] rounded-2xl p-6 flex flex-col justify-between transition-all duration-700 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-[#C8DEC4]/20 ${visibleItems[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="font-serif text-[#16610C] text-xl md:text-2xl font-medium leading-tight">
                  {item.name}
                </h2>
                <span className="bg-[#C8DEC4] text-[#16610C] px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">
                  {item.price}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-light leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
