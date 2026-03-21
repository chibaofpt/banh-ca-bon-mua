"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- Interfaces ---

interface ContactData {
  zalo: string;
  instagram: string;
  threads: string;
}

interface SizeDetail {
  ml: number;
  price: number;
}

interface DailyItem {
  id: string;
  name: string;
  description: string;
  image: string;
  likes: number;
  sizes: {
    M: SizeDetail;
    L: SizeDetail;
    XL: SizeDetail;
  };
  type: 'daily';
  tags: string[];
}

interface SeasonalItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  likes: number;
  type: 'seasonal';
  tags: string[];
}

type MenuItem = DailyItem | SeasonalItem;

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

interface MenuData {
  contact: ContactData;
  daily: DailyItem[];
  seasonal: SeasonalItem[];
  addons: Addon[];
}

// --- Constants ---

const SWEETNESS_OPTIONS = ["Lạt", "Vừa", "Ngọt", "Rất ngọt", "Bá đạo"];
const SIZE_LABELS: Record<string, string> = {
  M: "Cá Con",
  L: "Cá Vừa",
  XL: "Cá Lớn"
};

// --- Helper Functions ---

const extractTags = (description: string) => {
  return description.split(',').slice(0, 2).map(s => s.trim());
};

const formatPrice = (price: number) => `🐟 ${price} cá`;

// --- Components ---

const TabNav = ({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: string, 
  setActiveTab: (tab: 'daily' | 'seasonal' | 'taiyaki') => void 
}) => {
  const tabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'seasonal', label: 'Theo Mùa' },
    { id: 'taiyaki', label: 'Bánh Cá' }
  ];

  return (
    <div className="flex w-full border-b-[1px] border-[#e0eed8] mb-8 bg-white sticky top-[72px] z-40">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
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

const MenuCard = ({ 
  item, 
  onClick, 
  index 
}: { 
  item: MenuItem, 
  onClick: () => void,
  index: number
}) => {
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

const ProductModal = ({ 
  item, 
  addons,
  contact,
  onClose 
}: { 
  item: MenuItem, 
  addons: Addon[],
  contact: ContactData,
  onClose: () => void 
}) => {
  const [selectedSize, setSelectedSize] = useState<'M' | 'L' | 'XL'>('M');
  const [selectedSweetness, setSelectedSweetness] = useState("Vừa");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const toggleAddon = (id: string) => {
    const next = new Set(selectedAddons);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAddons(next);
  };

  const totalPrice = useMemo(() => {
    let base = item.type === 'daily' ? item.sizes[selectedSize].price : item.price;
    selectedAddons.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) base += addon.price;
    });
    return base;
  }, [item, selectedSize, selectedAddons, addons]);

  const handleOrder = () => {
    const selectedAddonNames = Array.from(selectedAddons)
      .map(id => addons.find(a => a.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    
    const sizeStr = item.type === 'daily' ? `${SIZE_LABELS[selectedSize]} (${item.sizes[selectedSize].ml}ml)` : '';
    const sweetnessStr = `Ngọt: ${selectedSweetness}`;
    const addonsStr = selectedAddonNames ? `Topping: ${selectedAddonNames}` : '';
    
    const message = `Chào Bánh Cá Bốn Mùa ạ! Mình muốn đặt:
- ${item.name}
${sizeStr ? `- ${sizeStr}` : ''}
- ${sweetnessStr}
${addonsStr ? `- ${addonsStr}` : ''}
Tổng: ${formatPrice(totalPrice)}
---
Cảm ơn ạ!`;

    const zaloUrl = `https://zalo.me/${contact.zalo}?text=${encodeURIComponent(message)}`;
    window.open(zaloUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div 
        className={`relative w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto z-[101] transform transition-transform duration-300 shadow-2xl ${isClosing ? 'translate-y-full' : 'translate-y-0'}`}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center z-[102] transition-colors"
        >
          ✕
        </button>

        <img src={item.image} alt={item.name} className="h-44 w-full object-cover rounded-t-2xl" />
        
        <div className="p-[16px_18px_32px] flex flex-col gap-6">
          <section>
            <h2 className="text-[17px] font-bold text-[#16610C] mb-1">{item.name}</h2>
            <p className="text-[12px] text-[#666] leading-relaxed">{item.description}</p>
          </section>

          {/* Size Selector (Daily only) */}
          {item.type === 'daily' && (
            <section>
              <h3 className="text-[10px] uppercase text-[#5a8a52] font-semibold tracking-wider mb-2">Chọn size</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['M', 'L', 'XL'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                      selectedSize === size 
                        ? 'border-[#16610C] bg-[#eaf5e0]' 
                        : 'border-[#d0e8c8] bg-[#f7faf5]'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-[#16610C]">{SIZE_LABELS[size]}</span>
                    <span className="text-[9px] text-[#5a8a52]">{item.sizes[size].ml}ml</span>
                    <span className="text-[10px] font-bold text-[#16610C] mt-1">{formatPrice(item.sizes[size].price)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Sweetness */}
          <section>
            <h3 className="text-[10px] uppercase text-[#5a8a52] font-semibold tracking-wider mb-2">Độ ngọt</h3>
            <div className="flex flex-wrap gap-2">
              {SWEETNESS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedSweetness(opt)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    selectedSweetness === opt
                      ? 'bg-[#16610C] text-white'
                      : 'border border-[#d0e8c8] text-[#5a8a52] bg-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Addons */}
          <section>
            <h3 className="text-[10px] uppercase text-[#5a8a52] font-semibold tracking-wider mb-2">Thêm vào bụng cá 🐟</h3>
            <div className="flex flex-col gap-2">
              {addons.map((addon) => (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`flex justify-between items-center p-3 rounded-xl border-[0.5px] transition-all text-left ${
                    selectedAddons.has(addon.id)
                      ? 'border-[#16610C] bg-[#eaf5e4]'
                      : 'border-[#e0eed8] bg-[#f7faf5]'
                  }`}
                >
                  <div className="flex-1 mr-4">
                    <p className="text-[12px] font-bold text-[#16610C]">{addon.name}</p>
                    <p className="text-[10px] text-[#5a8a52] line-clamp-1">{addon.description}</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#16610C]">+{addon.price} 🐟</span>
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={handleOrder}
            className="w-full bg-[#16610C] text-white rounded-xl py-3 text-[14px] font-bold shadow-lg shadow-[#16610C]/20 active:scale-[0.98] transition-all"
          >
            Đặt qua Zalo → {formatPrice(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function MenuPage() {
  const router = useRouter();
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'seasonal' | 'taiyaki'>('daily');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch('/data/menu.json');
        const raw = await response.json();
        
        const transformed: MenuData = {
          contact: raw.contact,
          daily: raw.daily.map((item: any) => ({
            ...item,
            type: 'daily',
            tags: extractTags(item.description)
          })),
          seasonal: raw.seasonal.map((item: any) => ({
            ...item,
            type: 'seasonal',
            tags: extractTags(item.description)
          })),
          addons: raw.addons
        };
        
        setData(transformed);
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

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
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

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

      {/* Font & Animation Styles */}
      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
