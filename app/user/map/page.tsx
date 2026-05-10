"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Pin, Banknote, Clock, Route, CheckCircle2, Search, X, LocateFixed, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { useLang } from "@/hooks/useLang";
import { COLORS } from "@/constants/colors";

import {
  saveBookingSession,
  getBookingSession,
  clearBookingSession,
} from "@/utils/bookingSession";
import { apiFetch } from "@/utils/api";

import { useQuery } from "@tanstack/react-query";

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

// Primary route colour (matches globals.css primary)
const ROUTE_COLOR = COLORS.primary;
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
  const [toastVisible, setToastVisible] = useState(false);
  const [locFallbackVisible, setLocFallbackVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const restoredFromSession = useRef(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  // ─── Search input refs (for Places Autocomplete) ──────────────────────────
  const pickupSearchRef = useRef<HTMLInputElement>(null);
  const destSearchRef = useRef<HTMLInputElement>(null);
  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [pickupSearchValue, setPickupSearchValue] = useState("");
  const [destSearchValue, setDestSearchValue] = useState("");
  const geocodeCache = useRef<Record<string, string>>({});

  // ─── Step based camera movement ──────────────────────────────────────────
  useEffect(() => {
    if (isDraggingRef.current) return;
    if (step === "DESTINATION" && !destination && map) {
      // Zoom out or stay centered to let user pick
      map.setZoom(14);
    }
    if (step === "PICKUP" && pickup && map) {
      map.panTo(pickup);
      map.setZoom(15);
    }
  }, [step, map, pickup, destination]);

  // ─── React Query for Unified Sync (Auth + Active Booking) ─────────────────
  const { data: syncData } = useQuery({
    queryKey: ["syncData"],
    queryFn: async () => {
      const res = await apiFetch("/api/sync");
      if (res.status === 401) {
        router.push("/login");
        throw new Error("Unauthorized");
      }
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s
    staleTime: 5000,
  });

  useEffect(() => {
    if (syncData?.activeBooking?.id) {
      router.push(`/user/booking/${syncData.activeBooking.id}`);
    }
  }, [syncData, router]);

  // ─── Toast auto-dismiss ───────────────────────────────────────────────────
  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  // ─── Reverse geocode a lat/lng to a human-readable address ───────────────
  const reverseGeocode = useCallback(
    async (pos: Point): Promise<string> => {
      try {
        // Round to 4 decimal places (~11m precision) for caching
        const lat = Math.round(pos.lat * 10000) / 10000;
        const lng = Math.round(pos.lng * 10000) / 10000;
        const cacheKey = `${lat},${lng}`;
        
        if (geocodeCache.current[cacheKey]) {
          return geocodeCache.current[cacheKey];
        }

        let address = "";
        
        // Try client-side Google Maps Geocoder first (Best UX, uses Maps JS API quota)
        if (window.google?.maps?.Geocoder) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat: pos.lat, lng: pos.lng } });
            if (response.results && response.results.length > 0) {
              // Filter out plus_code results to get a more human-readable address
              const validResults = response.results.filter((r) => !r.types.includes('plus_code'));
              if (validResults.length > 0) {
                address = validResults[0].formatted_address;
              } else {
                address = response.results[0].formatted_address;
              }
            }
          } catch (geocoderErr) {
            console.warn("Client geocoder failed, falling back to API", geocoderErr);
          }
        }
        
        // Fallback to our backend API if client geocoder fails or isn't loaded
        if (!address) {
          try {
            const res = await apiFetch(`/api/geocode?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const data = await res.json();
              // Make sure the API didn't just return lat/lng
              if (data.address && !data.address.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
                address = data.address;
              }
            }
          } catch (apiErr) {
            console.warn("API geocode failed", apiErr);
          }
        }
        
        // Final fallback to lat, lng string
        if (!address) {
          address = `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
        } else {
          geocodeCache.current[cacheKey] = address;
        }
        
        return address;
      } catch (err) {
        console.error("Geocode error:", err);
        return `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
      }
    },
    []
  );

  const handleMarkerDrag = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement, type: 'pickup' | 'drop', isEnd: boolean) => {
      isDraggingRef.current = true;
      const p = marker.position;
      if (!p) {
        if (isEnd) setTimeout(() => { isDraggingRef.current = false; }, 100);
        return;
      }
      const latVal = typeof p.lat === "function" ? p.lat() : (p.lat as number);
      const lngVal = typeof p.lng === "function" ? p.lng() : (p.lng as number);
      const point: Point = { lat: latVal, lng: lngVal };

      const setFunc = type === 'pickup' ? setPickup : setDestination;

      // Update state without address to trigger loading spinner / update coordinates
      setFunc(point);

      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);

      if (isEnd) {
        // Immediate geocode on drop
        (async () => {
          try {
            const address = await reverseGeocode(point);
            clearBookingSession();
            restoredFromSession.current = false;
            setRouteInfo(null);
            setFunc({ ...point, address });
            if (type === 'pickup') setPickupSearchValue(address);
            else setDestSearchValue(address);
          } finally {
            setTimeout(() => { isDraggingRef.current = false; }, 100);
          }
        })();
      } else {
        // Debounced geocode while dragging
        dragTimeoutRef.current = setTimeout(async () => {
          const address = await reverseGeocode(point);
          setFunc({ ...point, address });
          if (type === 'pickup') setPickupSearchValue(address);
          else setDestSearchValue(address);
        }, 300);
      }
    },
    [reverseGeocode]
  );

  // ─── Branded Marker Content ───────────────────────────────────────────────
  const createLabeledMarker = useCallback((pin: google.maps.marker.PinElement, label: string, color: string, type: 'pickup' | 'drop') => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    
    const labelDiv = document.createElement("div");
    labelDiv.style.backgroundColor = color;
    labelDiv.style.color = COLORS.glyph;
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
    container.appendChild(pin);
    return container;
  }, []);


  // ─── Initialize Map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (map) return; // Prevent re-initialization on language change or other dependency updates

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("GOOGLE MAPS API KEY is missing.");
      setTimeout(() => {
        setMapError(true);
        setPickup({ lat: 23.0361, lng: 91.5194 });
      }, 0);
      return;
    }

    const initMapWrapper = async () => {
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

        const defaultLocation = { lat: 23.0361, lng: 91.5194 };

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
          setToastVisible(true);
          setPickupSearchValue(restoredPickup.address || "");
          setDestSearchValue(restoredDrop.address || "");

          const pinGreen = new PinElement({ background: COLORS.primary, borderColor: COLORS.pickupBorder, glyphColor: COLORS.glyph });
          const pickupM = new AdvancedMarkerElement({
            position: restoredPickup,
            map: mapInstance,
            title: t("pickup"),
            content: createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup'),
            gmpDraggable: true,
          });
          pickupM.addListener("drag", () => handleMarkerDrag(pickupM, 'pickup', false));
          pickupM.addListener("dragend", () => handleMarkerDrag(pickupM, 'pickup', true));
          pickupMarkerRef.current = pickupM;

          const pinRed = new PinElement({ background: COLORS.drop, borderColor: COLORS.dropBorder, glyphColor: COLORS.glyph });
          const dropM = new AdvancedMarkerElement({
            position: restoredDrop,
            map: mapInstance,
            title: t("drop"),
            content: createLabeledMarker(pinRed, t("drop"), COLORS.drop, 'drop'),
            gmpDraggable: true,
          });
          dropM.addListener("drag", () => handleMarkerDrag(dropM, 'drop', false));
          dropM.addListener("dragend", () => handleMarkerDrag(dropM, 'drop', true));
          destMarkerRef.current = dropM;
          return;
        }

        // ── Normal block ──────────────────────────────────────────────────
        const handleGeoSuccess = async (position: GeolocationPosition) => {
          const pos: Point = { lat: position.coords.latitude, lng: position.coords.longitude };
          pos.address = await reverseGeocode(pos);
          mapInstance.setCenter(pos);
          setPickup(pos);

          const pinGreen = new PinElement({ background: COLORS.primary, borderColor: COLORS.pickupBorder, glyphColor: COLORS.glyph });
          const marker = new AdvancedMarkerElement({
            position: pos,
            map: mapInstance,
            title: t("pickup"),
            content: createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup'),
            gmpDraggable: true,
          });
          marker.addListener("drag", () => handleMarkerDrag(marker, 'pickup', false));
          marker.addListener("dragend", () => handleMarkerDrag(marker, 'pickup', true));
          pickupMarkerRef.current = marker;
        };

        const handleGeoError = async () => {
          console.log("Geolocation failed.");
          const pos: Point = { ...defaultLocation };
          pos.address = await reverseGeocode(pos);
          mapInstance.setCenter(pos);
          setPickup(pos);
          setLocFallbackVisible(true);
          setTimeout(() => setLocFallbackVisible(false), 3500);

          const pinGreen = new PinElement({ background: COLORS.primary, borderColor: COLORS.pickupBorder, glyphColor: COLORS.glyph });
          const marker = new AdvancedMarkerElement({
            position: pos,
            map: mapInstance,
            title: t("pickup"),
            content: createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup'),
            gmpDraggable: true,
          });
          marker.addListener("drag", () => handleMarkerDrag(marker, 'pickup', false));
          marker.addListener("dragend", () => handleMarkerDrag(marker, 'pickup', true));
          pickupMarkerRef.current = marker;
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(handleGeoSuccess, handleGeoError, { timeout: 10000 });
        } else {
          void handleGeoError();
        }
      } catch (e) {
        console.error("Map initialization failed", e);
        setMapError(true);
      }
    };

      if (window.google?.maps && 'importLibrary' in window.google.maps) {
        initMap();
        return;
      }

      // Check if script already exists to avoid duplicates
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        // If script is already there but loading, wait for it
        if (window.google?.maps) {
           initMap();
        } else {
           existingScript.addEventListener('load', initMap);
        }
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker,geometry&v=weekly&loading=async`;
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    };

    initMapWrapper();
  }, [reverseGeocode, createLabeledMarker, t, handleMarkerDrag, map]); // Include t for proper dependency tracking

  // ─── Initialize Places Autocomplete for search inputs ────────────────────
  const initPickupAutocomplete = useCallback(() => {
    if (!pickupSearchRef.current || pickupAutocompleteRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;

    const ac = new window.google.maps.places.Autocomplete(pickupSearchRef.current, {
      componentRestrictions: { country: "BD" },
      fields: ["geometry", "formatted_address", "name"],
    });
    pickupAutocompleteRef.current = ac;

    ac.addListener("place_changed", async () => {
      const place = ac.getPlace();
      if (!place?.geometry?.location) return;

      const pos: Point = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || "",
      };

      // Move/create marker
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.position = pos;
      }
      if (map) {
        map.panTo(pos);
        map.setZoom(16);
      }

      clearBookingSession();
      restoredFromSession.current = false;
      setRouteInfo(null);
      setPickup(pos);
      setPickupSearchValue(pos.address || "");
    });
  }, [map]);

  const initDestAutocomplete = useCallback(() => {
    if (!destSearchRef.current || destAutocompleteRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;

    const ac = new window.google.maps.places.Autocomplete(destSearchRef.current, {
      componentRestrictions: { country: "BD" },
      fields: ["geometry", "formatted_address", "name"],
    });
    destAutocompleteRef.current = ac;

    ac.addListener("place_changed", async () => {
      const place = ac.getPlace();
      if (!place?.geometry?.location) return;

      const pos: Point = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || "",
      };

      // Move/create marker
      if (destMarkerRef.current) {
        destMarkerRef.current.position = pos;
      }
      if (map) {
        map.panTo(pos);
        map.setZoom(15);
      }

      clearBookingSession();
      restoredFromSession.current = false;
      setRouteInfo(null);
      setDestination(pos);
      setDestSearchValue(pos.address || "");
    });
  }, [map]);

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      if (step === "PICKUP") initPickupAutocomplete();
      if (step === "DESTINATION") initDestAutocomplete();
    }, 100);
    return () => clearTimeout(timer);
  }, [step, map, initPickupAutocomplete, initDestAutocomplete]);

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
      setIsSearching(true);
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
          router.push(`/user/booking/${data.bookingId}`);
        }
      } catch (e: unknown) {
        console.error(e);
        const err = e as { message?: string; status?: number };
        if (err.message?.includes("CANCEL_COOLDOWN") || err.status === 429) {
          toast.error(t("cancel_user_limit"));
        }
        setIsRequesting(false);
        setIsSearching(false);
      }
    }
  };

  const clearRoute = useCallback(() => {
    if (fallbackPolylineRef.current) {
      fallbackPolylineRef.current.setMap(null);
      fallbackPolylineRef.current = null;
    }
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !map) return;

    // Immediately trigger loading state
    setPickup(prev => prev ? { ...prev, address: undefined } : null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos: Point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.panTo(pos);
        map.setZoom(15);
        
        if (pickupMarkerRef.current) {
           pickupMarkerRef.current.position = pos;
        }

        pos.address = await reverseGeocode(pos);
        clearBookingSession();
        restoredFromSession.current = false;
        setRouteInfo(null);
        setPickup(pos);
        setPickupSearchValue(pos.address || "");
      },
      (err: GeolocationPositionError) => {
        console.warn("Geo error:", err.message || err);
        setLocFallbackVisible(true);
        setTimeout(() => setLocFallbackVisible(false), 3500);
        // Fallback to updating address for the current position anyway
        if (pickupMarkerRef.current?.position) {
          const p = pickupMarkerRef.current.position;
          const point: Point = { 
            lat: typeof p.lat === "function" ? p.lat() : (p.lat as number),
            lng: typeof p.lng === "function" ? p.lng() : (p.lng as number) 
          };
          reverseGeocode(point).then(address => {
            setPickup({ ...point, address });
          });
        }
      },
      { timeout: 10000, maximumAge: 0 }
    );
  }, [map, reverseGeocode]);



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

        let address = "";
        
        // Handle POI (Point of Interest) clicks
        const iconEvent = e as google.maps.MapMouseEvent & { placeId?: string; stop?: () => void };
        if (iconEvent.placeId && typeof iconEvent.stop === "function") {
          iconEvent.stop(); // Prevent the default Google Maps InfoWindow
          try {
            if (window.google?.maps?.places?.PlacesService) {
              const service = new window.google.maps.places.PlacesService(map);
              await new Promise<void>((resolve) => {
                service.getDetails({ placeId: iconEvent.placeId || "", fields: ['name', 'formatted_address'] }, (place, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    address = place.name || place.formatted_address || "";
                  }
                  resolve();
                });
              });
            }
          } catch (err) {
            console.error("Failed to fetch POI details:", err);
          }
        }

        if (step === "PICKUP") {
          if (!address) address = await reverseGeocode(pos);
          pos.address = address;
          clearBookingSession();
          restoredFromSession.current = false;
          setRouteInfo(null);
          setPickup(pos);
        } else if (step === "DESTINATION") {
          if (!address) address = await reverseGeocode(pos);
          pos.address = address;
          clearBookingSession();
          restoredFromSession.current = false;
          setRouteInfo(null);
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
        const pinGreen = new PinElement({ background: COLORS.primary, borderColor: COLORS.pickupBorder });
        const marker = new AdvancedMarkerElement({
          position: pickup,
          map,
          title: t("pickup"),
          content: createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup'),
          gmpDraggable: true,
        });
        marker.addListener("drag", () => handleMarkerDrag(marker, 'pickup', false));
        marker.addListener("dragend", () => handleMarkerDrag(marker, 'pickup', true));
        pickupMarkerRef.current = marker;
      } else if (pickup && pickupMarkerRef.current) {
        const curPos = pickupMarkerRef.current.position;
        let isSame = false;
        if (curPos) {
          const curLat = typeof curPos.lat === "function" ? curPos.lat() : (curPos.lat as number);
          const curLng = typeof curPos.lng === "function" ? curPos.lng() : (curPos.lng as number);
          isSame = Math.abs(curLat - pickup.lat) < 0.000001 && Math.abs(curLng - pickup.lng) < 0.000001;
        }
        if (!isSame) {
          pickupMarkerRef.current.position = pickup;
        }
        
        // Always update content to reflect language changes
        const pinGreen = new PinElement({ background: COLORS.primary, borderColor: COLORS.pickupBorder, glyphColor: COLORS.glyph });
        pickupMarkerRef.current.title = t("pickup");
        pickupMarkerRef.current.content = createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup');
      }

      if (destination && !destMarkerRef.current) {
        const pinRed = new PinElement({ background: COLORS.drop, borderColor: COLORS.dropBorder });
        const marker = new AdvancedMarkerElement({
          position: destination,
          map,
          title: t("drop"),
          content: createLabeledMarker(pinRed, t("drop"), COLORS.drop, 'drop'),
          gmpDraggable: true,
        });
        marker.addListener("drag", () => handleMarkerDrag(marker, 'drop', false));
        marker.addListener("dragend", () => handleMarkerDrag(marker, 'drop', true));
        destMarkerRef.current = marker;
      } else if (destination && destMarkerRef.current) {
        const curPos = destMarkerRef.current.position;
        let isSame = false;
        if (curPos) {
          const curLat = typeof curPos.lat === "function" ? curPos.lat() : (curPos.lat as number);
          const curLng = typeof curPos.lng === "function" ? curPos.lng() : (curPos.lng as number);
          isSame = Math.abs(curLat - destination.lat) < 0.000001 && Math.abs(curLng - destination.lng) < 0.000001;
        }
        if (!isSame) {
          destMarkerRef.current.position = destination;
        }

        // Always update content to reflect language changes
        const pinRed = new PinElement({ background: COLORS.drop, borderColor: COLORS.dropBorder, glyphColor: COLORS.glyph });
        destMarkerRef.current.title = t("drop");
        destMarkerRef.current.content = createLabeledMarker(pinRed, t("drop"), COLORS.drop, 'drop');
      }
    };
    update();
  }, [pickup, destination, map, reverseGeocode, createLabeledMarker, t, handleMarkerDrag]);

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

    // ─── FIX: Use DirectionsService (stable API) instead of Routes API v2 ───
    // Routes API v2 (Route.computeRoutes) requires a mandatory `fields` header
    // that the JS SDK does not support, causing "not iterable" InvalidValueError.
    async function callDirectionsAPI() {
      try {
        const directionsService = new window.google.maps.DirectionsService();

        const result = await directionsService.route({
          origin: pickup!,
          destination: destination!,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        if (!result.routes?.length) {
          console.error("Directions request returned no routes");
          drawPolyline(
            [new google.maps.LatLng(pickup!.lat, pickup!.lng), new google.maps.LatLng(destination!.lat, destination!.lng)],
            0.7
          );
          return;
        }

        const route = result.routes[0];
        const leg = route.legs[0];

        // Decode the overview polyline for drawing + storage
        const encodedPolyline = route.overview_polyline ?? "";
        const geometry = window.google.maps.geometry;
        if (geometry?.encoding && encodedPolyline) {
          drawPolyline(geometry.encoding.decodePath(encodedPolyline), 0.85);
        } else if (route.overview_path?.length) {
          drawPolyline(route.overview_path, 0.85);
        } else {
          drawPolyline(
            [new google.maps.LatLng(pickup!.lat, pickup!.lng), new google.maps.LatLng(destination!.lat, destination!.lng)],
            0.7
          );
        }

        // Distance
        const distanceValue = leg.distance?.value ?? (fareData?.distance ? fareData.distance * 1000 : 0);
        const distanceText = (distanceValue / 1000).toFixed(1) + " km";

        // Duration
        const durationSeconds = leg.duration?.value ?? 0;
        let durationMinutes: number | null = null;
        let durationText = "";
        if (durationSeconds > 0) {
          durationMinutes = Math.round(durationSeconds / 60);
          durationText =
            durationMinutes >= 60
              ? `${Math.floor(durationMinutes / 60)} h ${durationMinutes % 60} min`
              : `${durationMinutes} min`;
        }

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
      } catch (err) {
        console.error("Route calculation failed:", err);
      }
    }
  }, [step, map, pickup, destination, clearRoute, fareData, routeInfo?.encodedPolyline]);

  // Derive sheet height class per step (mobile bottom sheet vs desktop sidebar)
  const sheetHeight = step === "CONFIRM" ? "h-[56vh] md:h-full" : "h-[48vh] md:h-full";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900">
      {/* ── Full-screen map ───────────────────────────────────────────────── */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {mapError && (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100 p-8 text-center">
          <h3 className="text-red-500 font-bold mb-2">{t("map_error")}</h3>
          <p className="text-slate-500 text-sm mb-4">{t("sim_mode")}</p>
        </div>
      )}

      {/* ── Floating Header ─────────────────────────────────────────────────── */}
      <Header
        role="user"
        variant="floating"
        className="md:left-[420px] left-4 right-4"
        user={syncData?.user}
        onRecenter={() => { const p = pickup ?? destination; if (p) { map?.panTo(p); map?.setZoom(15); } }}
      />


      {/* ── Route pill (CONFIRM step, floats at map top-center) ──────────── */}
      {step === "CONFIRM" && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 max-w-[70vw] animate-in fade-in slide-in-from-top-2">
          <span className="text-[10px] font-black uppercase text-primary flex items-center gap-1">
            <MapPin size={10} /> {t("pickup")}
          </span>
          <span className="text-slate-300 text-xs">→</span>
          <span className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1">
            <Pin size={10} /> {t("drop")}
          </span>
        </div>
      )}

      {/* ── Session-restored toast ────────────────────────────────────────── */}
      {toastVisible && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4">
          <CheckCircle2 size={14} /> {t("restored_msg")}
        </div>
      )}

      {locFallbackVisible && (
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-40 bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4">
          <MapPin size={14} /> {t("loc_fallback")}
        </div>
      )}

      {/* ── Searching overlay (glass, appears after "Get Driver" tap) ─────── */}
      {isSearching && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          {/* Pulsing rings */}
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-32 h-32 rounded-full bg-primary/30 pulse-ring" />
            <div className="absolute w-32 h-32 rounded-full bg-primary/20 pulse-ring pulse-ring-delay-1" />
            <div className="absolute w-32 h-32 rounded-full bg-primary/10 pulse-ring pulse-ring-delay-2" />
            <div className="w-20 h-20 rounded-full bg-primary shadow-2xl flex items-center justify-center">
              <Navigation size={32} className="text-primary-foreground" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-xl font-black mb-2">{t("finding_nearby")}</p>
            <p className="text-white/70 text-sm font-medium">{t("requesting_booking")}</p>
          </div>
        </div>
      )}

      {/* ── Bottom Sheet (Mobile) / Sidebar (Desktop) ────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 right-0 md:top-0 md:right-auto md:w-[400px] md:rounded-none md:border-r md:border-slate-100 z-20 bg-white rounded-t-3xl shadow-2xl sheet-transition flex flex-col ${sheetHeight}`}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">

          {/* ── PICKUP STEP ─────────────────────────────────────────────── */}
          {step === "PICKUP" && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-900">{t("set_pickup_title")}</h2>
                <Badge className="bg-primary-light text-primary-dark border-none text-[10px] font-bold px-2 py-0.5">
                  {t("pickup")}
                </Badge>
              </div>

              {/* Pickup search */}
              <div className="relative mb-3">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                  <Search size={16} />
                </div>
                <input
                  ref={pickupSearchRef}
                  id="pickup-search-input"
                  type="text"
                  value={pickupSearchValue}
                  onChange={(e) => setPickupSearchValue(e.target.value)}
                  placeholder={t("type_location") as string}
                  className="w-full pl-10 pr-9 py-3.5 rounded-2xl border-2 border-primary/20 bg-primary/5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
                  autoComplete="off"
                />
                {pickupSearchValue && (
                  <AppButton
                    onClick={() => { setPickupSearchValue(""); pickupSearchRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 h-auto w-auto border-none"
                    aria-label="Clear"
                    variant="ghost"
                    leftIcon={<X size={14} />}
                  />
                )}
              </div>

              {/* Current location chip */}
              {pickup?.address ? (
                <AppButton
                  onClick={handleUseCurrentLocation}
                  className="w-full flex items-center justify-start text-left gap-3 bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors rounded-2xl px-4 py-3 mb-3 cursor-pointer active:scale-[0.98] h-auto"
                  variant="secondary"
                >
                  <LocateFixed size={16} className="text-primary shrink-0" />
                  <p className="text-sm font-semibold text-slate-700 truncate flex-1">{pickup.address}</p>
                  <span className="text-[9px] font-black uppercase text-primary-dark bg-primary/20 px-2 py-0.5 rounded-full shrink-0">
                    {t("use_current_loc")}
                  </span>
                </AppButton>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 mb-3">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-primary animate-spin shrink-0" />
                  <p className="text-sm font-semibold text-slate-400 truncate flex-1">{t("loading")}</p>
                </div>
              )}

              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                {t("tap_map_hint")}
              </p>

              <AppButton
                className="w-full h-14 rounded-2xl shadow-lg text-base font-bold"
                onClick={handleNextStep}
                disabled={!pickup}
              >
                {t("confirm_pickup")}
              </AppButton>
            </div>
          )}

          {/* ── DESTINATION STEP ─────────────────────────────────────────── */}
          {step === "DESTINATION" && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Back Button */}
              <div className="mb-4">
                <AppButton
                  onClick={() => setStep("PICKUP")}
                  className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors h-auto border-none inline-flex items-center -ml-1"
                  variant="ghost"
                  leftIcon={<ArrowLeft size={14} />}
                >
                  {t("back")}
                </AppButton>
              </div>

              {/* Mini pickup summary */}
              <div className="flex items-center gap-2 mb-4 px-0.5">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="w-0.5 h-5 bg-slate-200" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t("pickup")}</p>
                  <p className="text-xs font-semibold text-slate-600 truncate">{pickup?.address ?? "..."}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 mt-1.5 mb-0.5">{t("drop")}</p>
                  <p className="text-xs font-semibold text-slate-400 truncate">{destination?.address ?? t("tap_map_hint")}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 mb-4" />

              <h2 className="text-lg font-black text-slate-900 mb-3">{t("set_dest_title")}</h2>

              {/* Destination search */}
              <div className="relative mb-3">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none">
                  <Search size={16} />
                </div>
                <input
                  ref={destSearchRef}
                  id="destination-search-input"
                  type="text"
                  value={destSearchValue}
                  onChange={(e) => setDestSearchValue(e.target.value)}
                  placeholder={t("type_location") as string}
                  className="w-full pl-10 pr-9 py-3.5 rounded-2xl border-2 border-red-200 bg-red-50/40 text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                  autoComplete="off"
                  autoFocus
                />
                {destSearchValue && (
                  <AppButton
                    onClick={() => {
                      setDestSearchValue("");
                      setDestination(null);
                      if (destMarkerRef.current) {
                        destMarkerRef.current.map = null;
                        destMarkerRef.current = null;
                      }
                      destSearchRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 h-auto w-auto border-none"
                    aria-label="Clear"
                    variant="ghost"
                    leftIcon={<X size={14} />}
                  />
                )}
              </div>

              {!destination && (
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {t("tap_map_hint")}
                </p>
              )}

              <AppButton
                className="w-full h-14 rounded-2xl shadow-lg text-base font-bold mt-2"
                onClick={handleNextStep}
                disabled={!destination}
                loading={loading}
              >
                {t("calc_fare")}
              </AppButton>
            </div>
          )}

          {/* ── CONFIRM STEP ─────────────────────────────────────────────── */}
          {step === "CONFIRM" && fareData && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-900">{t("confirm_title")}</h2>
                <AppButton
                  onClick={() => {
                    clearRoute();
                    destAutocompleteRef.current = null;
                    setStep("DESTINATION");
                  }}
                  className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors h-auto border-none"
                  variant="ghost"
                >
                  {t("edit_route")}
                </AppButton>
              </div>

              {/* Route summary */}
              <div className="flex items-start gap-3 mb-5 bg-slate-50 rounded-2xl px-4 py-3">
                <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="w-0.5 h-8 bg-slate-300 border-dashed" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t("pickup")}</p>
                  <p className="text-sm font-semibold text-slate-800 mb-2 truncate">{pickup?.address ?? "..."}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">{t("drop")}</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{destination?.address ?? "..."}</p>
                </div>
              </div>

              {/* Fare card */}
              <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl px-5 pt-5 pb-4 mb-4 shadow-lg">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-primary-foreground/80 text-[11px] font-black uppercase tracking-wider mb-1">
                      {t("fixed_fare")}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{t("currency")}{fareData.fare}</span>
                      <span className="text-primary-foreground/60 text-sm font-bold">{t("bdt")}</span>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-none font-black text-[11px] px-3 py-1 gap-1.5">
                    <Banknote size={13} /> {t("cash")}
                  </Badge>
                </div>

                <div className="flex gap-4 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <Route size={14} className="text-primary-foreground/70" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-primary-foreground/60">{t("distance")}</p>
                      <p className="text-sm font-black text-white">
                        {routeInfo?.distanceText ?? `${fareData.distance} ${t("km_unit")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-primary-foreground/70" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-primary-foreground/60">{t("est_time")}</p>
                      <p className="text-sm font-black text-white">
                        ~{routeInfo?.durationMinutes ?? "?"} {t("min_unit")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Get Driver CTA */}
              <AppButton
                className="w-full h-16 rounded-2xl shadow-xl text-lg font-black bounce-soft"
                onClick={handleNextStep}
                loading={isRequesting}
                leftIcon={<Navigation size={22} />}
              >
                {t("confirm_find_driver")}
              </AppButton>

              <p className="text-center text-[10px] text-slate-400 font-medium mt-3">
                {t("pay_driver")}: {t("currency")}{fareData.fare} • {t("cash_only")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


