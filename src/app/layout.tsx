import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

const title = "Bánh Cá Bốn Mùa – Matcha Ngon Thủ Dầu Một";
const description = "Bánh cá và matcha ngon tại Thủ Dầu Một. Matcha ceremonial grade, đa dạng theo mùa, giá chỉ từ 25k. Thưởng thức vị matcha chuẩn Nhật giữa lòng Bình Dương.";

export const metadata: Metadata = {
  title,
  description,
  keywords: "matcha ngon, matcha Thủ Dầu Một, matcha ceremonial grade, matcha Bình Dương, bánh cá matcha, đồ uống matcha, trà matcha tươi, matcha theo mùa, matcha giá rẻ, quán matcha Bình Dương",
  openGraph: {
    title,
    description,
    type: "website",
    locale: "vi_VN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white text-[#1a1a1a] font-sans overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
