"use client";

import React, { useEffect, useRef, useState } from 'react';

const badges = [
  "Giá chỉ từ 25k",
  "Đa dạng loại matcha",
  "Luôn có matcha theo mùa"
];

const VideoHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Badge cycling removed - now scroll-linked

  // Scroll logic
  useEffect(() => {
    let rafId: number;
    let latestProgress = 0;

    const handleScroll = () => {
      if (!containerRef.current || !videoRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = -rect.top;
      const totalScroll = containerRef.current.offsetHeight - window.innerHeight;
      latestProgress = Math.max(0, Math.min(1, scrollY / totalScroll));
      setScrollProgress(latestProgress);
    };

    const tick = () => {
      if (videoRef.current?.duration) {
        const targetTime = latestProgress * videoRef.current.duration;
        // Optimization: only update if the difference is significant
        if (Math.abs(videoRef.current.currentTime - targetTime) > 0.001) {
          videoRef.current.currentTime = targetTime;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(tick); // 1 loop duy nhất, chạy liên tục

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);  // ✅ bỏ isLoaded dependency

  const handleLoadedMetadata = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[500vh] w-full bg-black overflow-clip"
    >
      {/* Sticky Video Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Subtle Overlays */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

        <video
          ref={videoRef}
          src="/demo.mp4"
          muted
          autoPlay
          loop
          playsInline
          className="h-full w-full object-cover opacity-80"
          onLoadedMetadata={handleLoadedMetadata}
          preload="auto"
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 py-24 px-8 md:px-20 flex flex-col items-center justify-between pointer-events-none">
          {/* Top: Centered Brand Title */}
          <div className="flex flex-col items-center animate-fade-in pointer-events-auto">
            <h1 className="font-serif text-white text-5xl md:text-8xl font-light tracking-[0.15em] md:tracking-[0.25em] text-center drop-shadow-lg mb-8 leading-tight">
              Bánh Cá Bốn Mùa
            </h1>
          </div>

          {/* Left: Badges Overlay */}
          <div className="absolute left-8 md:left-20 top-1/3 -translate-y-1/2 flex flex-col gap-4 items-start pointer-events-auto" suppressHydrationWarning>
            {badges.map((text, i) => {
              const threshold = 0.03 + i * 0.03;
              const isVisible = scrollProgress > threshold;
              return (
                <span
                  key={i}
                  className={`transition-all duration-1000 ease-out px-4 py-2 rounded-full text-[10px] md:text-xs font-medium tracking-widest uppercase
                    bg-primary-green/20 backdrop-blur-lg border border-sage-accent/30 text-sage-accent whitespace-nowrap shadow-xl
                    ${isVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-12 scale-95 pointer-events-none'}`}
                >
                  {text}
                </span>
              );
            })}
          </div>

          {/* Bottom: Scroll Indicator */}
          <div
            className={`flex flex-col items-center transition-all duration-500 pb-8 pointer-events-auto ${scrollProgress > 0.05 ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
            suppressHydrationWarning
          >
            <span className="text-sage-accent/80 text-[10px] uppercase tracking-[0.4em] mb-4 font-light">
              Scroll to explore
            </span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent animate-scroll-bounce bg-white/40" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default VideoHero;
