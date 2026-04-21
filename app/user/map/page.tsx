"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Search, Navigation, Pin, Banknote, Clock, Route, ChevronLeft, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLang } from "@/hooks/useLang";
import { StaticMap } from "@/components/StaticMap";
import {
  saveBookingSession,
  getBookingSession,
  clearBookingSession,
} from "@/utils/bookingSession";
import { apiFetch } from "@/utils/api";

// Types
type Point = { lat: number; lng: number; address?: string };
type Step = "PICKUP" | "DESTINATION" | "CONFIRM";

interface FareData {
  distance: number;
  fare: number;
  currency: string;
}

interface RouteInfo {
  distanceText: string;
  durationText: string;
  durationMinutes: number | null;
  encodedPolyline: string;
}

// Primary route colour (emerald-500)
const ROUTE_COLOR = "#10b981";
const ROUTE_WEIGHT = 5;

export default function UserMapPage() {
  const router = useRouter();
  const { t } = useLang();
  const mapRef = useRef<HTMLDivElement>(null);
  // Holds the route polyline drawn on the map
  const fallbackPolylineRef = useRef<google.maps.Polyline | null>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pickup, setPickup] = useState<Point | null>(null);
  const [destination, setDestination] = useState<Point | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [step, setStep] = useState<Step>("PICKUP");
  const [fareData, setFareData] = useState<FareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(false);

  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const restoredFromSession = useRef(false);

  // ─── Step based camera movement ──────────────────────────────────────────
  useEffect(() => {
    if (step === "DESTINATION" && !destination && map) {
      // Zoom out or stay centered to let user pick
      map.setZoom(14);
    }
    if (step === "PICKUP" && pickup && map) {
      map.panTo(pickup);
      map.setZoom(15);
    }
  }, [step, map, pickup, destination]);

  // ─── Check for active booking periodically ────────────────────────────────
  useEffect(() => {
    const checkActive = async () => {
      try {
        const res = await apiFetch("/api/booking/active");
        if (!res.ok) return;
        const data = await res.json();
        if (data.booking?.id) {
          router.push(`/user/booking/${data.booking.id}`);
        }
      } catch (e) {
        console.error("Failed to check active booking", e);
      }
    };
    checkActive();
    const intervalId = setInterval(checkActive, 10000); // Check every 10s
    return () => clearInterval(intervalId);
  }, [router]);

  // ─── Toast auto-dismiss ───────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionRestored) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToastVisible(true);
    const timer = setTimeout(() => setToastVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [sessionRestored]);

  // ─── Reverse geocode a lat/lng to a human-readable address ───────────────
  const reverseGeocode = useCallback(
    async (pos: Point): Promise<string> => {
      try {
        const res = await apiFetch(`/api/geocode?lat=${pos.lat}&lng=${pos.lng}`);
        if (!res.ok) throw new Error("Geocode API failed");
        const data = await res.json();
        return data.address;
      } catch (err) {
        console.error("Geocode error:", err);
        return `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
      }
    },
    []
  );

  // ─── Branded Marker Content ───────────────────────────────────────────────
  const createLabeledMarker = useCallback((pin: google.maps.marker.PinElement, label: string, color: string, type: 'pickup' | 'drop') => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    
    const labelDiv = document.createElement("div");
    labelDiv.style.backgroundColor = color;
    labelDiv.style.color = "white";
    labelDiv.style.padding = "2px 6px";
    labelDiv.style.borderRadius = "4px";
    labelDiv.style.fontSize = "10px";
    labelDiv.style.fontWeight = "bold";
    labelDiv.style.marginBottom = "4px";
    labelDiv.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    labelDiv.style.textTransform = "uppercase";
    labelDiv.style.letterSpacing = "0.05em";
    labelDiv.style.pointerEvents = "none";
    labelDiv.style.display = "flex";
    labelDiv.style.alignItems = "center";
    labelDiv.style.gap = "2px";
    
    const iconSpan = document.createElement("span");
    iconSpan.textContent = type === 'pickup' ? "📍" : "📌";
    labelDiv.appendChild(iconSpan);
    
    const textSpan = document.createElement("span");
    textSpan.textContent = label;
    labelDiv.appendChild(textSpan);
    
    container.appendChild(labelDiv);
    container.appendChild(pin.element);
    return container;
  }, []);


  // ─── Initialize Map ───────────────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("GOOGLE MAPS API KEY is missing.");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapError(true);
      setPickup({ lat: 23.8103, lng: 90.4125 });
      return;
    }

    const initMap = async () => {
      try {
        let attempts = 0;
        while (!window.google?.maps?.importLibrary && attempts < 10) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }

        if (!window.google?.maps?.importLibrary) {
          setMapError(true);
          return;
        }

        const { AdvancedMarkerElement, PinElement } =
          (await window.google.maps.importLibrary(
            "marker"
          )) as google.maps.MarkerLibrary;

        await window.google.maps.importLibrary("places");
        await window.google.maps.importLibrary("geometry");

        const defaultLocation = { lat: 23.8103, lng: 90.4125 };

        const mapInstance = new window.google.maps.Map(
          mapRef.current as HTMLElement,
          {
            center: defaultLocation,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
            gestureHandling: "greedy",
            mapId: "DEMO_MAP_ID",
          }
        );

        setMap(mapInstance);

        // ── Restore session block ──────────────────────────────────────────
        const session = getBookingSession();
        if (session) {
          const restoredPickup: Point = {
            lat: session.pickup.lat,
            lng: session.pickup.lng,
            address: session.pickup.label,
          };
          const restoredDrop: Point = {
            lat: session.drop.lat,
            lng: session.drop.lng,
            address: session.drop.label,
          };

          setPickup(restoredPickup);
          setDestination(restoredDrop);
          setFareData({
            distance: session.route.distanceKm,
            fare: session.fare,
            currency: "BDT",
          });
          setRouteInfo({
            distanceText: session.route.distanceText,
            durationText: session.route.durationText,
            durationMinutes: session.route.durationMinutes ?? null,
            encodedPolyline: session.route.polyline,
          });
          restoredFromSession.current = true;
          setStep("CONFIRM");
          setSessionRestored(true);

          const pinGreen = new PinElement({ background: "#10b981", borderColor: "#064e3b", glyphColor: "white" });
          const pickupM = new AdvancedMarkerElement({
            position: restoredPickup,
            map: mapInstance,
            title: t("pickup"),
            content: createLabeledMarker(pinGreen, t("pickup"), "#10b981", 'pickup'),
            gmpDraggable: true,
          });
          pickupM.addListener("dragend", async () => {
            const p = pickupM.position;
            if (p) {
              const latVal = typeof p.lat === "function" ? p.lat() : (p.lat as number);
              const lngVal = typeof p.lng === "function" ? p.lng() : (p.lng as number);
              const point: Point = { lat: latVal, lng: lngVal };
              point.address = await reverseGeocode(point);
              clearBookingSession();
              restoredFromSession.current = false;
              setRouteInfo(null);
              setSessionRestored(false);
              setPickup(point);
            }
          });
          pickupMarkerRef.current = pickupM;

          const pinRed = new PinElement({ background: "#ef4444", borderColor: "#7f1d1d", glyphColor: "white" });
          const dropM = new AdvancedMarkerElement({
            position: restoredDrop,
            map: mapInstance,
            title: t("drop"),
            content: createLabeledMarker(pinRed, t("drop"), "#ef4444", 'drop'),
            gmpDraggable: true,
          });
          dropM.addListener("dragend", async () => {
            const p = dropM.position;
            if (p) {
              const latVal = typeof p.lat === "function" ? p.lat() : (p.lat as number);
              const lngVal = typeof p.lng === "function" ? p.lng() : (p.lng as number);
              const point: Point = { lat: latVal, lng: lngVal };
              point.address = await reverseGeocode(point);
              clearBookingSession();
              restoredFromSession.current = false;
              setRouteInfo(null);
              setSessionRestored(false);
              setDestination(point);
            }
          });
          destMarkerRef.current = dropM;
          return;
        }

        // ── Normal block ──────────────────────────────────────────────────
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const pos: Point = { lat: position.coords.latitude, lng: position.coords.longitude };
              pos.address = await reverseGeocode(pos);
              mapInstance.setCenter(pos);
              setPickup(pos);

              const pinGreen = new PinElement({ background: "#10b981", borderColor: "#064e3b", glyphColor: "white" });
              const marker = new AdvancedMarkerElement({
                position: pos,
                map: mapInstance,
                title: t("pickup"),
                content: createLabeledMarker(pinGreen, t("pickup"), "#10b981", 'pickup'),
                gmpDraggable: true,
              });
              marker.addListener("dragend", async () => {
                const newPos = marker.position;
                if (newPos) {
                  const latVal = typeof newPos.lat === "function" ? newPos.lat() : (newPos.lat as number);
                  const lngVal = typeof newPos.lng === "function" ? newPos.lng() : (newPos.lng as number);
                  const p: Point = { lat: latVal, lng: lngVal };
                  p.address = await reverseGeocode(p);
                  clearBookingSession();
                  restoredFromSession.current = false;
                  setRouteInfo(null);
                  setSessionRestored(false);
                  setPickup(p);
                }
              });
              pickupMarkerRef.current = marker;
            },
            () => console.log("Geolocation failed.")
          );
        }
      } catch (e) {
        console.error("Map initialization failed", e);
        setMapError(true);
      }
    };

    if (!window.google?.maps?.importLibrary) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker,geometry&v=weekly&loading=async`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, [reverseGeocode, createLabeledMarker, t]);

  // ─── Step navigation ──────────────────────────────────────────────────────
  const handleNextStep = async () => {
    if (step === "PICKUP" && pickup) {
      setStep("DESTINATION");
    } else if (step === "DESTINATION" && destination) {
      setLoading(true);
      try {
        const res = await apiFetch("/api/fare/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupLat: pickup?.lat,
            pickupLng: pickup?.lng,
            destLat: destination.lat,
            destLng: destination.lng,
          }),
        });
        const data = await res.json();
        if (data.fare) {
          setFareData(data);
          setStep("CONFIRM");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    } else if (step === "CONFIRM") {
      setIsRequesting(true);
      try {
        const res = await apiFetch("/api/booking/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupLat: pickup?.lat,
            pickupLng: pickup?.lng,
            destLat: destination?.lat,
            destLng: destination?.lng,
            pickupAddress: pickup?.address,
            destAddress: destination?.address,
            polyline: routeInfo?.encodedPolyline,
          }),
        });
        const data = await res.json();
        if (data.booking?.id) {
          clearBookingSession();
          router.push(`/user/booking/${data.booking.id}`);
        } else if (data.bookingId) {
          // Exists already
          router.push(`/user/booking/${data.bookingId}`);
        }
      } catch (e: any) {
        console.error(e);
        if (e.message?.includes("CANCEL_COOLDOWN") || e.status === 429) {
          alert(t("cancel_user_limit"));
        }
        setIsRequesting(false);
      }
    }
  };

  const clearRoute = useCallback(() => {
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null);
      fallbackPolylineRef.current = null;
    }
  }, []);

  const handleBack = () => {
    if (step === "PICKUP") router.push("/");
    if (step === "DESTINATION") {
      setDestination(null);
      if (destMarkerRef.current) {
        destMarkerRef.current.map = null;
        destMarkerRef.current = null;
      }
      clearRoute();
      setStep("PICKUP");
    }
    if (step === "CONFIRM") {
      clearRoute();
      setStep("DESTINATION");
    }
  };

  // ─── Map click listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !window.google) return;

    const clickListener = map.addListener(
      "click",
      async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const pos: Point = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        };

        if (step === "PICKUP") {
          pos.address = await reverseGeocode(pos);
          clearBookingSession();
          restoredFromSession.current = false;
          setRouteInfo(null);
          setSessionRestored(false);
          setPickup(pos);
        } else if (step === "DESTINATION") {
          pos.address = await reverseGeocode(pos);
          clearBookingSession();
          restoredFromSession.current = false;
          setRouteInfo(null);
          setSessionRestored(false);
          setDestination(pos);
        }
      }
    );

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [map, step, reverseGeocode]);

  // ─── Update Markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !window.google) return;
    const update = async () => {
      if (!window.google?.maps?.importLibrary) return;
      const { AdvancedMarkerElement, PinElement } =
        (await window.google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

      if (pickup && !pickupMarkerRef.current) {
        const pinGreen = new PinElement({ background: "#10b981", borderColor: "#064e3b" });
        const marker = new AdvancedMarkerElement({
          position: pickup,
          map,
          title: t("pickup"),
          content: createLabeledMarker(pinGreen, t("pickup"), "#10b981", 'pickup'),
          gmpDraggable: true,
        });
        marker.addListener("dragend", async () => {
          const p = marker.position;
          if (p) {
            const point: Point = { 
              lat: typeof p.lat === "function" ? p.lat() : (p.lat as number),
              lng: typeof p.lng === "function" ? p.lng() : (p.lng as number) 
            };
            point.address = await reverseGeocode(point);
            clearBookingSession();
            restoredFromSession.current = false;
            setPickup(point);
          }
        });
        pickupMarkerRef.current = marker;
      } else if (pickup && pickupMarkerRef.current) {
        pickupMarkerRef.current.position = pickup;
      }

      if (destination && !destMarkerRef.current) {
        const pinRed = new PinElement({ background: "#ef4444", borderColor: "#7f1d1d" });
        const marker = new AdvancedMarkerElement({
          position: destination,
          map,
          title: t("drop"),
          content: createLabeledMarker(pinRed, t("drop"), "#ef4444", 'drop'),
          gmpDraggable: true,
        });
        marker.addListener("dragend", async () => {
          const p = marker.position;
          if (p) {
            const point: Point = { 
              lat: typeof p.lat === "function" ? p.lat() : (p.lat as number),
              lng: typeof p.lng === "function" ? p.lng() : (p.lng as number) 
            };
            point.address = await reverseGeocode(point);
            clearBookingSession();
            restoredFromSession.current = false;
            setDestination(point);
          }
        });
        destMarkerRef.current = marker;
      } else if (destination && destMarkerRef.current) {
        destMarkerRef.current.position = destination;
      }
    };
    update();
  }, [pickup, destination, map, reverseGeocode, createLabeledMarker, t]);

  // ─── Route Logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "CONFIRM" || !map || !pickup || !destination) {
      if (step !== "CONFIRM") clearRoute();
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(pickup);
    bounds.extend(destination);
    map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });

    const drawPolyline = (path: google.maps.LatLng[], opacity: number) => {
      const poly = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: ROUTE_COLOR,
        strokeOpacity: opacity,
        strokeWeight: ROUTE_WEIGHT,
        map,
      });
      fallbackPolylineRef.current = poly;
    };

    if (restoredFromSession.current && routeInfo?.encodedPolyline) {
      try {
        const geometry = window.google.maps.geometry;
        if (geometry?.encoding) {
          const decodedPath = geometry.encoding.decodePath(routeInfo.encodedPolyline);
          drawPolyline(decodedPath, 0.85);
        } else {
          drawPolyline([new google.maps.LatLng(pickup.lat, pickup.lng), new google.maps.LatLng(destination.lat, destination.lng)], 0.7);
        }
      } catch {
        restoredFromSession.current = false;
        callDirectionsAPI();
      }
      return;
    }

    callDirectionsAPI();

    function callDirectionsAPI() {
      const service = new window.google.maps.DirectionsService();
      service.route(
        { origin: pickup!, destination: destination!, travelMode: window.google.maps.TravelMode.DRIVING },
        (result, status) => {
          if (status === "OK" && result) {
            const leg = result.routes[0]?.legs[0];
            const encodedPolyline = result.routes[0]?.overview_polyline ?? "";
            const geometry = window.google.maps.geometry;
            if (geometry?.encoding && encodedPolyline) {
              drawPolyline(geometry.encoding.decodePath(encodedPolyline), 0.85);
            } else {
              drawPolyline([new google.maps.LatLng(pickup!.lat, pickup!.lng), new google.maps.LatLng(destination!.lat, destination!.lng)], 0.7);
            }

            const distanceText = leg?.distance?.text ?? `${fareData?.distance ?? ""} km`;
            const durationText = leg?.duration?.text ?? "";
            const durationMinutes = leg?.duration?.value ? Math.round(leg.duration.value / 60) : null;

            const newRouteInfo: RouteInfo = { distanceText, durationText, durationMinutes, encodedPolyline };
            setRouteInfo(newRouteInfo);

            if (pickup && destination && fareData) {
              saveBookingSession({
                pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.address ?? "" },
                drop: { lat: destination.lat, lng: destination.lng, label: destination.address ?? "" },
                route: { polyline: encodedPolyline, distanceText, durationText, durationMinutes, distanceKm: fareData.distance },
                fare: fareData.fare,
                lastUpdated: Date.now(),
              });
            }
          }
        }
      );
    }
  }, [step, map, pickup, destination, clearRoute, fareData, routeInfo?.encodedPolyline]);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-slate-50">
      <div className="order-1 md:order-2 flex-1 h-full relative bg-slate-200">
        <div ref={mapRef} className="w-full h-full" />
        
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-8 text-center px-4">
            <h3 className="text-red-500 font-bold mb-2">{t("map_error")}</h3>
            <p className="text-slate-500 text-sm mb-4">{t("sim_mode")}</p>
          </div>
        )}

        {/* Header Overlay */}
        <div className="absolute top-4 right-16 z-10 hidden md:block">
           <LanguageSwitcher />
        </div>

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10 flex flex-col items-center gap-1">
          <Button variant="outline" size="icon" onClick={handleBack} className="bg-white rounded-full shadow-md w-12 h-12">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <span className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] uppercase font-black text-slate-600 shadow-sm">{t("back")}</span>
        </div>

        {/* Recenter Button */}
        {map && (
          <div className="absolute top-4 right-4 z-10 flex flex-col items-center gap-1">
            <Button onClick={() => { const t = pickup ?? destination; if (t) { map.panTo(t); map.setZoom(15); } }} className="bg-white rounded-full w-12 h-12 shadow-md text-slate-600 hover:bg-slate-50" variant="outline">
               <Navigation size={20} />
            </Button>
            <span className="bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] uppercase font-black text-slate-600 shadow-sm">{t("recenter")}</span>
          </div>
        )}

        {/* Confirm Overlay */}
        {step === "CONFIRM" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-10 flex items-center gap-3 border border-slate-200 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase">
              <MapPin size={12} /> {t("pickup")}
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase">
              <Pin size={12} /> {t("drop")}
            </div>
          </div>
        )}

        {/* Restored Toast */}
        {toastVisible && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
            <CheckCircle2 size={14} /> {t("restored_msg")}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="order-2 md:order-1 w-full md:w-[320px] lg:w-[380px] h-auto max-h-[85vh] md:h-screen md:max-h-screen bg-white z-20 overflow-y-auto shadow-2xl md:shadow-none rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 md:hidden">
             <div className="w-12 h-1 bg-slate-200 rounded-full" />
             <LanguageSwitcher />
          </div>

          {step === "PICKUP" && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold mb-4">{t("current_loc")}</h2>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <MapPin className="text-emerald-500" size={18} />
                  <span className="text-[7px] font-black uppercase text-slate-400">{t("pickup")}</span>
                </div>
                <p className="text-sm font-bold text-slate-700 truncate">{pickup?.address ?? t("loading")}</p>
              </div>
              <Button size="lg" className="w-full h-14 rounded-xl shadow-lg text-lg" onClick={handleNextStep} disabled={!pickup}>
                {t("confirm_pickup")}
              </Button>
            </div>
          )}

          {step === "DESTINATION" && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold mb-4">{t("where_to")}</h2>
              
              {!destination ? (
                <div className="bg-slate-50 border-2 border-dashed border-emerald-200 rounded-2xl p-8 mb-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Pin size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">{t("tap_map_dest")}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6 flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <Pin className="text-red-500" size={18} />
                    <span className="text-[7px] font-black uppercase text-slate-400">{t("drop")}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 truncate">{destination.address ?? t("loading")}</p>
                </div>
              )}

              <Button size="lg" className="w-full h-14 rounded-xl shadow-lg text-lg" onClick={handleNextStep} disabled={!destination || loading}>
                {loading && <Loader2 className="animate-spin mr-2" />}
                {t("calc_fare")}
              </Button>
            </div>
          )}

          {step === "CONFIRM" && fareData && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold mb-6 text-slate-800">{t("booking_summary")}</h2>
              
              <div className="space-y-4 mb-8">
                <StaticMap 
                  lat={(pickup!.lat + destination!.lat) / 2} 
                  lng={(pickup!.lng + destination!.lng) / 2} 
                  zoom={12}
                  height={180}
                  className="mb-4"
                  markers={[
                    { lat: pickup!.lat, lng: pickup!.lng, color: "#10b981", label: "P" },
                    { lat: destination!.lat, lng: destination!.lng, color: "#ef4444", label: "D" }
                  ]}
                />
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <MapPin className="text-emerald-500" size={16} />
                    <span className="text-[7px] font-black uppercase text-emerald-600">{t("pickup")}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 truncate flex-1">{pickup?.address ?? "..."}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <Pin className="text-red-500" size={16} />
                    <span className="text-[7px] font-black uppercase text-red-600">{t("drop")}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 truncate flex-1">{destination?.address ?? "..."}</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Banknote size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider font-bold mb-1">{t("fixed_fare")}</span>
                      <div className="relative group">
                         <Info size={12} className="text-emerald-400 cursor-help" />
                         <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            {t("fare_tooltip")}
                         </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-emerald-600">{t("currency")}{fareData.fare}</span>
                      <span className="text-[10px] font-bold text-emerald-700/50 uppercase">{t("currency_name")}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white/80 border-emerald-200 text-emerald-700 font-bold px-3 py-1 uppercase text-[10px] gap-1.5">
                    <Banknote size={12} /> {t("cash")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200/50">
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 flex items-center gap-1 mb-1">
                       <Route size={10} /> {t("distance")}
                    </p>
                    <p className="text-lg font-black text-slate-800">{routeInfo?.distanceText ?? `${fareData.distance} ${t("km_unit")}`}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-slate-400 flex items-center gap-1 mb-1">
                       <Clock size={10} /> {t("est_time")}
                    </p>
                    <p className="text-lg font-black text-slate-800">~{routeInfo?.durationMinutes ?? "?"} {t("min_unit")}</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full h-16 rounded-2xl shadow-xl text-xl font-bold" onClick={handleNextStep} disabled={isRequesting}>
                {isRequesting ? <Loader2 className="animate-spin mr-2" /> : <Navigation size={20} className="mr-2" />}
                {isRequesting ? t("finding_driver") : t("confirm_find_driver")}
              </Button>
            </div>
          )}
        </div>
        <footer className="mt-auto p-6 text-center text-slate-300 text-[10px] font-medium tracking-widest uppercase">
          {t("app_name")} &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
