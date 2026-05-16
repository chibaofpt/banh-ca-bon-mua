"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Leaf, Sun, Coffee, ShoppingBag, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const highlights = [
  { icon: Leaf, title: "Ceremonial Grade", desc: "Matcha chất lượng, nhập thẳng từ Nhật" },
  { icon: Sun, title: "Theo mùa", desc: "Menu cập nhật liên tục" },
  { icon: Coffee, title: "Giá từ 30k", desc: "Chất lượng không cần đắt" },
];

const VideoHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Video scrub: 0 to 1
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      if (videoRef.current && videoRef.current.duration) {
        const progress = scrollYProgress.get();
        const targetTime = Math.min(progress * videoRef.current.duration, videoRef.current.duration - 0.1);
        videoRef.current.currentTime = targetTime;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scrollYProgress]);

  /** 
   * NEW SCROLL STORY:
   * 0.0 - 0.15: Title & Footer fade out (and stay out)
   * 0.20 - 0.35: Highlights fade in (and stay)
   * 0.45 - 0.60: CTA fades in (and stay)
   */

  // LAYER 1: Hero Title (Fades out, stay out)
  const metaOpacity = useTransform(scrollYProgress, [0, 0.15, 1], [1, 0, 0]);
  const metaY = useTransform(scrollYProgress, [0, 0.15, 1], [0, -30, -30]);

  // LAYER 2: Highlights (Fades in, stays)
  // Slightly lower position: we use top-indexed positioning
  const highlightsOpacity = useTransform(scrollYProgress, [0.15, 0.2, 0.35], [0, 0, 1]);
  const highlightsY = useTransform(scrollYProgress, [0.2, 0.35], [30, 0]);

  // LAYER 3: CTA Action Card (Fades in later, stays)
  const ctaOpacity = useTransform(scrollYProgress, [0.4, 0.45, 0.6], [0, 0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.45, 0.6], [30, 0]);

  return (
    <div ref={containerRef} className="relative h-[500vh] w-full bg-black overflow-clip">
      {/* Sticky Background & Video */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="absolute inset-0 z-10 bg-linear-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        <video
          ref={videoRef}
          src="/demo.mp4"
          muted
          playsInline
          className="h-full w-full object-cover opacity-80"
          preload="auto"
        />

        {/* Content Layers */}
        <div className="absolute inset-0 z-20 flex flex-col items-center px-6">

          {/* L1: Hero Title & Bottom Indicator */}
          <motion.div
            style={{ opacity: metaOpacity, y: metaY }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="font-serif text-5xl md:text-8xl font-bold text-white leading-tight drop-shadow-2xl">
                Bánh Cá<br />Bốn Mùa
              </h1>
              <p className="text-white/60 text-xs md:text-sm tracking-[0.4em] uppercase font-light">
                bánh cá và matcha ngon
              </p>
            </div>

            {/* Scroll Indicator share Title range */}
            <div className="absolute bottom-10 flex flex-col items-center gap-3">
              <span className="text-white/40 text-[10px] md:text-[11px] uppercase tracking-[0.5em] font-light">
                Kéo xuống để xem tiệm em
              </span>
              <div className="w-px h-12 bg-linear-to-b from-white to-transparent opacity-20" />
            </div>
          </motion.div>

          {/* Combined Panel Container (Highlights & CTA) */}
          {/* Moving it slightly higher for better balance */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[25%] w-full max-w-lg px-6 flex flex-col gap-6">

            {/* L2: Highlights (Appears First, lower in viewport) */}
            <motion.div
              style={{ opacity: highlightsOpacity, y: highlightsY }}
              className="w-full pointer-events-auto"
            >
              <h2 className="font-serif text-2xl md:text-4xl font-bold text-left text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                Tiệm em cóoo
              </h2>
              <div className="space-y-3">
                {highlights.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-6 p-5 rounded-4xl bg-primary/25 backdrop-blur-3xl border-l-[6px] border-l-primary border border-white/5 shadow-2xl hover:bg-primary/35 transition-all group pointer-events-auto"
                  >
                    <div className="w-14 h-14 rounded-full bg-secondary/30 flex items-center justify-center shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-white text-lg md:text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">{item.title}</h3>
                      <p className="text-xs md:text-sm text-white/70 mt-0.5 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* L3: CTA Action Card (Appears under Highlights later) */}
            <motion.div
              style={{ opacity: ctaOpacity, y: ctaY }}
              className="w-full flex justify-center pointer-events-auto"
            >
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0px 20px 60px rgba(0,0,0,0.5)" }}
                whileTap={{ scale: 0.95, y: 2 }}
                className="w-full max-w-sm rounded-4xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all group"
              >
                <button
                  onClick={() => router.push('/menu')}
                  className="w-full h-full flex flex-col items-center gap-6 p-7 bg-primary/40 backdrop-blur-3xl border border-white/10"
                >
                  <div className="w-18 h-18 rounded-full bg-secondary/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <ShoppingBag className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                      Đặt ngay <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                    </p>
                  </div>
                </button>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoHero;
