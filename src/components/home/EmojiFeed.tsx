"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

// Manual Instagram SVG to ensure stability across any environment
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" }
  }),
};

// FIX: Updated image paths to include underscores as found in the public directory
const posts = [
  {
    id: 1,
    image: "/image_1.jpg",
    link: "https://www.instagram.com/banhcabonmua"
  },
  {
    id: 2,
    image: "/image_2.jpg",
    link: "https://www.instagram.com/banhcabonmua"
  },
  {
    id: 3,
    image: "/image_3.jpg",
    link: "https://www.instagram.com/banhcabonmua"
  },
  {
    id: 4,
    image: "/image_2.jpg",
    link: "https://www.instagram.com/banhcabonmua"
  },
  {
    id: 5,
    image: "/image_3.jpg",
    link: "https://www.instagram.com/banhcabonmua"
  },
  {
    id: 6,
    image: "/image_1.jpg",
    link: "https://www.instagram.com/banhcabonmua"
  },
];

const EmojiFeed: React.FC = () => {
  return (
    <section className="py-24 px-6 bg-[#fdfcf7] border-t border-border/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary mb-4">
            #BánhCáBốnMùa
          </h2>
          <p className="text-primary/60 text-xs md:text-sm uppercase tracking-[0.3em] font-medium">
            Theo dõi chúng tôi trên Instagram
          </p>
        </motion.div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {posts.map((post, i) => (
            <motion.a
              key={`${post.id}-${i}`}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="relative aspect-square rounded-4xl bg-[#d9e4d4] border border-primary/10 flex items-center justify-center overflow-hidden cursor-pointer group"
            >
              <Image
                src={post.image}
                alt="#BánhCáBốnMùa"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 16vw"
              />

              {/* Instagram Overlay */}
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <InstagramIcon className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EmojiFeed;
