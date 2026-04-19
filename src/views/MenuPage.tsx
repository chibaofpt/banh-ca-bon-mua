"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import type { MenuData, MenuItem } from '@/src/lib/types/menu';
import { fetchMenu } from '@/src/services/menuService';
import TabBar from '@/src/components/menu/TabBar';
import type { TabId } from '@/src/components/menu/TabBar';
import MenuCard from '@/src/components/menu/MenuCard';
import ProductModal from '@/src/components/menu/ProductModal';
import CartButton from '@/src/components/menu/CartButton';
import CartDrawer from '@/src/components/menu/CartDrawer';
import { Skeleton } from '@/src/components/ui/skeleton';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" }
  }),
};

export default function MenuPage() {
  const router = useRouter();
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('daily');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchMenu()
      .then(setData)
      .catch((error) => console.error("Error fetching menu:", error))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    
    let items: MenuItem[] = [];
    if (activeTab === 'daily') items = data.daily;
    else if (activeTab === 'seasonal') items = data.seasonal;
    else items = []; // Taiyaki placeholder
    
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [data, activeTab, searchQuery]);

  return (
    <main className="min-h-screen bg-[#fdfcf7] text-foreground font-sans pt-32 pb-32 px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Header - Match Image 3 */}
        <div className="text-center mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-primary/60 hover:text-primary font-bold uppercase tracking-widest transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Trang chủ
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">Thực Đơn</h1>
          <p className="text-primary/60 text-sm italic">Chọn đúng mùa, đúng vị, đúng giá</p>
        </div>

        {/* Search Bar - Match Image 3 glass-card */}
        <div className="relative mb-8 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30 group-focus-within:text-primary/60 transition-colors" />
          <input 
            type="text"
            placeholder="Hôm nay bạn muốn gì? (vd: lạnh và ngọt)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-4xl bg-white border border-border shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm placeholder:text-primary/30"
          />
        </div>

        {/* Tabs - Now using restored TabBar */}
        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Menu Grid - Match Image 2/3 */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <div key="loading" className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-4/3 rounded-4xl bg-secondary/20 animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <motion.div 
                 key="empty"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="py-24 text-center text-primary/40 space-y-4"
              >
                 <span className="text-6xl">🍲</span>
                 <p className="font-bold text-lg italic">Không thấy món này...</p>
                 <p className="text-sm">Thử tìm tên khác nhé</p>
              </motion.div>
            ) : (
              <motion.div 
                key={activeTab + searchQuery}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-4 md:gap-6"
              >
                {filteredItems.map((item, idx) => (
                  <motion.div key={item.id} variants={fadeUp} custom={idx}>
                    <MenuCard
                      item={item}
                      index={idx}
                      onClick={() => setSelectedItem(item)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && data && (
          <ProductModal
            key="product-modal-root"
            item={selectedItem}
            addons={data.addons}
            contact={data.contact}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      <CartButton />
      <CartDrawer />
    </main>
  );
}
