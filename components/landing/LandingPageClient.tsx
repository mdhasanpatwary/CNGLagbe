"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  MapPin, Navigation, ShieldCheck,
  Star, Check, Zap, BadgeCheck,
  Banknote, Users, Route, Phone, X, Copy
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { User } from "@/lib/types/user";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Magnetic } from "@/components/ui/Magnetic";
import { Tilt } from "@/components/ui/Tilt";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { ReviewCard } from "@/components/landing/ReviewCard";
import { FaqItem } from "@/components/landing/FaqItem";
import { AppDownloadCard } from "@/components/landing/AppDownloadCard";
import { toast } from "sonner";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaitlistSection } from "@/components/landing/WaitlistSection";
import { DriverDirectorySection } from "@/components/landing/DriverDirectorySection";

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface LandingPageClientProps {
  initialUser: User | null;
}

export default function LandingPageClient({ initialUser }: LandingPageClientProps) {
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(initialUser);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Scroll Progress
  const { scrollYProgress } = useScroll();
  const springValue = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scaleX = prefersReducedMotion ? scrollYProgress : springValue;

  const [headerTheme, setHeaderTheme] = useState<"light" | "transparent">("transparent");

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setHeaderTheme(latest > 0.05 ? "light" : "transparent");
    });
  }, [scrollYProgress]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCallModalOpen(false);
      }
    };
    if (isCallModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCallModalOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  };

  const handleBookNow = useCallback(() => {
    setIsCallModalOpen(true);
  }, []);

  const reviews = [
    { name: t("review_1_name"), location: t("review_1_loc"), text: t("review_1_text") },
    { name: t("review_2_name"), location: t("review_2_loc"), text: t("review_2_text") },
    { name: t("review_3_name"), location: t("review_3_loc"), text: t("review_3_text") },
  ];

  const faqs = [
    { qKey: "faq_q1" as const, aKey: "faq_a1" as const },
    { qKey: "faq_q2" as const, aKey: "faq_a2" as const },
    { qKey: "faq_q3" as const, aKey: "faq_a3" as const },
    { qKey: "faq_q4" as const, aKey: "faq_a4" as const },
    { qKey: "faq_q5" as const, aKey: "faq_a5" as const },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <JsonLd />
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:font-bold focus:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {t("skip_to_content")}
      </a>

      <Header
        role="landing"
        variant="fixed"
        user={user}
        onLogout={handleLogout}
        className={cn(
          "transition-all duration-500",
          headerTheme === "transparent" ? "py-4 sm:py-6" : "py-2 shadow-xl"
        )}
        theme={headerTheme}
      />

      <motion.main
        id="main-content"
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Scroll Progress Indicator */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1.5 bg-primary origin-left z-[100]"
          style={{ scaleX }}
          role="progressbar"
          aria-label={t("scroll_progress")}
          aria-valuenow={Math.round((scrollYProgress.get() || 0) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        />

        {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative w-full h-auto lg:h-[100vh] min-h-[740px] flex items-center justify-center overflow-hidden lg:overflow-hidden bg-slate-950"
        >
          {/* Cinematic Background Image with Directional Gradient */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero_bg.png"
              alt="Cinematic background showing a CNG auto-rickshaw on a road in Feni"
              fill
              sizes="100vw"
              priority
              className="object-cover object-center scale-105 transition-transform duration-[20s] ease-out brightness-[0.6] grayscale-[0.1]"
            />
            {/* Directional Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-transparent to-slate-950/80 z-10" />

            {/* Animated Glows */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-10"
            />
          </div>

          {/* Animated Route Path SVG Animation (Left Background) */}
          <div className="absolute left-0 bottom-0 w-full h-full pointer-events-none z-10 overflow-hidden opacity-20 hidden lg:block">
            <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-20 bottom-0 w-[800px] h-auto">
              <motion.path
                d="M-50,900 C150,850 200,600 400,550 C600,500 650,300 850,250 C1050,200 1100,0 1200,-50"
                stroke="url(#hero-path-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 3, ease: "easeInOut", delay: 0.5 }}
              />
              <defs>
                <linearGradient id="hero-path-gradient" x1="0" y1="900" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Moving dot along path */}
              <motion.circle
                r="6"
                fill="var(--primary)"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                  offsetPath: "path('M-50,900 C150,850 200,600 400,550 C600,500 650,300 850,250 C1050,200 1100,0 1200,-50')"
                }}
              />
            </svg>
          </div>

          <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center h-full pt-28 pb-12 lg:pt-32 lg:pb-24">
            <div className="max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">

              {/* Left Side: Content (55%) */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                {/* Eyebrow Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 mb-6"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-[10px] sm:text-xs font-black text-white/90 uppercase tracking-[0.3em] font-sans">
                    {t("hero_available_badge")}
                  </span>
                </motion.div>

                {/* Main Heading with Word Reveal */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.3] lg:leading-[1.2] mb-6 sm:mb-8 font-bn tracking-tight">
                  {t("hero_headline").split(" ").map((word, i) => (
                    <span key={i} className="inline-block overflow-hidden mr-[0.15em] last:mr-0 pb-2 px-[0.1em]">
                      <motion.span
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2 + (i * 0.1),
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className={cn(
                          "inline-block drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
                          (i >= 3) ? "text-primary" : "text-white"
                        )}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="text-lg sm:text-xl text-white/70 font-medium mb-8 sm:mb-10 font-bn max-w-xl leading-relaxed"
                >
                  {t("hero_sub")}
                </motion.p>

                {/* Primary CTA & Stats Row */}
                <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10 mb-10 sm:mb-14 w-full sm:w-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Magnetic>
                      <AppButton
                        onClick={handleBookNow}
                        className="group w-full sm:w-auto min-w-[240px] h-16 sm:h-20 px-8 rounded-[20px] bg-primary text-white shadow-[0_20px_50px_rgba(22,163,74,0.3)] hover:shadow-[0_20px_60px_rgba(22,163,74,0.5)] transition-all duration-500"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white/70 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t("hero_book_now")}</span>
                            <span className="text-xl font-black leading-none">{t("app_name")}</span>
                          </div>
                        </div>
                      </AppButton>
                    </Magnetic>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="flex flex-col items-center sm:items-start gap-1"
                  >
                    <div className="flex -space-x-3 mb-2">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 overflow-hidden bg-slate-800 shadow-lg">
                          <Image src={`/icons/driver_avatar_${i}.png`} alt="Driver" width={40} height={40} className="object-cover" />
                        </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center text-[10px] font-black text-primary shadow-lg">
                        +100
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/40 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                      </span>
                      <p className="text-xs font-black text-white/50 uppercase tracking-widest leading-none">
                        {t("trust_drivers_active")}
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Trust Badges */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4"
                >
                  {[
                    { icon: <ShieldCheck className="w-4 h-4" />, text: t("hero_badge_safe") },
                    { icon: <Banknote className="w-4 h-4" />, text: t("hero_cash_note") },
                    { icon: <Zap className="w-4 h-4" />, text: t("hero_badge_fast") }
                  ].map((badge, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 sm:px-3.5"
                    >
                      <div className="text-primary">{badge.icon}</div>
                      <span className="text-[11px] font-black text-white/90 uppercase tracking-widest font-bn">{badge.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Right Side: Call Booking Widget Card (45%) */}
              <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
                <motion.div
                  initial={{ opacity: 0, x: 60, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full lg:max-w-[420px] bg-slate-950/40 backdrop-blur-[40px] border border-white/10 rounded-[32px] p-5 sm:p-8 shadow-[0_40px_120px_rgba(0,0,0,0.6)] relative group"
                >
                  {/* Subtle edge highlight */}
                  <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                  <div className="relative z-10">
                    {/* Pulsing Phone Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary relative">
                        <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-primary/30 opacity-75"></span>
                        <Phone className="w-8 h-8 relative z-10" />
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <h2 className="text-xl sm:text-2xl font-black text-white font-bn tracking-tight mb-2">
                        {t("cng_hotline")}
                      </h2>
                      <p className="text-xs text-white/60 font-bn font-normal leading-relaxed">
                        {t("cng_hotline_sub")}
                      </p>
                    </div>

                    {/* Hotline Number Display Card */}
                    <div className="bg-white/5 border border-white/5 rounded-[20px] p-5 mb-6 text-center select-all group-hover:border-primary/20 transition-all">
                      <span className="text-white/40 text-[9px] uppercase tracking-[0.2em] font-black block mb-2">{t("footer_contact")}</span>
                      <a href="tel:01783721411" className="text-3xl sm:text-4xl font-mono font-black text-primary hover:text-green-400 transition-colors tracking-wider block">
                        01783721411
                      </a>
                    </div>

                    {/* Big Call Button & Facebook Option */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                      className="space-y-4"
                    >
                      <a href="tel:01783721411" className="block w-full">
                        <AppButton
                          className="w-full h-16 rounded-[20px] bg-primary text-white font-black text-lg shadow-2xl hover:bg-success hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3"
                          leftIcon={<Phone className="w-6 h-6" />}
                        >
                          {t("find_cng_now")}
                        </AppButton>
                      </a>

                      {/* OR Divider */}
                      <div className="flex items-center gap-3 my-2 opacity-50 justify-center">
                        <div className="h-px bg-white/20 flex-1" />
                        <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">{t("or_text")}</span>
                        <div className="h-px bg-white/20 flex-1" />
                      </div>

                      {/* Message Facebook Button */}
                      <a href="https://m.me/61588788704424" target="_blank" rel="noopener noreferrer" className="block w-full">
                        <AppButton
                          className="w-full h-16 rounded-[20px] bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3 border-0"
                          leftIcon={<FacebookIcon className="w-5 h-5" />}
                        >
                          {t("msg_facebook")}
                        </AppButton>
                      </a>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Scroll Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/20 p-1 flex justify-center">
              <motion.div
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(22,163,74,0.5)]"
              />
            </div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] font-sans ml-1">{t("explore") || "EXPLORE"}</span>
          </motion.div>
        </section>

        {/* ── 1.6. DRIVER DIRECTORY ────────────────────────────────────────── */}
        <DriverDirectorySection isLanding={true} initialUser={user} />

        {/* ── 1.5. WAITLIST ────────────────────────────────────────────────── */}
        <WaitlistSection />

        {/* ── 2. LOCAL TRUST ───────────────────────────────────────────────── */}
        <Section id="trust" variant="white" className="bg-gradient-to-b from-white via-primary/[0.02] to-slate-50/50">
          <SectionHeading title={t("trust_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full"
          >
            {[
              { icon: <Users className="w-6 h-6" />, text: t("trust_local_drivers") },
              { icon: <Route className="w-6 h-6" />, text: t("trust_familiar_roads") },
              { icon: <ShieldCheck className="w-6 h-6" />, text: t("trust_reliable") },
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="flex flex-col items-center text-center gap-5 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 premium-card-shadow-hover hover:border-primary/20 transition-all duration-200">
                <div className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/20 shrink-0 w-14 h-14 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="font-bn text-base font-semibold text-slate-800 leading-normal">{item.text}</p>
                <div className="mt-auto pt-4 flex items-center gap-2">
                  <span className="font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm tracking-wide uppercase">
                    {t("hero_badge_safe").split(" ")[0]}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────── */}
        <Section id="how-it-works" variant="mesh" className="border-y border-slate-100/50">
          <SectionHeading title={t("how_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-16 relative w-full"
          >
            {/* Desktop line indicator */}
            <div className="hidden md:block absolute top-0 left-0 w-full h-16 z-0 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 1000 64" fill="none" preserveAspectRatio="none" className="overflow-visible">
                <motion.path
                  d="M 166.6 32 Q 333.3 54 500 32 Q 666.6 10 833.3 32"
                  stroke="url(#line-gradient)"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {[
              { icon: <MapPin className="w-8 h-8" />, step: t("step_1"), title: t("how_step1"), sub: t("how_step1_sub") },
              { icon: <Banknote className="w-8 h-8" />, step: t("step_2"), title: t("how_step2"), sub: t("how_step2_sub") },
              { icon: <Navigation className="w-8 h-8" />, step: t("step_3"), title: t("how_step3"), sub: t("how_step3_sub") },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex flex-col items-center relative z-10 text-center group"
              >
                <motion.div
                  animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl shadow-primary/10 flex items-center justify-center relative mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-primary/30 transition-all duration-300 border border-slate-100"
                >
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center shadow-lg border-2 border-white z-20">
                    {item.step}
                  </div>
                  <div className="text-primary group-hover:text-white transition-colors duration-300 scale-90">
                    {item.icon}
                  </div>
                </motion.div>

                <h3 className="text-base font-bold text-slate-900 mb-2 font-bn group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-slate-500 font-bn leading-relaxed max-w-[220px] sm:max-w-[180px] font-normal">{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── 4. WHY CHOOSE US ──────────────────────────────────────────────── */}
        <Section id="why-us" variant="slate" className="bg-gradient-to-b from-slate-50 to-white/80">
          <SectionHeading title={t("why_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full"
          >
            {[
              { icon: <Banknote className="w-8 h-8" />, text: t("why_fixed_fare") },
              { icon: <Zap className="w-8 h-8" />, text: t("why_instant") },
              { icon: <Users className="w-8 h-8" />, text: t("why_drivers") },
              { icon: <Star className="w-8 h-8" />, text: t("why_simple") },
            ].map((item, i) => (
              <Tilt key={i} className="h-full">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 h-full border border-slate-100 flex flex-col items-center text-center gap-4 premium-card-shadow-hover transition-all duration-300"
                >
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-2xl text-primary shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <p className="font-bn font-bold text-base text-slate-900 leading-normal">{item.text}</p>
                </motion.div>
              </Tilt>
            ))}
          </motion.div>
        </Section>

        {/* ── 6. FEATURES ──────────────────────────────────────────────────── */}
        <Section id="features" variant="mesh">
          <SectionHeading title={t("feat_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full"
          >
            <motion.div variants={itemVariants}><FeatureCard icon={<Zap />} title={t("feat_fast_booking")} sub={t("feat_fast_booking_sub")} /></motion.div>
            <motion.div variants={itemVariants}><FeatureCard icon={<MapPin />} title={t("feat_nearby")} sub={t("feat_nearby_sub")} /></motion.div>
            <motion.div variants={itemVariants}><FeatureCard icon={<Star />} title={t("feat_simple_ui")} sub={t("feat_simple_ui_sub")} /></motion.div>
            <motion.div variants={itemVariants}><FeatureCard icon={<BadgeCheck />} title={t("feat_instant_confirm")} sub={t("feat_instant_confirm_sub")} /></motion.div>
          </motion.div>
        </Section>

        {/* ── 7. SERVICE AREA ──────────────────────────────────────────────── */}
        <Section id="service-area" variant="dark" className="border-y border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-3xl pointer-events-none" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center relative z-10 w-full"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-2.5 mb-8">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-base font-semibold text-white uppercase tracking-widest">{t("location_upazila")}</span>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-extrabold text-white mb-6 font-bn">{t("area_title")}</motion.h2>
            <motion.p variants={itemVariants} className="text-slate-300 text-base font-normal leading-relaxed font-bn mb-10 max-w-2xl mx-auto">
              {t("area_desc")}
            </motion.p>
            <motion.div variants={itemVariants} className="inline-flex items-center justify-center gap-4 bg-primary/10 border border-white/20 rounded-3xl px-8 py-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                <Check className="w-7 h-7" />
              </div>
              <span className="font-bn font-bold text-base text-white">{t("area_coverage")}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-2 opacity-60">
              {[t("tag_cng_booking"), t("tag_chhagalnaiya"), t("tag_local_transport"), t("tag_fixed_fare"), t("tag_cng")].map((tag, i) => (
                <span key={i} className="text-base text-white uppercase tracking-[0.2em]">{tag}</span>
              ))}
            </motion.div>
          </motion.div>
        </Section>

        {/* ── 8. TESTIMONIALS ──────────────────────────────────────────────── */}
        <Section id="reviews" variant="premium">
          <SectionHeading title={t("reviews_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto w-full"
          >
            {reviews.map((r, i) => (
              <motion.div key={i} variants={itemVariants}>
                <ReviewCard name={r.name} location={r.location} text={r.text} />
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── 9. DOWNLOAD APP ──────────────────────────────────────────────── */}
        <Section id="download" variant="dark" className="border-y border-white/5">
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {!prefersReducedMotion && (
              <>
                <motion.div
                  animate={{
                    opacity: [0.1, 0.2, 0.1],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(var(--primary-rgb)/0.2),transparent_60%)]"
                />
                <motion.div
                  animate={{
                    opacity: [0.05, 0.15, 0.05],
                    scale: [1.1, 1, 1.1],
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgb(var(--primary-rgb)/0.15),transparent_60%)]"
                />
              </>
            )}
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="relative z-10"
          >
            <div className="text-center mb-16 md:mb-20">
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-base font-bold text-white/80 uppercase tracking-[0.2em]">{t("coming_soon")}</span>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-extrabold text-white mb-6 font-bn tracking-tight">
                {t("download_title")}
              </motion.h2>
              <motion.p variants={itemVariants} className="text-white/60 text-base font-bn font-normal leading-relaxed max-w-2xl mx-auto">
                {t("download_sub")}
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto w-full">
              <motion.div variants={itemVariants}><AppDownloadCard title={t("download_user_app")} type="user" comingSoon /></motion.div>
              <motion.div variants={itemVariants}><AppDownloadCard title={t("download_driver_app")} type="driver" comingSoon /></motion.div>
            </div>

            <div className="mt-16 flex justify-center pointer-events-none" aria-hidden="true">
              <div className="w-64 h-1 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
          </motion.div>
        </Section>

        {/* ── 10. FAQ ───────────────────────────────────────────────────────── */}
        <Section id="faq" variant="premium" className="border-t border-slate-100">
          <SectionHeading title={t("faq_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="max-w-3xl mx-auto rounded-2xl border border-gray-100 overflow-hidden shadow-sm w-full"
          >
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={itemVariants}>
                <FaqItem question={t(faq.qKey)} answer={t(faq.aKey)} />
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── 10. FINAL CTA ────────────────────────────────────────────────── */}
        <Section id="final-cta" variant="primary" className="text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(255_255_255/0.1),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <motion.div variants={itemVariants} className="bg-white/20 w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-md border border-white/30 rotate-12">
              <Navigation className="w-8 h-8 text-white -rotate-12" />
              <span className="sr-only">{t("app_name")} {t("hero_book_now")}</span>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-extrabold font-bn mb-6 tracking-tight leading-normal">{t("final_cta_title")}</motion.h2>
            <motion.p variants={itemVariants} className="text-white text-base font-normal mb-8 sm:mb-12 font-bn max-w-xl mx-auto leading-relaxed">{t("final_cta_sub")}</motion.p>
            <motion.div variants={itemVariants} className="max-w-xs sm:max-w-sm mx-auto px-2 sm:px-0 w-full">
              <Magnetic>
                <AppButton
                  onClick={handleBookNow}
                  className="w-full h-14 sm:h-16 text-sm sm:text-base rounded-2xl bg-white text-primary font-bold shadow-2xl hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary focus:outline-none"
                  leftIcon={<MapPin className="w-5 h-5" />}
                >
                  {t("hero_book_now")}
                </AppButton>
              </Magnetic>
            </motion.div>
          </div>
        </Section>

      </motion.main>



      {/* ── CALL BOOKING MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isCallModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCallModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden z-10"
            >
              {/* Top decoration glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none" />

              {/* Close Button */}
              <AppButton
                variant="ghost"
                onClick={() => setIsCallModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary p-0 min-h-[auto]"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">{t("close_btn")}</span>
              </AppButton>

              <div className="relative z-10 text-center mt-4">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mx-auto mb-6 relative">
                  <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-primary/30 opacity-75"></span>
                  <Phone className="w-8 h-8 relative z-10" />
                </div>

                {/* Title & Desc */}
                <h3 className="text-2xl font-black text-white font-bn tracking-tight mb-3">
                  {t("booking_modal_title")}
                </h3>
                <p className="text-sm text-slate-300 font-bn leading-relaxed mb-6">
                  {t("booking_modal_desc")}
                </p>

                {/* Phone Card */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 flex flex-col items-center justify-center group/modal-number">
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black mb-1.5">{t("footer_contact")}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-mono font-black text-primary tracking-wider">
                      01783721411
                    </span>
                    <AppButton
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText("01783721411");
                        toast.success(t("update_success"));
                      }}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95 min-h-[auto]"
                      title={t("copy") || "Copy"}
                    >
                      <Copy className="w-4 h-4" />
                    </AppButton>
                  </div>
                </div>

                {/* Call & Facebook Buttons */}
                <div className="space-y-4">
                  <a href="tel:01783721411" className="block w-full">
                    <AppButton
                      className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-xl hover:bg-success hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                      leftIcon={<Phone className="w-5 h-5" />}
                    >
                      {t("find_cng_now")}
                    </AppButton>
                  </a>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3 my-2 opacity-50 justify-center">
                    <div className="h-px bg-white/20 flex-1" />
                    <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">{t("or_text")}</span>
                    <div className="h-px bg-white/20 flex-1" />
                  </div>

                  {/* Message Facebook Button */}
                  <a href="https://m.me/61588788704424" target="_blank" rel="noopener noreferrer" className="block w-full">
                    <AppButton
                      className="w-full h-16 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 border-0"
                      leftIcon={<FacebookIcon className="w-5 h-5" />}
                    >
                      {t("msg_facebook")}
                    </AppButton>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
