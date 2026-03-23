"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuData, MenuItem } from '@/src/lib/types/menu';
import { fetchMenu } from '@/src/services/menuService';
import TabBar from '@/src/components/menu/TabBar';
import type { TabId } from '@/src/components/menu/TabBar';
import MenuCard from '@/src/components/menu/MenuCard';
import ProductModal from '@/src/components/menu/ProductModal';
import CartButton from '@/src/components/menu/CartButton';
import CartDrawer from '@/src/components/menu/CartDrawer';

export default function MenuPage() {
  const router = useRouter();
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('daily');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  /**
   * Initial data fetch:
   * - Calls fetchMenu service to get transformed data.
   * - Manages loading state during the async request.
   */
  useEffect(() => {
    fetchMenu()
      .then(setData)
      .catch((error) => console.error("Error fetching menu:", error))
      .finally(() => setLoading(false));
  }, []);

  // currentItems filters the menu based on the active tab selection
  const currentItems = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'daily') return data.daily;
    if (activeTab === 'seasonal') return data.seasonal;
    return [];
  }, [data, activeTab]);

  return (
    <main className="min-h-screen bg-[#f7faf5] text-[#1a1a1a] font-sans pb-20">
      {/* Fixed Sticky Header Area */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 pt-8 pb-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute left-6 text-sm font-medium text-[#888] hover:text-[#16610C] transition-colors"
        >
          ← Trang chủ
        </button>

        {/* Header Content */}
        <div className="text-center">
          <h1 className="font-serif text-[#16610C] text-[32px] md:text-[42px] font-medium leading-tight">
            Thực Đơn
          </h1>
          <p className="text-[#5a8a52] text-[10px] md:text-xs uppercase tracking-[0.1em] mt-1 font-medium">
            Chọn đúng mùa, đúng vị, đúng giá
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#16610C]/20 border-t-[#16610C] rounded-full animate-spin mb-4" />
            <p className="text-[#5a8a52] text-xs">Đang tải hương vị...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'taiyaki' ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <span className="text-5xl mb-4">🐟</span>
                <p className="text-[14px] text-[#5a8a52] italic font-medium">Sắp có rồi...</p>
                <p className="text-[12px] text-[#888] mt-1">Bánh cá đang được nướng</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-px bg-[#e0eed8] border-[0.5px] border-[#e0eed8] overflow-hidden">
                {currentItems.map((item, idx) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedItem && data && (
        <ProductModal
          item={selectedItem}
          addons={data.addons}
          contact={data.contact}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {data && (
        <>
          <CartButton onClick={() => setIsCartOpen(true)} />
          <CartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
            zaloNumber={data.contact.zalo} 
          />
        </>
      )}
    </main>
  );
}
