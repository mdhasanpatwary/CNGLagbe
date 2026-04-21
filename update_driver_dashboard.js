const fs = require('fs');
const file = '/Users/patwary/Projects/CNGLagbe/app/driver/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  'import { useRef } from "react";',
  'import { useRef } from "react";\nimport { StaticMap } from "@/components/StaticMap";'
);
content = content.replace(
  'import { LogOut, Power, User, MapPin, Navigation, Info, ExternalLink, CheckCircle2, XCircle, Banknote } from "lucide-react";',
  'import { LogOut, Power, User, MapPin, Navigation, Info, ExternalLink, CheckCircle2, XCircle, Banknote, Clock } from "lucide-react";'
);

// 2. States
content = content.replace(
  'const [requests, setRequests] = useState<RequestItem[]>([]);\n  const [currentBooking, setCurrentBooking] = useState<CurrentBooking | null>(null);',
  'const [requests, setRequests] = useState<RequestItem[]>([]);\n  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());\n  const [currentBooking, setCurrentBooking] = useState<CurrentBooking | null>(null);\n  const [arrivedBooking, setArrivedBooking] = useState<CurrentBooking | null>(null);\n  const [timeLeft, setTimeLeft] = useState(20);'
);

// 3. fetchRequests filtering
content = content.replace(
  'setRequests(data.requests || []);',
  'const unrejected = (data.requests || []).filter((r: RequestItem) => !rejectedIds.has(r.id));\n        setRequests(unrejected);'
);

// 4. Request Timer & Sound
const timerCode = `
  // ─── Request Timer & Sound ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || requests.length === 0 || currentBooking) return;
    
    const activeReq = requests[0];
    
    const playAlertTone = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const audioCtx = new AudioCtx();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error(e);
      }
    };
    
    playAlertTone();
    setTimeLeft(20);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleReject(activeReq.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [requests[0]?.id, isOnline, currentBooking]);
`;
content = content.replace(
  '// ─── Real-time Location Push ──────────────────────────────────────────────',
  timerCode + '\n  // ─── Real-time Location Push ──────────────────────────────────────────────'
);

// 5. handleReject / handleAccept / handleComplete
content = content.replace(
  'const handleAccept = async (id: string) => {',
  `const handleReject = async (id: string) => {
    setRejectedIds(prev => new Set(prev).add(id));
    setRequests(prev => prev.filter(r => r.id !== id));
    try {
      await fetch("/api/driver/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async (req: RequestItem) => {`
);

content = content.replace(
  'body: JSON.stringify({ bookingId: id })',
  'body: JSON.stringify({ bookingId: req.id })'
);

content = content.replace(
  'const data = await res.json();\n         setCurrentBooking(data.currentBooking || null);',
  'const data = await res.json();\n         setCurrentBooking(data.booking);\n         window.open(`https://www.google.com/maps/dir/?api=1&destination=${req.pickupLat},${req.pickupLng}`, "_blank");'
);

// Fix the original handleAccept that sets error: alert(t("login_failed"));
content = content.replace(
  'alert(t("login_failed"));',
  'alert(t("error") as string);'
);

content = content.replace(
  'setCurrentBooking(null);',
  'setArrivedBooking(currentBooking);\n         setCurrentBooking(null);'
);

// 6. UI modifications - the "Ongoing Ride" replace Finish with I've Arrived
content = content.replace(
  '{t("finish")}',
  '{t("i_arrived")}'
);

// 7. Remove the old Incoming Requests block and inject new UI elements
const newIncomingBlock = `
        {/* Arrived Booking Modal - Fare to Collect */}
        {arrivedBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm border-none shadow-2xl rounded-[2rem] bg-white overflow-hidden animate-in zoom-in-95 duration-500">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Banknote className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">{t("booking_done")}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">{t("to_collect")}</p>
                
                <div className="bg-slate-50 p-6 rounded-2xl w-full mb-8 border border-slate-100">
                  <p className="text-5xl font-black text-slate-800">{t("currency")}{arrivedBooking.fare}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t("cash")}</p>
                </div>
                
                <Button 
                  onClick={() => setArrivedBooking(null)} 
                  size="lg" 
                  className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <CheckCircle2 size={24} className="mr-2" /> {t("bk_home")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Incoming Request Fullscreen Modal */}
        {isOnline && !currentBooking && requests.length > 0 && !arrivedBooking && (() => {
          const req = requests[0];
          return (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
              <Card className="w-full sm:max-w-md border-none shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] bg-white overflow-hidden animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] flex flex-col">
                <div className="bg-slate-800 p-4 shrink-0 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-widest">{t("incoming")}</h3>
                  </div>
                  <Badge className="bg-slate-700 text-white hover:bg-slate-700 font-black flex gap-1">
                    <Clock size={12} /> {timeLeft}s
                  </Badge>
                </div>
                
                <CardContent className="p-6 flex-1 overflow-y-auto">
                  <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-50">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("fixed_fare")}</p>
                      <p className="text-5xl font-black text-emerald-600 tracking-tighter">{t("currency")}{req.fare}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t("distance")}</p>
                      <p className="text-2xl font-black text-slate-700">{req.distance} <span className="text-sm text-slate-400">{t("km_unit")}</span></p>
                    </div>
                  </div>
                  
                  <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                    <StaticMap 
                      lat={req.pickupLat} 
                      lng={req.pickupLng} 
                      markers={[{ lat: req.pickupLat, lng: req.pickupLng, color: "blue", label: "P" }]} 
                      height={150} 
                    />
                  </div>

                  <div className="flex flex-col gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex gap-3 text-slate-600">
                        <MapPin size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t("pickup")}</p>
                          <span className="text-sm font-bold">{req.pickupAddress || \`\${req.pickupLat.toFixed(4)}, \${req.pickupLng.toFixed(4)}\`}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 text-slate-600">
                        <Navigation size={18} className="text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t("drop")}</p>
                          <span className="text-sm font-bold">{req.destAddress || \`\${req.destLat.toFixed(4)}, \${req.destLng.toFixed(4)}\`}</span>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100">
                    <Button 
                      onClick={() => handleReject(req.id)} 
                      variant="outline" 
                      className="h-16 rounded-2xl border-slate-200 font-black text-sm uppercase hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                    >
                      <XCircle size={20} className="mr-2" /> {t("reject")}
                    </Button>
                    <Button 
                      onClick={() => handleAccept(req)} 
                      className="h-16 rounded-2xl font-black text-sm uppercase shadow-xl shadow-emerald-500/30 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <CheckCircle2 size={20} className="mr-2" /> {t("accept")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}
`;

// Replace the old Incoming Requests
content = content.replace(
  /\{\/\* Incoming Requests \*\/\}.*?\{\/\* Ongoing Ride - Prominent & Distinct \*\/\}/s,
  '{/* Ongoing Ride - Prominent & Distinct */}'
);

// We need to just slice from {/* Incoming Requests */} to the end of <main>
// Since it's easier to use a regex:
content = content.replace(
  /\{\/\* Incoming Requests \*\/\}[\s\S]*?(?=\s*<\/main>)/,
  newIncomingBlock
);


fs.writeFileSync(file, content);
console.log("Done");
