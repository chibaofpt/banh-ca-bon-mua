"use client";

import VideoHero from '@/src/components/home/VideoHero';
import FeaturedProducts from '@/src/components/home/FeaturedProducts';
import EmojiFeed from '@/src/components/home/EmojiFeed';
import Footer from '@/src/components/common/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <VideoHero />
      <FeaturedProducts />
      <EmojiFeed />
      <Footer />
    </main>
  );
}
