"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, ArrowRight, Coffee } from 'lucide-react';
import Link from 'next/link';
import { fetchMenu } from "@/src/services/menuService";
import type { MenuItem } from "@/src/lib/types/menu";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" }
  }),
};

const FeaturedProducts: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu().then((data) => {
      // Pick 4 items from daily menu to feature
      setItems(data.daily.slice(0, 4));
      setLoading(false);
    });
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-[#fdfcf7]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="flex items-end justify-between mb-12"
        >
          <div className="space-y-2">
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary">
              Sản phẩm nổi bật
            </h2>
            <div className="h-1 w-12 bg-accent rounded-full" />
          </div>
          <Link
            href="/menu"
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="group flex flex-col h-full bg-white rounded-4xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-500"
            >
              {/* Image Area */}
              <div className="aspect-square bg-[#d9e4d4] relative overflow-hidden flex items-center justify-center p-12">
                <Coffee className="w-full h-full text-[#b8c9b4] group-hover:scale-110 transition-transform duration-700" />
                
                {/* Hover Quick Add Overlay */}
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                   <Link href="/menu" className="bg-white text-primary px-6 py-2.5 rounded-full font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      Chi tiết
                   </Link>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-serif font-bold text-lg md:text-xl text-foreground mb-3 truncate">
                  {item.name}
                </h3>
                
                <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                   {item.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-secondary/30 text-primary border border-primary/10">
                        {tag}
                      </span>
                   ))}
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-primary font-bold text-base flex items-center gap-1.5">
                    <span className="text-lg">🐟</span> {item.sizes?.M?.price ?? item.price ?? 0} cá
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
