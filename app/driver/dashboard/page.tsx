"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Power, User, MapPin, Navigation, Info } from "lucide-react";

interface RequestItem {
  id: string;
  distance: number;
  fare: number;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  createdAt: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [currentRide, setCurrentRide] = useState<any>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("cng_driver_token");
    if (!stored) router.push("/driver/login");
    else setToken(stored);
  }, [router]);

  useEffect(() => {
    if (!token || !isOnline) return;
    
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/driver/requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
           localStorage.removeItem("cng_driver_token");
           router.push("/driver/login");
           return;
        }
        const data = await res.json();
        setRequests(data.requests || []);
        setCurrentRide(data.currentRide || null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [token, isOnline, router]);

  const toggleOnline = async () => {
    try {
      const res = await fetch("/api/driver/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isOnline: !isOnline })
      });
      if (res.ok) setIsOnline(!isOnline);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch("/api/driver/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: id })
      });
      if (res.ok) {
         setRequests([]);
         const data = await res.json();
         setCurrentRide(data.booking);
      } else {
         alert("Ride already taken or cancelled!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch("/api/driver/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: id })
      });
      if (res.ok) {
         setCurrentRide(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem("cng_driver_token");
    router.push("/driver/login");
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-emerald-600 text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <User className="w-5 h-5 opacity-80" />
           <span className="font-bold tracking-wide">Driver Dashboard</span>
        </div>
        <button onClick={logout} className="p-2 hover:bg-emerald-700 rounded-full transition text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto w-full flex-1">
        
        {/* Toggle Status Card */}
        {!currentRide && (
          <div className="card text-center py-8 mb-6 relative overflow-hidden">
            {isOnline && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>}
            
            <button
               onClick={toggleOnline}
               className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 transition-all duration-300 shadow-lg ${
                 isOnline ? "bg-emerald-500 text-white shadow-emerald-500/40" : "bg-slate-200 text-slate-500"
               }`}
            >
               <Power className="w-10 h-10" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">
               {isOnline ? "You're Online" : "You're Offline"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
               {isOnline ? "Waiting for ride requests..." : "Go online to receive rides."}
            </p>
          </div>
        )}

        {/* Current Ride View */}
        {currentRide && (
          <div className="card border-l-4 border-blue-500 shadow-md">
             <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="font-bold text-lg text-slate-800">Active Ride</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">ONGOING</span>
             </div>
             
             <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                   <Navigation className="text-blue-500 w-5 h-5 shrink-0" />
                   <div>
                     <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Pickup</p>
                     <p className="text-sm font-medium">{currentRide.pickupLat.toFixed(4)}, {currentRide.pickupLng.toFixed(4)}</p>
                     <a target="_blank" href={`https://www.google.com/maps/dir/?api=1&destination=${currentRide.pickupLat},${currentRide.pickupLng}`} className="text-blue-600 text-sm underline mt-1 block">Nav to Pickup</a>
                   </div>
                </div>
                
                <div className="flex gap-3">
                   <MapPin className="text-red-500 w-5 h-5 shrink-0" />
                   <div>
                     <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Dropoff</p>
                     <p className="text-sm font-medium">{currentRide.destLat.toFixed(4)}, {currentRide.destLng.toFixed(4)}</p>
                     <a target="_blank" href={`https://www.google.com/maps/dir/?api=1&destination=${currentRide.destLat},${currentRide.destLng}`} className="text-blue-600 text-sm underline mt-1 block">Nav to Dropoff</a>
                   </div>
                </div>
             </div>
             
             <div className="bg-slate-50 p-4 rounded-lg mb-6 flex justify-between items-center text-lg">
                <span className="font-semibold text-slate-600">To Collect</span>
                <span className="font-extrabold text-slate-800">৳{currentRide.fare}</span>
             </div>

             <button onClick={() => handleComplete(currentRide.id)} className="btn-primary py-4 text-lg">
                Complete Ride
             </button>
          </div>
        )}

        {/* Incoming Requests */}
        {isOnline && !currentRide && requests.length > 0 && (
          <div className="space-y-4">
             <h3 className="font-bold text-slate-700 mb-2 flex justify-between items-center">
                <span>Incoming Requests</span>
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">{requests.length} New</span>
             </h3>
             {requests.map(req => (
                <div key={req.id} className="card border-l-4 border-emerald-500 animate-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-start mb-4">
                       <div>
                         <p className="text-xs text-slate-500">Fixed Fare</p>
                         <p className="text-2xl font-extrabold text-emerald-600">৳{req.fare}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-slate-500">Dist</p>
                         <p className="font-bold text-slate-700">{req.distance} km</p>
                       </div>
                   </div>
                   <div className="flex gap-2">
                       <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-medium transition">
                          Reject
                       </button>
                       <button onClick={() => handleAccept(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md py-3 rounded-lg font-medium transition">
                          Accept
                       </button>
                   </div>
                </div>
             ))}
          </div>
        )}
        
        {isOnline && !currentRide && requests.length === 0 && (
          <div className="text-center text-slate-400 mt-12 flex flex-col items-center">
             <Info className="w-8 h-8 mb-2 opacity-50" />
             <p>No nearby rides at the moment.</p>
          </div>
        )}

      </main>
    </div>
  );
}
