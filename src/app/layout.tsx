import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://akzqcreation.com"),
  title: {
    default: "AKZQ.Creation — Web Design & Digital Marketing Agency in Kannur & Thalassery, Kerala",
    template: "%s",
  },
  description:
    "AKZQ.Creation is a premier digital marketing and creative agency in Kannur, Kerala, serving Kannur, Thalassery, and North Malabar with transparent fixed pricing and honest processes.",
  icons: {
    icon: "/assets/images/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://akzqcreation.com",
    siteName: "AKZQ.Creation",
    images: [
      {
        url: "https://akzqcreation.com/assets/images/og-share.png",
        width: 1200,
        height: 630,
        alt: "AKZQ.Creation — Digital Marketing & Web Agency in Kannur & Thalassery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AKZQ.Creation — Web Design & Digital Marketing Agency",
    description: "Transparent, fixed-price creative & digital agency serving Kannur, Thalassery, and North Malabar.",
    images: ["https://akzqcreation.com/assets/images/og-share.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="font-sans antialiased text-[#15151A] bg-[#FFFFFF]">
        <Header />
        <main>{children}</main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  );
}
