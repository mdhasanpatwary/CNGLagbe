"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Loader2 } from "lucide-react";

// Types
type Point = { lat: number; lng: number };
type Step = "PICKUP" | "DESTINATION" | "CONFIRM";

interface FareData {
  distance: number;
  fare: number;
  currency: string;
}

export default function UserMapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pickup, setPickup] = useState<Point | null>(null);
  const [destination, setDestination] = useState<Point | null>(null);
  const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
  const [destMarker, setDestMarker] = useState<google.maps.Marker | null>(null);
  
  const [step, setStep] = useState<Step>("PICKUP");
  const [fareData, setFareData] = useState<FareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Initialize Map
  useEffect(() => {
    // Check if API key exists
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.warn("GOOGLE MAPS API KEY is missing. Map will not load.");
      setMapError(true);
      // Dummy coords to bypass lock
      setPickup({ lat: 23.8103, lng: 90.4125 }); // Dhaka
      return;
    }

    const initMap = () => {
      try {
        // Default center: Dhaka, Bangladesh
        const defaultLocation = { lat: 23.8103, lng: 90.4125 };
        
        const mapInstance = new window.google.maps.Map(mapRef.current as HTMLElement, {
          center: defaultLocation,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
        });

        setMap(mapInstance);

        // Try HTML5 geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              mapInstance.setCenter(pos);
              setPickup(pos);
              
              const marker = new window.google.maps.Marker({
                position: pos,
                map: mapInstance,
                title: "Pickup",
                icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                draggable: true
              });
              
              marker.addListener('dragend', () => {
                const newPos = marker.getPosition();
                if(newPos) setPickup({ lat: newPos.lat(), lng: newPos.lng() });
              });
              
              setPickupMarker(marker);
            },
            () => {
              console.log("Geolocation failed or denied.");
            }
          );
        }

        // Click listener moved to separate useEffect to prevent stale state closures
      } catch (e) {
         setMapError(true);
      }
    };

    // Load Google Maps Script
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  // Handle Map Click Events with fresh state
  useEffect(() => {
    if (!map || !window.google) return;
    
    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };

      if (step === "PICKUP") {
         setPickup(pos);
      } else if (step === "DESTINATION") {
         setDestination(pos);
      }
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [map, step]);

  // Update Markers when state changes externally via click
  useEffect(() => {
    if (!map || !window.google) return;
    
    if (pickup && !pickupMarker) {
      const marker = new window.google.maps.Marker({
        position: pickup,
        map,
        title: "Pickup",
        icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        draggable: true,
      });
      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        if(p) setPickup({ lat: p.lat(), lng: p.lng() });
      });
      setPickupMarker(marker);
    } else if (pickup && pickupMarker) {
      pickupMarker.setPosition(pickup);
    }

    if (destination && !destMarker) {
      const marker = new window.google.maps.Marker({
        position: destination,
        map,
        title: "Destination",
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        draggable: true,
      });
      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        if(p) setDestination({ lat: p.lat(), lng: p.lng() });
      });
      setDestMarker(marker);
    } else if (destination && destMarker) {
      destMarker.setPosition(destination);
    }

  }, [pickup, destination, map, pickupMarker, destMarker]);

  const handleNextStep = async () => {
    if (step === "PICKUP" && pickup) {
      setStep("DESTINATION");
    } else if (step === "DESTINATION" && destination) {
      setLoading(true);
      try {
        const res = await fetch("/api/fare/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            pickupLat: pickup?.lat, pickupLng: pickup?.lng,
            destLat: destination.lat, destLng: destination.lng
          })
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
      setLoading(true);
      try {
        const res = await fetch("/api/booking/create", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             pickupLat: pickup?.lat, pickupLng: pickup?.lng,
             destLat: destination?.lat, destLng: destination?.lng,
             distance: fareData?.distance, fare: fareData?.fare
           })
        });
        const data = await res.json();
        if (data.booking?.id) {
           router.push(`/user/booking/${data.booking.id}`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col relative w-full overflow-hidden">
      {/* Map Container */}
      <div className="flex-1 w-full bg-slate-200 relative">
        <div ref={mapRef} className="w-full h-full" />
        
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-8 text-center px-4">
            <h3 className="text-red-500 font-bold mb-2">Map API Key Missing</h3>
            <p className="text-slate-500 text-sm mb-4">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to render map. UI continues without it in dummy simulation mode.</p>
            {step === "PICKUP" && (
               <button onClick={() => { setPickup({lat: 23.8, lng: 90.4}); setStep("DESTINATION"); }} className="btn-primary mb-2">Simulate Pickup Select</button>
            )}
            {step === "DESTINATION" && (
               <button onClick={() => { setDestination({lat: 23.9, lng: 90.5}); handleNextStep(); }} className="btn-primary">Simulate Dest Select</button>
            )}
          </div>
        )}
        
        {/* Back Button */}
        <button 
          onClick={() => step === "PICKUP" ? router.push("/") : setStep(step === "DESTINATION" ? "PICKUP" : "DESTINATION")}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md z-10 text-slate-800 font-bold w-10 h-10 flex items-center justify-center"
        >
          ←
        </button>
      </div>

      {/* Slide-up Container */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-20 pb-safe">
        
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>

        {step === "PICKUP" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Where are you?</h2>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <MapPin className="text-emerald-500" />
              <p className="text-sm font-medium text-slate-700">
                {pickup ? `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : "Select on map or wait for GPS..."}
              </p>
            </div>
            <button 
              onClick={handleNextStep} 
              disabled={!pickup}
              className="btn-primary disabled:opacity-50"
            >
              Confirm Pickup
            </button>
          </div>
        )}

        {step === "DESTINATION" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Where to?</h2>
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <MapPin className="text-red-500" />
              <p className="text-sm font-medium text-slate-700">
                {destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : "Tap map to select destination"}
              </p>
            </div>
            <button 
              onClick={handleNextStep} 
              disabled={!destination || loading}
              className="btn-primary flex justify-center items-center gap-2 disabled:opacity-50"
            >
               {loading && <Loader2 className="animate-spin w-5 h-5" />}
               Calculate Fare
            </button>
          </div>
        )}

        {step === "CONFIRM" && fareData && (
          <div>
            <h2 className="text-xl font-bold text-center mb-6">Ride Summary</h2>
            
            <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-6">
              <div>
                <p className="text-sm text-emerald-800 font-semibold uppercase tracking-wider mb-1">Fixed Fare</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-extrabold text-emerald-600">৳{fareData.fare}</span>
                   <span className="text-emerald-700 font-medium text-sm">BDT</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Distance</p>
                <p className="font-bold text-slate-700 text-lg">{fareData.distance} km</p>
              </div>
            </div>

            <button 
              onClick={handleNextStep} 
              disabled={loading}
              className="btn-primary flex justify-center items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin w-5 h-5" />}
              Confirm Booking
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
