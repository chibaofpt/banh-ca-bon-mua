"use client";

import React, { useEffect, useState, useMemo } from 'react';
import type { MenuItem, Addon, ContactData } from '@/src/lib/types/menu';
import { formatPrice } from '@/src/utils/formatPrice';
import { useCartStore } from '@/src/lib/store/cartStore';

const SWEETNESS_OPTIONS = ["Lạt", "Vừa", "Ngọt", "Rất ngọt", "Ngọt Điên"];
const SIZE_LABELS: Record<string, string> = {
  M: "Cá Con",
  L: "Cá Vừa",
  XL: "Cá Lớn"
};

interface ProductModalProps {
  item: MenuItem;
  addons: Addon[];
  contact: ContactData;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ item, addons, contact, onClose }) => {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<'M' | 'L' | 'XL'>('M');
  const [selectedSweetness, setSelectedSweetness] = useState("Vừa");
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [matchaGrams, setMatchaGrams] = useState(0);
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

  // Logic to calculate total price dynamically based on selection
  const totalPrice = useMemo(() => {
    let base = item.type === 'daily' ? item.sizes[selectedSize].price : item.price;

    // Standard addons price
    selectedAddons.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) base += addon.price;
    });

    // Special Addon: Matcha Grams (id: a4)
    const matchaAddon = addons.find(a => a.id === 'a4');
    if (matchaAddon && matchaAddon.pricePerGram) {
      base += matchaGrams * matchaAddon.pricePerGram;
    }

    return base;
  }, [item, selectedSize, selectedAddons, addons, matchaGrams]);

  /**
   * handleAddToCart builds a CartItem and adds it to the global store.
   */
  const handleAddToCart = () => {
    const selectedAddonNames = Array.from(selectedAddons)
      .map(id => addons.find(a => a.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    let addonsPrice = 0;
    selectedAddons.forEach(id => {
      const addon = addons.find(a => a.id === id);
      if (addon) addonsPrice += addon.price;
    });

    // Special Addon: Matcha Grams (id: a4)
    if (matchaGrams > 0) {
      selectedAddonNames.push(`Thêm bột matcha +${matchaGrams}g`);
      const matchaAddon = addons.find(a => a.id === 'a4');
      if (matchaAddon && matchaAddon.pricePerGram) {
        addonsPrice += matchaGrams * matchaAddon.pricePerGram;
      }
    }

    const basePrice = item.type === 'daily' ? item.sizes[selectedSize].price : item.price;
    const sizeLabel = item.type === 'daily' ? SIZE_LABELS[selectedSize] : 'Một size';
    const sizeML = item.type === 'daily' ? item.sizes[selectedSize].ml : 0;

    addItem({
      id: item.id,
      name: item.name,
      size: sizeLabel,
      ml: sizeML,
      sweetness: selectedSweetness,
      addons: selectedAddonNames,
      basePrice,
      addonsPrice,
      totalPrice: basePrice + addonsPrice,
    });

    handleClose();
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
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${selectedSize === size
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
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${selectedSweetness === opt
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
              {addons.map((addon) => {
                if (addon.id === 'a4') {
                  const maxGrams = addon.maxGrams || 3;
                  const pricePerGram = addon.pricePerGram || 5;

                  return (
                    <div key={addon.id} className="flex flex-col gap-3 p-3 rounded-xl border-[0.5px] border-[#e0eed8] bg-[#f7faf5]">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 mr-4">
                          <p className="text-[12px] font-bold text-[#16610C]">{addon.name}</p>
                          <p className="text-[10px] text-[#5a8a52] line-clamp-1">{addon.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3].map((grams) => (
                          <button
                            key={grams}
                            onClick={() => setMatchaGrams(grams)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${matchaGrams === grams
                                ? 'bg-[#16610C] text-white border-[#16610C]'
                                : 'border-[#d0e8c8] text-[#5a8a52] bg-[#f7faf5]'
                              }`}
                          >
                            {grams === 0 ? 'Không' : `+${grams}g`}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-[#16610C] text-right">
                        {matchaGrams === 0 ? 'Miễn phí' : `+${matchaGrams * pricePerGram} 🐟`}
                      </p>
                    </div>
                  );
                }

                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`flex justify-between items-center p-3 rounded-xl border-[0.5px] transition-all text-left ${selectedAddons.has(addon.id)
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
                );
              })}
            </div>
          </section>

          <button
            onClick={handleAddToCart}
            className="w-full bg-[#16610C] text-white rounded-xl py-[13px] text-[14px] font-bold shadow-lg shadow-[#16610C]/20 active:scale-[0.98] transition-all"
          >
            Thêm vào giỏ 🐟 → {formatPrice(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
