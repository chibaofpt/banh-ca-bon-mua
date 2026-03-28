"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/src/lib/store/cartStore";
import { useUI } from "@/src/context/UIContext";
import { cn } from "@/src/lib/utils";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items } = useCartStore();
  const { setCartOpen } = useUI();
  const totalItems = items.length;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-100 transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md py-3" : "bg-white/95 backdrop-blur-sm py-4"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Brand - Match Image 1 colors */}
        <Link href="/" className="font-serif text-2xl md:text-3xl font-bold text-primary tracking-tight">
          Bánh Cá Bốn Mùa
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="/" className="text-sm font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <Link href="/menu" className="text-sm font-bold uppercase tracking-widest text-primary/80 hover:text-primary transition-colors">
            Thực đơn
          </Link>

          <button
            onClick={() => setCartOpen(true)}
            className="group relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary/50 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Actions - Match Image 1 */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center justify-center w-8 h-8"
          >
            <ShoppingBag className="w-6 h-6 text-primary" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1"
          >
            {isMobileMenuOpen ? <X className="w-7 h-7 text-primary" /> : <Menu className="w-7 h-7 text-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border mt-0 overflow-hidden"
          >
            <div className="py-8 flex flex-col items-center gap-6">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-primary">Trang chủ</Link>
              <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-primary">Thực đơn</Link>
              <div className="h-px w-12 bg-border" />
              <p className="text-xs text-primary/40 uppercase tracking-widest font-bold">Bánh Cá Bốn Mùa</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
