"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User as UserIcon, MapPin, Navigation, ShieldCheck,
  ChevronDown, Star, Check, Zap, BadgeCheck,
  ArrowRight, Banknote, Users, Route, Smartphone, Download
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValue, useMotionTemplate } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { User } from "@/lib/types/user";


// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, className, children, noPadding, style, variant = "default" }: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
  variant?: "default" | "mesh" | "premium" | "white" | "slate" | "glass" | "dark" | "primary" | "subtle";
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const variantClasses = {
    default: "bg-slate-50",
    mesh: "mesh-gradient noise-bg",
    premium: "premium-bg-surface noise-bg",
    white: "bg-white",
    slate: "bg-slate-50 dot-grid-texture",
    glass: "glass-morphism",
    dark: "bg-slate-950 text-white noise-bg",
    primary: "bg-gradient-to-br from-primary to-primary-dark text-white noise-bg",
    subtle: "bg-slate-50/50 backdrop-blur-sm",
  };

  return (
    <section
      id={id}
      onMouseMove={handleMouseMove}
      className={cn("px-4 py-16 md:py-24 relative overflow-hidden group/section", variantClasses[variant], className)}
      style={style}
    >
      {/* Spotlight Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover/section:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(11, 122, 60, ${variant === "dark" || variant === "primary" ? "0.1" : "0.05"}),
              transparent 80%
            )
          `,
        }}
      />

      {/* Universal texture overlay */}
      <div className={cn(
        "absolute inset-0 pointer-events-none opacity-[0.03] dot-grid-texture",
        variant === "dark" || variant === "primary" ? "opacity-[0.05] invert" : ""
      )} />

      {/* Subtle top divider for certain variants */}
      {(variant === "white" || variant === "slate") && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn("max-w-[1200px] mx-auto w-[92%] md:w-full relative z-10", noPadding && "px-0")}
      >
        {children}
      </motion.div>
    </section>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHeading({ title, sub, light }: { title: string; sub?: string; light?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="text-center mb-12 md:mb-16"
    >
      <h2 className={cn(
        "text-2xl md:text-4xl font-extrabold tracking-tight leading-tight font-bn mb-4",
        light ? "text-white" : "text-slate-900"
      )}>
        {title}
      </h2>
      {sub && (
        <Reveal delay={0.4}>
          <p className={cn(
            "text-sm font-normal max-w-2xl mx-auto font-bn",
            light ? "text-slate-300" : "text-slate-600"
          )}>
            {sub}
          </p>
        </Reveal>
      )}
    </motion.div>
  );
}

// ─── Magnetic Effect ─────────────────────────────────────────────────────────
function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Blur Reveal ─────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── 3D Tilt Card ───────────────────────────────────────────────────────────
function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width - 0.5) * 200;
    const yPct = (mouseY / height - 0.5) * 200;
    x.set(xPct);
    y.set(yPct);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("perspective-1000", className)}
    >
      <div style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function ReviewCard({ name, location, text }: { name: string; location: string; text: string }) {
  return (
    <Tilt className="h-full">
      <motion.div
        className="bg-white rounded-3xl p-6 premium-card-shadow-hover border border-slate-100 flex flex-col items-center text-center gap-4 min-h-[260px] h-full"
      >
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-slate-700 font-bn text-base leading-relaxed italic flex-1">&quot;{text}&quot;</p>
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-600 font-medium tracking-wide uppercase">{location}</p>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "border-b border-gray-100 overflow-hidden transition-all duration-200",
      open ? "bg-slate-50/50" : "bg-white"
    )}>
      <AppButton
        variant="ghost"
        fullWidth
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between py-5 px-4 text-left font-semibold text-slate-900 text-base gap-4 h-auto rounded-none border-none hover:bg-slate-50/70 focus:ring-2 focus:ring-primary/30 focus:outline-none"
        aria-expanded={open}
      >
        <span className="font-bn flex-1">{question}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          className={cn(
            "w-6 h-6 flex items-center justify-center transition-colors duration-200 shrink-0",
            open ? "text-primary" : "text-slate-400"
          )}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </AppButton>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 text-slate-700 text-sm leading-relaxed font-bn font-normal pt-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Trust badge ──────────────────────────────────────────────────────────────
