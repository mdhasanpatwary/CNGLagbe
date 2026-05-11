"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin, Navigation, ShieldCheck,
  Star, Check, Zap, BadgeCheck,
  Banknote, Users, Route
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { User } from "@/lib/types/user";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/ui/Tilt";
import { TrustBadge } from "@/components/landing/TrustBadge";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { ReviewCard } from "@/components/landing/ReviewCard";
import { RouteCard } from "@/components/landing/RouteCard";
import { FaqItem } from "@/components/landing/FaqItem";
import { AppDownloadCard } from "@/components/landing/AppDownloadCard";

/**
 * Landing Page Component
 * 
 * Main public-facing page for CNGLagbe that introduces the service to new users.
 * Features include:
 * - Hero section with primary CTA and trust badges
 * - Local trust indicators and driver information
 * - Step-by-step booking process explanation
 * - Feature highlights and benefits
 * - Popular routes for quick booking
 * - Service area coverage information
 * - User testimonials and reviews
 * - FAQ section with accordion
 * - App download promotion
 * - Responsive design with mobile-first approach
 * - Scroll-triggered animations and parallax effects
 * - Accessibility compliant (WCAG AA)
 * 
 * @returns Landing page with all sections and sticky mobile CTA
 */
export default function LandingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Scroll Progress
  const { scrollYProgress } = useScroll();
  const springValue = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const scaleX = prefersReducedMotion ? scrollYProgress : springValue;

  const [headerTheme, setHeaderTheme] = useState<"light" | "primary">("light");

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest > 0.05) {
        setHeaderTheme("light");
      } else {
        // Keep it light or switch to primary if preferred, but not transparent
        setHeaderTheme("light");
      }
    });
  }, [scrollYProgress]);

  // Parallax for Hero
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

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
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  };

  const handleBookNow = useCallback(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role === "DRIVER") {
      router.push("/dashboard");
    } else {
      router.push("/user");
    }
  }, [user, router]);

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
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-white focus:px-6 focus:py-3 focus:rounded-lg focus:font-bold focus:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {t("skip_to_content")}
      </a>

      <Header
        role="landing"
        user={user}
        onLogout={handleLogout}
        className={cn("transition-all duration-500")}
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
        {/* Note: hero-mesh-gradient is a special variant for the hero section per design spec */}
        <Section
          id="hero"
          variant="dark"
          className="hero-mesh-gradient pt-20 sm:pt-24 pb-20 sm:pb-28 md:pt-40 md:pb-52 min-h-[calc(100vh-80px)] sm:min-h-[85vh] md:min-h-0 flex items-center"
          noPadding
        >
          {/* Parallax decorative elements */}
          {!prefersReducedMotion && (
            <>
              <motion.div
                style={{ y: y1 }}
                className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-1/2 pointer-events-none z-0"
              />
              <motion.div
                style={{ y: y2, rotate }}
                className="absolute -bottom-24 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-20 z-0"
              />
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8">
            {/* Left Column: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left w-full">
              {/* Driver count badge - Minimalist version */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2.5 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-[0.25em]">{t("trust_drivers_active")}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 font-bn tracking-[-0.02em] w-full"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
                  {t("hero_headline")}
                </span>
              </motion.h1>

              <Reveal delay={0.5}>
                <p className="text-white/50 text-sm sm:text-base md:text-lg font-normal mb-10 font-bn max-w-lg leading-relaxed w-full">
                  {t("hero_sub")}
                </p>
              </Reveal>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <Magnetic>
                  <AppButton
                    onClick={handleBookNow}
                    className="w-full h-14 sm:h-16 px-8 py-4 text-sm sm:text-base rounded-2xl bg-primary text-white font-bold shadow-[0_20px_50px_rgba(22,163,74,0.3)] hover:shadow-[0_20px_50px_rgba(22,163,74,0.5)] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                    leftIcon={<MapPin className="w-5 h-5 sm:w-6 sm:h-6" />}
                  >
                    {t("hero_book_now")}
                  </AppButton>
                </Magnetic>
              </motion.div>

              {/* Trust indicators - Simplified */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center lg:justify-start gap-4 mt-12 w-full opacity-60"
              >
                <motion.div variants={itemVariants} className="flex items-center gap-2">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t("hero_badge_drivers")}</span>
                </motion.div>
                <div className="w-px h-3 bg-white/10" />
                <motion.div variants={itemVariants} className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t("hero_badge_safe")}</span>
                </motion.div>
                <div className="w-px h-3 bg-white/10" />
                <motion.div variants={itemVariants} className="flex items-center gap-2">
                  <Banknote className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{t("hero_cash_note")}</span>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Column: Premium Image with Effects */}
            <div className="relative hidden lg:flex justify-center items-center">
              {/* Glow background effect */}
              <motion.div
                animate={prefersReducedMotion ? {} : {
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-[120%] h-[120%] bg-primary/20 rounded-full blur-3xl z-0"
              />

              {/* Image with floating animation */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="relative z-10"
              >
                <motion.div
                  animate={prefersReducedMotion ? {} : {
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative group/cng">
                    {/* Minimalist Route Path Animation */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full h-24 z-0 pointer-events-none overflow-visible">
                      <svg width="100%" height="100%" viewBox="0 0 400 100" fill="none" className="overflow-visible">
                        <motion.path
                          d="M -50 80 Q 100 80 200 50 T 450 20"
                          stroke="url(#route-gradient)"
                          strokeWidth="1.5"
                          strokeDasharray="4 8"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 0.3 }}
                          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                        />
                        <defs>
                          <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Background Glow - More subtle */}
                    <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full scale-150 opacity-30 pointer-events-none" />

                    <div className="relative overflow-hidden rounded-3xl">
                      <Image
                        src="/cng_premium.png"
                        alt="Green CNG auto rickshaw with safety badges and fixed fare guarantee - CNGLagbe's verified vehicle for on-time booking service"
                        width={800}
                        height={600}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 800px"
                        className="object-contain drop-shadow-2xl select-none pointer-events-none relative z-10 transition-transform duration-700 group-hover/cng:scale-[1.02]"
                        priority
                        style={{
                          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                        }}
                      />

                      {/* Light Sweep Animation */}
                      {!prefersReducedMotion && (
                        <motion.div
                          initial={{ x: "-100%" }}
                          animate={{ x: "200%" }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 4,
                            ease: "easeInOut"
                          }}
                          className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                        />
                      )}
                    </div>

                    {/* Floating Trust Indicators around the vehicle */}
                    <motion.div
                      animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-4 -right-4 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-xl flex items-center gap-2 group-hover/cng:scale-110 transition-transform duration-300"
                    >
                      <div className="bg-primary/20 p-1.5 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap">{t("hero_badge_safe")}</span>
                    </motion.div>

                    <motion.div
                      animate={prefersReducedMotion ? {} : { y: [0, 10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute bottom-12 -left-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-xl flex items-center gap-2 group-hover/cng:scale-110 transition-transform duration-300"
                    >
                      <div className="bg-primary/20 p-1.5 rounded-lg">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-wider whitespace-nowrap">{t("hero_badge_fast")}</span>
                    </motion.div>

                      {/* Price Lock Indicator - Minimalist */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                        className="absolute -bottom-2 right-4 z-20 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3"
                      >
                        <div className="bg-primary/20 p-2 rounded-xl">
                          <Banknote className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t("fixed_fare")}</span>
                          <span className="text-sm font-bold text-white uppercase tracking-tight">{t("hero_no_surprise")}</span>
                        </div>
                      </motion.div>
                  </div>
                </motion.div>

                {/* Refined shadow beneath the image */}
                <motion.div
                  animate={prefersReducedMotion ? {} : {
                    scaleX: [1, 1.1, 1],
                    opacity: [0.3, 0.4, 0.3],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-primary/20 blur-3xl rounded-[100%] z-0"
                />
              </motion.div>
            </div>
          </div>
        </Section>

        {/* ── 2. LOCAL TRUST ───────────────────────────────────────────────── */}
        {/* Note: Gradient overlay is intentional per design spec for subtle visual enhancement */}
        <Section id="trust" variant="white" className="bg-gradient-to-b from-white via-primary/[0.02] to-slate-50/50">
          <SectionHeading title={t("trust_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full"
          >
            {[
              { icon: <Users className="w-6 h-6" />, text: t("trust_local_drivers") },
              { icon: <Route className="w-6 h-6" />, text: t("trust_familiar_roads") },
              { icon: <ShieldCheck className="w-6 h-6" />, text: t("trust_reliable") },
            ].map((item, i) => (
              <motion.div key={i} variants={itemVariants} className="flex flex-col items-center text-center gap-5 bg-white rounded-3xl p-8 border border-gray-100 premium-card-shadow-hover hover:border-primary/20 transition-all duration-200">
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
            className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16 relative w-full"
          >
            {/* Desktop line indicator - Animated SVG Path aligned to centers */}
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
                {/* Step Card Visual - Premium Glass style */}
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
                <p className="text-sm text-slate-500 font-bn leading-relaxed max-w-[180px] font-normal">{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── 4. WHY CHOOSE US ──────────────────────────────────────────────── */}
        {/* Note: Gradient overlay is intentional per design spec for subtle visual enhancement */}
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

        {/* ── 5. POPULAR ROUTES ────────────────────────────────────────────── */}
        {/* Note: Gradient overlay is intentional per design spec for subtle visual enhancement */}
        <Section id="popular-routes" variant="white" className="bg-gradient-to-b from-white via-primary/[0.02] to-slate-50/50">
          <SectionHeading title={t("routes_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-wrap justify-center gap-3 w-full"
          >
            <RouteCard from={t("route_1_from")} to={t("route_1_to")} onClick={handleBookNow} />
            <RouteCard from={t("route_2_from")} to={t("route_2_to")} onClick={handleBookNow} />
            <RouteCard from={t("route_3_from")} to={t("route_3_to")} onClick={handleBookNow} />
            <RouteCard from={t("route_4_from")} to={t("route_4_to")} onClick={handleBookNow} />
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
            {/* SEO keywords — visible but subtle */}
            <motion.div variants={itemVariants} className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-2 opacity-60">
              {[t("tag_cng_booking"), t("tag_chhagalnaiya"), t("tag_local_transport"), t("tag_fixed_fare"), t("tag_auto_rickshaw")].map((tag, i) => (
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
            {/* Header */}
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

            {/* Download Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto w-full">
              <motion.div variants={itemVariants}><AppDownloadCard title={t("download_user_app")} type="user" comingSoon /></motion.div>
              <motion.div variants={itemVariants}><AppDownloadCard title={t("download_driver_app")} type="driver" comingSoon /></motion.div>
            </div>

            {/* Decorative bottom glow */}
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
            <motion.p variants={itemVariants} className="text-white text-base font-normal mb-12 font-bn max-w-xl mx-auto leading-relaxed">{t("final_cta_sub")}</motion.p>
            <motion.div variants={itemVariants} className="max-w-sm mx-auto px-2 sm:px-0 w-full">
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

      {/* ── STICKY BOTTOM CTA (mobile) ────────────────────────────────────── */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, ease: "circOut" }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-2xl safe-area-bottom"
      >
        <div className="max-w-sm mx-auto w-full">
          <motion.div
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <AppButton
              onClick={handleBookNow}
              className="w-full min-h-[56px] h-14 text-sm sm:text-base rounded-2xl font-bold shadow-lg shadow-primary/20 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none touch-manipulation"
              leftIcon={<MapPin className="w-5 h-5" />}
            >
              {t("hero_book_now")}
            </AppButton>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
