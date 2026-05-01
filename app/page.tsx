"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, MapPin, Navigation, ShieldCheck, Phone,
  ChevronDown, Star, Check, Zap, Clock, BadgeCheck,
  ArrowRight, Banknote, Users, Route
} from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";

const PHONE_NUMBER = "+8801XXXXXXXXX"; // Replace with real number

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("px-4 py-12 max-w-2xl mx-auto w-full", className)}>
      {children}
    </section>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl font-extrabold text-slate-800 leading-snug">{title}</h2>
      {sub && <p className="text-slate-500 mt-1.5 text-sm">{sub}</p>}
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
function ReviewCard({ name, location, text }: { name: string; location: string; text: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-slate-700 font-bn text-base leading-relaxed">&quot;{text}&quot;</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-400">{location}</p>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <AppButton
        variant="ghost"
        fullWidth
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between p-4 text-left font-bold text-slate-800 text-base gap-2 h-auto rounded-none border-none hover:bg-transparent"
        aria-expanded={open}
      >
        <span className="font-bn">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-primary shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </AppButton>
      {open && (
        <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed font-bn border-t border-slate-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

// ─── Trust badge ──────────────────────────────────────────────────────────────
function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ─── Route card ───────────────────────────────────────────────────────────────
function RouteCard({ from, to, onClick }: { from: string; to: string; onClick: () => void }) {
  return (
    <AppButton
      variant="ghost"
      onClick={onClick}
      fullWidth
      className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100 hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98] text-left h-auto justify-start hover:bg-white"
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-0.5 h-4 bg-slate-200" />
        <div className="w-2 h-2 rounded-full bg-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate font-bn">{from}</p>
        <p className="text-slate-500 text-xs truncate font-bn">{to}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-primary shrink-0" />
    </AppButton>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [user, setUser] = useState<{ name: string; role: string; photoUrl?: string } | null>(null);

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
      router.push("/user/map");
    }
  }, [user, router]);

  const reviews = [
    { name: "রহিম মিয়া", location: "চাঁগলনাইয়া বাজার", text: "খুব দ্রুত CNG পেয়েছি। মাত্র ৫ মিনিটে ড্রাইভার চলে আসলো।" },
    { name: "সুমাইয়া বেগম", location: "হাসপাতাল রোড", text: "ড্রাইভার ভালো ছিল। আগেই ভাড়া জানা যায়, দরাদরির ঝামেলা নেই।" },
    { name: "কামাল হোসেন", location: "স্ট্যান্ড এলাকা", text: "অ্যাপ ব্যবহার খুব সহজ। আমি প্রতিদিন এটা দিয়ে CNG ডাকি।" },
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
      <Header role="landing" user={user} onLogout={handleLogout} />


      <main className="flex-1">

        {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
        <section
          id="hero"
          className="relative bg-gradient-to-br from-primary via-primary to-primary-dark text-white px-4 pt-10 pb-16 overflow-hidden"
        >
          {/* Background decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-12 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />

          <div className="max-w-lg mx-auto relative z-10">
            {/* Driver count badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
              <span className="text-xs font-bold">{t("trust_drivers_active")}</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-snug mb-3 font-bn">
              {t("hero_headline")}
            </h1>
            <p className="text-white/80 text-base mb-7 font-bn">
              {t("hero_sub")}
            </p>

            {/* CTA Button */}
            <AppButton
              onClick={handleBookNow}
              className="w-full h-14 text-lg rounded-2xl bg-white text-primary font-extrabold shadow-lg hover:bg-white/95 bounce-soft mb-3"
              leftIcon={<MapPin className="w-5 h-5" />}
            >
              {t("hero_book_now")}
            </AppButton>

            {/* Call button */}
            <a href={`tel:${PHONE_NUMBER}`} className="flex items-center justify-center gap-2 text-white/80 text-sm py-2 hover:text-white transition-colors font-medium">
              <Phone className="w-4 h-4" />
              <span>{t("call_to_book")}</span>
            </a>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              <TrustBadge icon={<Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />} label={t("hero_badge_drivers")} />
              <TrustBadge icon={<BadgeCheck className="w-3.5 h-3.5" />} label={t("hero_badge_safe")} />
              <TrustBadge icon={<Clock className="w-3.5 h-3.5" />} label={t("hero_badge_fast")} />
              <TrustBadge icon={<Banknote className="w-3.5 h-3.5" />} label={t("hero_cash_note")} />
            </div>
          </div>
        </section>

        {/* ── 2. LOCAL TRUST ───────────────────────────────────────────────── */}
        <Section id="trust" className="py-12">
          <SectionHeading title={t("trust_title")} />
          <div className="grid gap-4">
            {[
              { icon: <Users className="w-5 h-5 text-primary" />, text: t("trust_local_drivers") },
              { icon: <Route className="w-5 h-5 text-primary" />, text: t("trust_familiar_roads") },
              { icon: <ShieldCheck className="w-5 h-5 text-primary" />, text: t("trust_reliable") },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                  {item.icon}
                </div>
                <p className="font-bn text-base font-semibold text-slate-800 leading-snug">{item.text}</p>
                <Check className="w-5 h-5 text-primary shrink-0 ml-auto" />
              </div>
            ))}
          </div>
        </Section>

        {/* ── 3. HOW IT WORKS ──────────────────────────────────────────────── */}
        <Section id="how-it-works" className="bg-white py-12">
          <SectionHeading title={t("how_title")} />
          <div className="flex flex-col gap-0">
            {[
              { icon: <MapPin className="w-6 h-6" />, step: "১", title: t("how_step1"), sub: t("how_step1_sub") },
              { icon: <Banknote className="w-6 h-6" />, step: "২", title: t("how_step2"), sub: t("how_step2_sub") },
              { icon: <Navigation className="w-6 h-6" />, step: "৩", title: t("how_step3"), sub: t("how_step3_sub") },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-md">
                    {item.step}
                  </div>
                  {i < 2 && <div className="w-0.5 h-10 bg-primary/20 my-1" />}
                </div>
                <div className="pt-2.5 pb-8">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-primary">{item.icon}</span>
                    <h3 className="font-extrabold text-slate-800 text-lg font-bn">{item.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm font-bn">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 4. WHY CHOOSE US ──────────────────────────────────────────────── */}
        <Section id="why-us" className="py-12">
          <SectionHeading title={t("why_title")} />
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Banknote className="w-6 h-6" />, text: t("why_fixed_fare") },
              { icon: <Zap className="w-6 h-6" />, text: t("why_instant") },
              { icon: <Users className="w-6 h-6" />, text: t("why_drivers") },
              { icon: <Star className="w-6 h-6" />, text: t("why_simple") },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-2">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  {item.icon}
                </div>
                <p className="font-bn font-bold text-sm text-slate-800 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. POPULAR ROUTES ────────────────────────────────────────────── */}
        <Section id="popular-routes" className="bg-white py-12">
          <SectionHeading title={t("routes_title")} />
          <div className="grid gap-3">
            <RouteCard from={t("route_1_from")} to={t("route_1_to")} onClick={handleBookNow} />
            <RouteCard from={t("route_2_from")} to={t("route_2_to")} onClick={handleBookNow} />
            <RouteCard from={t("route_3_from")} to={t("route_3_to")} onClick={handleBookNow} />
            <RouteCard from={t("route_4_from")} to={t("route_4_to")} onClick={handleBookNow} />
          </div>
        </Section>

        {/* ── 6. FEATURES ──────────────────────────────────────────────────── */}
        <Section id="features" className="py-12">
          <SectionHeading title={t("feat_title")} />
          <div className="grid gap-3">
            <FeatureCard icon={<Zap className="w-6 h-6" />} title={t("feat_fast_booking")} sub={t("feat_fast_booking_sub")} />
            <FeatureCard icon={<MapPin className="w-6 h-6" />} title={t("feat_nearby")} sub={t("feat_nearby_sub")} />
            <FeatureCard icon={<Star className="w-6 h-6" />} title={t("feat_simple_ui")} sub={t("feat_simple_ui_sub")} />
            <FeatureCard icon={<BadgeCheck className="w-6 h-6" />} title={t("feat_instant_confirm")} sub={t("feat_instant_confirm_sub")} />
          </div>
        </Section>

        {/* ── 7. SERVICE AREA ──────────────────────────────────────────────── */}
        <Section id="service-area" className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-none py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 mb-5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">Chhagalnaiya Upazila</span>
            </div>
            <h2 className="text-2xl font-extrabold mb-3">{t("area_title")}</h2>
            <p className="text-slate-300 text-sm leading-relaxed font-bn mb-5 max-w-sm mx-auto">
              {t("area_desc")}
            </p>
            <div className="flex items-center justify-center gap-2 bg-white/10 rounded-xl px-4 py-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="font-bn font-bold text-white">{t("area_coverage")}</span>
            </div>
            {/* SEO keywords — visible but subtle */}
            <p className="mt-4 text-xs text-slate-500 max-w-xs mx-auto">
              CNG booking in Chhagalnaiya · local auto rickshaw service · CNG near me · fixed fare Chhagalnaiya
            </p>
          </div>
        </Section>

        {/* ── 8. TESTIMONIALS ──────────────────────────────────────────────── */}
        <Section id="reviews" className="bg-slate-50 py-12">
          <SectionHeading title={t("reviews_title")} />
          <div className="grid gap-4">
            {reviews.map((r, i) => (
              <ReviewCard key={i} name={r.name} location={r.location} text={r.text} />
            ))}
          </div>
        </Section>

        {/* ── 9. FAQ ───────────────────────────────────────────────────────── */}
        <Section id="faq" className="bg-white py-12">
          <SectionHeading title={t("faq_title")} />
          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={t(faq.qKey)} answer={t(faq.aKey)} />
            ))}
          </div>
        </Section>

        {/* ── 10. FINAL CTA ────────────────────────────────────────────────── */}
        <section id="final-cta" className="bg-gradient-to-br from-primary to-primary-dark text-white px-4 py-14 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-white/15 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold font-bn mb-2">{t("final_cta_title")}</h2>
            <p className="text-white/75 text-sm mb-7 font-bn">{t("final_cta_sub")}</p>
            <AppButton
              onClick={handleBookNow}
              className="w-full h-14 text-lg rounded-2xl bg-white text-primary font-extrabold shadow-lg hover:bg-white/95 bounce-soft mb-3"
              leftIcon={<MapPin className="w-5 h-5" />}
            >
              {t("hero_book_now")}
            </AppButton>
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="flex items-center justify-center gap-2 text-white/75 text-sm py-2 hover:text-white transition-colors font-medium"
            >
              <Phone className="w-4 h-4" />
              <span>{t("call_to_book")}</span>
            </a>
          </div>
        </section>

        {/* ── 11. FOOTER ───────────────────────────────────────────────────── */}
        <footer id="footer" className="bg-slate-900 text-slate-400 px-4 pt-10 pb-24">
          <div className="max-w-lg mx-auto">
            <div className="mb-6">
              <h3 className="text-white font-extrabold text-lg mb-1">{t("app_name")}</h3>
              <p className="text-sm font-bn leading-relaxed">{t("footer_about_text")}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t("footer_about")}</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/login" className="hover:text-white transition-colors">{t("user_login")}</Link></li>
                  <li><Link href="/driver/login" className="hover:text-white transition-colors">{t("driver_login")}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t("footer_contact")}</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href={`tel:${PHONE_NUMBER}`} className="hover:text-white transition-colors flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {PHONE_NUMBER}
                    </a>
                  </li>
                  <li><Link href="#" className="hover:text-white transition-colors">{t("footer_terms")}</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">{t("footer_privacy")}</Link></li>
                </ul>
              </div>
            </div>

            {/* Internet fallback message */}
            <div className="bg-slate-800 rounded-xl p-3 flex items-center gap-2 mb-6 text-sm">
              <Phone className="w-4 h-4 text-primary shrink-0" />
              <span className="font-bn text-slate-300">{t("footer_internet_fallback")}: {PHONE_NUMBER}</span>
            </div>

            <div className="border-t border-slate-800 pt-5 text-center text-xs text-slate-600">
              <p>© {new Date().getFullYear()} {t("app_name")} · Chhagalnaiya, Feni, Bangladesh</p>
            </div>
          </div>
        </footer>
      </main>

      {/* ── STICKY BOTTOM CTA (mobile) ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-2xl flex gap-2">
        <AppButton
          onClick={handleBookNow}
          className="flex-1 h-13 text-base rounded-xl font-extrabold shadow-md"
          leftIcon={<MapPin className="w-5 h-5" />}
        >
          {t("hero_book_now")}
        </AppButton>
        <a
          href={`tel:${PHONE_NUMBER}`}
          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl px-4 transition-colors active:scale-[0.98]"
        >
          <Phone className="w-5 h-5" />
          <span className="text-sm">{t("call_to_book")}</span>
        </a>
      </div>
    </div>
  );
}