function TrustBadge({ icon, label, variant = "default" }: { icon: React.ReactNode; label: string; variant?: "default" | "glass" }) {
  const variantClasses = {
    default: "bg-white text-slate-700 border-slate-200 shadow-sm hover:border-primary/30",
    glass: "bg-white/10 backdrop-blur-md text-white border-white/20 shadow-xl hover:bg-white/20"
  };

  return (
    <div className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200", variantClasses[variant])}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ─── Route card ───────────────────────────────────────────────────────────────
function RouteCard({ from, to, onClick }: { from: string; to: string; onClick: () => void }) {
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md transition-all duration-200 text-sm font-semibold font-bn h-auto group cursor-pointer"
    >
      <Route className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors duration-200" />
      <span>{from}</span>
      <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-white/70 transition-colors duration-200" />
      <span>{to}</span>
    </motion.button>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Tilt>
      <motion.div
        className="bg-white border border-gray-100 rounded-xl p-6 premium-card-shadow-hover flex flex-col items-center text-center gap-4 focus-within:ring-2 focus-within:ring-primary/30 h-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-primary/10 w-10 h-10 flex items-center justify-center rounded-2xl text-primary shrink-0"
        >
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
        </motion.div>
        <div>
          <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed font-bn font-normal">{sub}</p>
        </div>
      </motion.div>
    </Tilt>
  );
}

// ─── Download App Card ────────────────────────────────────────────────────────
function AppDownloadCard({ title, type, comingSoon }: { title: string; type: "user" | "driver"; comingSoon?: boolean }) {
  const { t } = useLang();
  return (
    <Tilt className="h-full">
      <motion.div
        whileHover={{ y: -10, backgroundColor: "rgba(255, 255, 255, 0.12)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
        className="backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-6 group shadow-2xl relative overflow-hidden cursor-pointer h-full"
      >
        {comingSoon && (
          <div className="absolute top-4 right-[-35px] bg-amber-400 text-slate-900 text-[10px] font-bold px-10 py-1 rotate-45 shadow-sm uppercase tracking-wider z-20">
            {t("coming_soon")}
          </div>
        )}

        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
          type === "user" ? "bg-gradient-to-br from-primary to-emerald-600 text-white" : "bg-gradient-to-br from-slate-700 to-slate-900 text-white"
        )}>
          <Smartphone className="w-10 h-10" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-2 font-bn tracking-tight">{title}</h3>
          <p className="text-white/60 text-sm font-bn font-normal leading-relaxed">{type === "user" ? t("for_daily_bookings") : t("for_partners")}</p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-auto">
          <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 opacity-50 cursor-not-allowed group-hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4 text-white/40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{t("google_play")}</span>
          </div>
          <div className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 opacity-50 cursor-not-allowed group-hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4 text-white/40" />
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{t("app_store")}</span>
          </div>
        </div>
      </motion.div>
    </Tilt>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [user, setUser] = useState<User | null>(null);

  // Scroll Progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [headerTheme, setHeaderTheme] = useState<"transparent" | "light">("transparent");

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest > 0.05) {
        setHeaderTheme("light");
      } else {
        setHeaderTheme("transparent");
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
      <Header
        role="landing"
        user={user}
        onLogout={handleLogout}
        className={cn("transition-all duration-500")}
        theme={headerTheme}
      />


      <motion.main
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >

        {/* Scroll Progress Indicator */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-1.5 bg-primary origin-left z-[100]"
          style={{ scaleX: scrollYProgress }}
        />

        {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
        <Section
          id="hero"
          variant="dark"
          className="hero-mesh-gradient pt-24 pb-32 md:pt-40 md:pb-52"
          noPadding
        >
          {/* Parallax decorative elements */}
          <motion.div
            style={{ y: y1 }}
            className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-1/2 pointer-events-none z-0"
          />
          <motion.div
            style={{ y: y2, rotate }}
            className="absolute -bottom-24 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-20 z-0"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10 px-4 md:px-0">
            {/* Left Column: Content */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Driver count badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 mb-8 shadow-xl"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-[0.2em]">{t("trust_drivers_active")}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                className="text-4xl md:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] mb-6 font-bn tracking-tight"
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-white bg-[length:200%_auto] animate-gradient-x">
                  {t("hero_headline")}
                </span>
              </motion.h1>

              <Reveal delay={0.8}>
                <p className="text-white/70 text-base md:text-lg font-normal mb-10 font-bn max-w-xl leading-relaxed">
                  {t("hero_sub")}
                </p>
              </Reveal>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="w-full max-w-sm"
              >
                <Magnetic>
                  <AppButton
                    onClick={handleBookNow}
                    className="w-full h-16 px-8 py-4 text-lg rounded-2xl bg-primary text-white font-black shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none"
                    leftIcon={<MapPin className="w-6 h-6" />}
                  >
                    {t("hero_book_now")}
                  </AppButton>
                </Magnetic>
              </motion.div>

              {/* Trust badges */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap justify-center lg:justify-start gap-3 mt-12"
              >
                <motion.div variants={itemVariants}><TrustBadge variant="glass" icon={<Star className="w-4 h-4 fill-amber-400 text-amber-400" />} label={t("hero_badge_drivers")} /></motion.div>
                <motion.div variants={itemVariants}><TrustBadge variant="glass" icon={<BadgeCheck className="w-4 h-4 text-primary" />} label={t("hero_badge_safe")} /></motion.div>
                <motion.div variants={itemVariants}><TrustBadge variant="glass" icon={<BadgeCheck className="w-4 h-4 text-primary" />} label={t("hero_badge_fast")} /></motion.div>
                <motion.div variants={itemVariants}><TrustBadge variant="glass" icon={<Banknote className="w-4 h-4 text-primary" />} label={t("hero_cash_note")} /></motion.div>
              </motion.div>
            </div>

            {/* Right Column: Premium Image with Effects */}
            <div className="relative hidden lg:flex justify-center items-center">
              {/* Glow background effect */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute w-[120%] h-[120%] bg-primary/20 rounded-full blur-[120px] z-0"
              />
              
              {/* Image with floating animation */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="relative z-10"
              >
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative group/cng">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-150 opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
                    
                    <div className="relative overflow-hidden rounded-[2rem]">
                      <Image
                        src="/cng_premium.png"
                        alt="Premium CNG Auto Rickshaw"
                        width={800}
                        height={600}
                        className="object-contain drop-shadow-[0_20px_50px_rgba(11,122,60,0.3)] select-none pointer-events-none relative z-10 transition-transform duration-700 group-hover/cng:scale-[1.02]"
                        priority
                        style={{
                          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                          WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
                        }}
                      />
                      
                      {/* Light Sweep Animation */}
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
                    </div>

                    {/* Floating Trust Indicators around the vehicle */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-4 -right-4 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-xl flex items-center gap-2 group-hover/cng:scale-110 transition-transform duration-300"
                    >
                      <div className="bg-primary/20 p-1.5 rounded-lg">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">{t("hero_badge_safe")}</span>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute bottom-12 -left-8 z-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-xl flex items-center gap-2 group-hover/cng:scale-110 transition-transform duration-300"
                    >
                      <div className="bg-primary/20 p-1.5 rounded-lg">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">{t("hero_badge_fast")}</span>
                    </motion.div>

                    {/* Price Lock Indicator - New Meaningful Element */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 }}
                      className="absolute -bottom-2 right-4 z-20 bg-gradient-to-br from-primary to-primary-dark border border-white/20 rounded-2xl p-3 shadow-2xl flex items-center gap-2"
                    >
                      <div className="bg-white/20 p-1.5 rounded-lg">
                        <Banknote className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-white/70 uppercase tracking-tight">{t("fixed_fare")}</span>
                        <span className="text-[10px] font-black text-white uppercase leading-none">No Surprise</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Refined shadow beneath the image */}
                <motion.div
                  animate={{
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
        <Section id="trust" variant="white" className="bg-gradient-to-b from-white via-primary/[0.02] to-slate-50/50">
          <SectionHeading title={t("trust_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-6"
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
                <p className="font-bn text-base font-semibold text-slate-800 leading-tight">{item.text}</p>
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
            className="grid md:grid-cols-3 gap-12 relative"
          >
            {/* Desktop line indicator - Animated SVG Path */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] w-[70%] h-20 z-0 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 800 100" fill="none" preserveAspectRatio="none">
                <motion.path
                  d="M 0 50 Q 200 100 400 50 Q 600 0 800 50"
                  stroke="url(#line-gradient)"
                  strokeWidth="3"
                  strokeDasharray="12 12"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {[
              { icon: <MapPin className="w-7 h-7" />, step: t("step_1"), title: t("how_step1"), sub: t("how_step1_sub") },
              { icon: <Banknote className="w-7 h-7" />, step: t("step_2"), title: t("how_step2"), sub: t("how_step2_sub") },
              { icon: <Navigation className="w-7 h-7" />, step: t("step_3"), title: t("how_step3"), sub: t("how_step3_sub") },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex flex-col items-center relative z-10 text-center group"
              >
                {/* Step Number Circle */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                  className="w-16 h-16 rounded-[2rem] bg-white shadow-xl flex items-center justify-center relative mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 border border-slate-100"
                >
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center shadow-lg border-2 border-white z-20">
                    {item.step}
                  </div>
                  <div className="text-primary group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                </motion.div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 font-bn">{item.title}</h3>
                <p className="text-sm text-slate-600 font-bn leading-relaxed max-w-[200px] font-normal">{item.sub}</p>
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
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
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
                  <p className="font-bn font-bold text-base text-slate-900 leading-tight">{item.text}</p>
                </motion.div>
              </Tilt>
            ))}
          </motion.div>
        </Section>

        {/* ── 5. POPULAR ROUTES ────────────────────────────────────────────── */}
        <Section id="popular-routes" variant="white" className="bg-gradient-to-b from-white via-primary/[0.02] to-slate-50/50">
          <SectionHeading title={t("routes_title")} />
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
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
            className="grid md:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants}><FeatureCard icon={<Zap />} title={t("feat_fast_booking")} sub={t("feat_fast_booking_sub")} /></motion.div>
            <motion.div variants={itemVariants}><FeatureCard icon={<MapPin />} title={t("feat_nearby")} sub={t("feat_nearby_sub")} /></motion.div>
            <motion.div variants={itemVariants}><FeatureCard icon={<Star />} title={t("feat_simple_ui")} sub={t("feat_simple_ui_sub")} /></motion.div>
            <motion.div variants={itemVariants}><FeatureCard icon={<BadgeCheck />} title={t("feat_instant_confirm")} sub={t("feat_instant_confirm_sub")} /></motion.div>
          </motion.div>
        </Section>

        {/* ── 7. SERVICE AREA ──────────────────────────────────────────────── */}
        <Section id="service-area" variant="dark" className="border-y border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center relative z-10"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-2.5 mb-8">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-white uppercase tracking-widest">{t("location_upazila")}</span>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-2xl md:text-4xl font-extrabold text-white mb-6 font-bn">{t("area_title")}</motion.h2>
            <motion.p variants={itemVariants} className="text-slate-300 text-sm font-normal leading-relaxed font-bn mb-10 max-w-2xl mx-auto">
              {t("area_desc")}
            </motion.p>
            <motion.div variants={itemVariants} className="inline-flex items-center justify-center gap-4 bg-primary/10 border border-white/20 rounded-3xl px-8 py-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                <Check className="w-7 h-7" />
              </div>
              <span className="font-bn font-bold text-2xl text-white">{t("area_coverage")}</span>
            </motion.div>
            {/* SEO keywords — visible but subtle */}
            <motion.div variants={itemVariants} className="mt-12 flex flex-wrap justify-center gap-x-4 gap-y-2 opacity-60">
              {[t("tag_cng_booking"), t("tag_chhagalnaiya"), t("tag_local_transport"), t("tag_fixed_fare"), t("tag_auto_rickshaw")].map((tag, i) => (
                <span key={i} className="text-sm text-white uppercase tracking-[0.2em]">{tag}</span>
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
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {reviews.map((r, i) => (
              <motion.div key={i} variants={itemVariants}>
                <ReviewCard name={r.name} location={r.location} text={r.text} />
              </motion.div>
            ))}
          </motion.div>
        </Section>

        {/* ── 9. DOWNLOAD APP ──────────────────────────────────────────────── */}
        <Section id="download" variant="dark" className="border-y border-white/5 py-24 md:py-32">
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <motion.div 
              animate={{ 
                opacity: [0.1, 0.2, 0.1],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(11,122,60,0.2),transparent_60%)]" 
            />
            <motion.div 
              animate={{ 
                opacity: [0.05, 0.15, 0.05],
                scale: [1.1, 1, 1.1],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.15),transparent_60%)]" 
            />
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
                <span className="text-xs font-bold text-white/80 uppercase tracking-[0.2em]">{t("coming_soon")}</span>
              </motion.div>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-extrabold text-white mb-6 font-bn tracking-tight">
                {t("download_title")}
              </motion.h2>
              <motion.p variants={itemVariants} className="text-white/60 text-base md:text-lg max-w-2xl mx-auto font-bn font-normal leading-relaxed">
                {t("download_sub")}
              </motion.p>
            </div>

            {/* Download Cards */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
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
            className="max-w-3xl mx-auto rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
          <div className="relative z-10">
            <motion.div variants={itemVariants} className="bg-white/20 w-14 h-14 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-md border border-white/30 rotate-12">
              <Navigation className="w-8 h-8 text-white -rotate-12" />
              <span className="sr-only">{t("app_name")} {t("hero_book_now")}</span>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl font-extrabold font-bn mb-6 tracking-tight leading-tight">{t("final_cta_title")}</motion.h2>
            <motion.p variants={itemVariants} className="text-white/80 text-base font-normal mb-12 font-bn max-w-xl mx-auto leading-relaxed">{t("final_cta_sub")}</motion.p>
            <motion.div variants={itemVariants} className="max-w-sm mx-auto">
              <Magnetic>
                <AppButton
                  onClick={handleBookNow}
                  className="w-full h-14 text-base rounded-2xl bg-white text-primary font-bold shadow-2xl hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary focus:outline-none"
                  leftIcon={<MapPin className="w-5 h-5" />}
                >
                  {t("hero_book_now")}
                </AppButton>
              </Magnetic>
            </motion.div>
          </div>
        </Section>

        {/* ── 11. FOOTER ───────────────────────────────────────────────────── */}
        <footer id="footer" className="bg-slate-900 text-slate-300 px-4 pt-12 pb-28 border-t border-slate-800">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-[1200px] mx-auto w-[92%] md:w-full"
          >
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <motion.div variants={itemVariants} className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-6">
                  <Image
                    src="/logo_white.png"
                    alt="CNGLagbe"
                    width={200}
                    height={50}
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <p className="text-sm font-normal font-bn leading-relaxed max-w-md text-slate-400">{t("footer_about_text")}</p>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">{t("footer_about")}</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/login" className="hover:text-primary transition-colors duration-200 focus:outline-none">{t("user_login")}</Link></li>
                  <li><Link href="/driver/login" className="hover:text-primary transition-colors duration-200 focus:outline-none">{t("driver_login")}</Link></li>
                </ul>
              </motion.div>

              <motion.div variants={itemVariants}>
                <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">{t("footer_contact")}</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{t("location_upazila")}</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="border-t border-slate-800/60 pt-8 text-center text-sm text-slate-500">
              <p>© {new Date().getFullYear()} {t("app_name")} · {t("location_full")}</p>
            </motion.div>
          </motion.div>
        </footer>
      </motion.main>

      {/* ── STICKY BOTTOM CTA (mobile) ────────────────────────────────────── */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: "circOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
      >
        <div className="max-w-sm mx-auto w-full">
          <motion.div
            animate={{
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
              className="w-full h-14 text-base rounded-2xl font-bold shadow-lg shadow-primary/20 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
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
