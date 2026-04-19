import Link from "next/link";
import { MapPin, Navigation, Coins, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-emerald-500 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">CNGLagbe</h1>
        <Link href="/driver/login" className="text-sm bg-white/20 px-3 py-1.5 rounded-full font-medium hover:bg-white/30 transition">
          Driver Login
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full mt-8">
        <div className="bg-emerald-100 p-6 rounded-full mb-6">
          <Navigation className="w-16 h-16 text-emerald-600" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Need a CNG?</h2>
        <p className="text-slate-500 mb-8 max-w-[280px]">
          Book a rural CNG instantly with fixed fare. No haggling required.
        </p>

        <Link href="/user/map" className="btn-primary flex items-center justify-center gap-2 text-lg mb-10 w-full shadow-emerald-500/30">
          <MapPin className="w-5 h-5" />
          Set Pickup Location
        </Link>

        {/* Feature Highlights */}
        <div className="grid gap-4 w-full">
          <div className="card flex items-center gap-4 text-left">
            <div className="bg-slate-100 p-3 rounded-full text-slate-700">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Fixed Fare</h3>
              <p className="text-xs text-slate-500">Know exactly what you'll pay</p>
            </div>
          </div>
          
          <div className="card flex items-center gap-4 text-left">
            <div className="bg-slate-100 p-3 rounded-full text-slate-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Reliable Drivers</h3>
              <p className="text-xs text-slate-500">Verified local providers</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center p-6 text-slate-400 text-xs">
        <p>CNGLagbe MVP &copy; {new Date().getFullYear()}</p>
        <Link href="/admin" className="underline mt-2 inline-block">
          Admin Dashboard
        </Link>
      </footer>
    </div>
  );
}
