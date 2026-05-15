"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Navigation, Pin, Banknote, Clock, Route, CheckCircle2, X, LocateFixed, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/hooks/useLang";
import { COLORS } from "@/constants/colors";
import { cn } from "@/lib/utils";

import {
  saveBookingSession,
  getBookingSession,
  clearBookingSession,
} from "@/utils/bookingSession";
import { apiFetch } from "@/utils/api";

import { useQuery } from "@tanstack/react-query";

// Types
type Point = { lat: number; lng: number; address?: string };
type Step = "BOOKING" | "CONFIRM";

interface FareData {
  distance: number;
  fare: number;
  currency: string;
}

interface RouteInfo {
  distanceText: string;
  distanceKm: number;
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

  const [step, setStep] = useState<Step>("BOOKING");
  const [focusedInput, setFocusedInput] = useState<"PICKUP" | "DESTINATION">("PICKUP");
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
    if (step === "BOOKING" && focusedInput === "DESTINATION" && !destination && map) {
      // Zoom out or stay centered to let user pick
      map.setZoom(14);
    }
    if (step === "BOOKING" && focusedInput === "PICKUP" && pickup && map) {
      map.panTo(pickup);
      map.setZoom(15);
    }
  }, [step, map, pickup, destination, focusedInput]);

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

          await window.google.maps.importLibrary("marker");

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
              distanceKm: session.route.distanceKm,
              durationText: session.route.durationText,
              durationMinutes: session.route.durationMinutes ?? null,
              encodedPolyline: session.route.polyline,
            });
            restoredFromSession.current = true;
            setStep("CONFIRM");
            setToastVisible(true);
            setPickupSearchValue(restoredPickup.address || "");
            setDestSearchValue(restoredDrop.address || "");
            return;
          }

          // ── Normal block ──────────────────────────────────────────────────
          const handleGeoSuccess = async (position: GeolocationPosition) => {
            const pos: Point = { lat: position.coords.latitude, lng: position.coords.longitude };
            const address = await reverseGeocode(pos);
            pos.address = address;
            mapInstance.setCenter(pos);
            setPickup(pos);
            setPickupSearchValue(address);
          };

          const handleGeoError = async () => {
            console.log("Geolocation failed.");
            const pos: Point = { ...defaultLocation };
            const address = await reverseGeocode(pos);
            pos.address = address;
            mapInstance.setCenter(pos);
            setPickup(pos);
            setPickupSearchValue(address);
            setLocFallbackVisible(true);
            setTimeout(() => setLocFallbackVisible(false), 3500);
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

      // The marker will be updated/created by the useEffect monitoring the 'pickup' state.
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

      // The marker will be updated/created by the useEffect monitoring the 'destination' state.
      if (map) {
        map.panTo(pos);
        map.setZoom(16);
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
      if (step === "BOOKING") {
        initPickupAutocomplete();
        initDestAutocomplete();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step, map, initPickupAutocomplete, initDestAutocomplete]);

  // ─── Step navigation ──────────────────────────────────────────────────────
  const handleNextStep = async () => {
    if (step === "BOOKING" && pickup && destination) {
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
            distance: routeInfo?.distanceKm, // Pass road distance if available
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
            distance: routeInfo?.distanceKm, // Use accurate road distance
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
            setPickupSearchValue(address);
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

        if (step === "BOOKING") {
          if (!address) address = await reverseGeocode(pos);
          pos.address = address;
          clearBookingSession();
          restoredFromSession.current = false;
          setRouteInfo(null);

          if (focusedInput === "PICKUP") {
            setPickup(pos);
            setPickupSearchValue(address);
            if (!destination) setFocusedInput("DESTINATION");
          } else {
            setDestination(pos);
            setDestSearchValue(address);
          }
        }
      }
    );

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, [map, step, reverseGeocode, destination, focusedInput]);

  // ─── Update Markers ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !window.google) return;
    const update = async () => {
      if (!window.google?.maps?.importLibrary) return;
      const { AdvancedMarkerElement, PinElement } =
        (await window.google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

      const pinGreen = new PinElement({ background: COLORS.primary, borderColor: COLORS.pickupBorder, glyphColor: COLORS.glyph });
      const pinRed = new PinElement({ background: COLORS.drop, borderColor: COLORS.dropBorder, glyphColor: COLORS.glyph });

      if (pickup && !pickupMarkerRef.current) {
        const marker = new AdvancedMarkerElement({
          position: { lat: pickup.lat, lng: pickup.lng },
          map,
          title: t("pickup"),
          content: createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup'),
          gmpDraggable: step === "BOOKING",
        });
        marker.addListener("drag", () => handleMarkerDrag(marker, 'pickup', false));
        marker.addListener("dragend", () => handleMarkerDrag(marker, 'pickup', true));
        marker.content?.addEventListener("pointerdown", () => {
          if (step === "CONFIRM") {
            toast.info(t("click_edit_to_change"), { id: "edit-hint" });
          }
        });
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
          pickupMarkerRef.current.position = { lat: pickup.lat, lng: pickup.lng };
        }
        // Ensure it is attached to map
        if (pickupMarkerRef.current.map !== map) {
          pickupMarkerRef.current.map = map;
        }

        pickupMarkerRef.current.title = t("pickup");
        pickupMarkerRef.current.content = createLabeledMarker(pinGreen, t("pickup"), COLORS.primary, 'pickup');
        pickupMarkerRef.current.content?.addEventListener("pointerdown", () => {
          if (step === "CONFIRM") {
            toast.info(t("click_edit_to_change"), { id: "edit-hint" });
          }
        });
        pickupMarkerRef.current.gmpDraggable = step === "BOOKING";
      } else if (!pickup && pickupMarkerRef.current) {
        // Cleanup if pickup is cleared
        pickupMarkerRef.current.map = null;
        pickupMarkerRef.current = null;
      }

      if (destination && !destMarkerRef.current) {
        const marker = new AdvancedMarkerElement({
          position: { lat: destination.lat, lng: destination.lng },
          map,
          title: t("drop"),
          content: createLabeledMarker(pinRed, t("drop"), COLORS.drop, 'drop'),
          gmpDraggable: step === "BOOKING",
        });
        marker.addListener("drag", () => handleMarkerDrag(marker, 'drop', false));
        marker.addListener("dragend", () => handleMarkerDrag(marker, 'drop', true));
        marker.content?.addEventListener("pointerdown", () => {
          if (step === "CONFIRM") {
            toast.info(t("click_edit_to_change"), { id: "edit-hint" });
          }
        });
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
          destMarkerRef.current.position = { lat: destination.lat, lng: destination.lng };
        }
        // Ensure it is attached to map
        if (destMarkerRef.current.map !== map) {
          destMarkerRef.current.map = map;
        }

        destMarkerRef.current.title = t("drop");
        destMarkerRef.current.content = createLabeledMarker(pinRed, t("drop"), COLORS.drop, 'drop');
        destMarkerRef.current.content?.addEventListener("pointerdown", () => {
          if (step === "CONFIRM") {
            toast.info(t("click_edit_to_change"), { id: "edit-hint" });
          }
        });
        destMarkerRef.current.gmpDraggable = step === "BOOKING";
      } else if (!destination && destMarkerRef.current) {
        // Cleanup if destination is cleared
        destMarkerRef.current.map = null;
        destMarkerRef.current = null;
      }
    };
    update();
  }, [pickup, destination, map, reverseGeocode, createLabeledMarker, t, handleMarkerDrag, step]);

  // ─── Route Logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Clear route whenever we are NOT in the CONFIRM step
    if (step !== "CONFIRM") {
      clearRoute();
      return;
    }

    if (!map || !pickup || !destination) return;

    const fitToPoints = (pts: Point[]) => {
      const b = new window.google.maps.LatLngBounds();
      pts.forEach(p => b.extend(p));
      const isMobile = window.innerWidth < 768;
      const padding = isMobile
        ? { top: 100, right: 40, bottom: window.innerHeight * 0.6, left: 40 }
        : { top: 80, right: 80, bottom: 80, left: 420 };
      map.fitBounds(b, padding);
    };

    // Initial fit to pickup/destination
    fitToPoints([pickup, destination]);

    const drawPolyline = (path: google.maps.LatLng[], opacity: number) => {
      // Always clear the previous route before drawing a new one
      clearRoute();
      
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

    // ─── FIX: Use DirectionsService (stable API) instead of Routes API v2 ───
    // Routes API v2 (Route.computeRoutes) requires a mandatory `fields` header
    // that the JS SDK does not support, causing "not iterable" InvalidValueError.
    let isActive = true;

    async function callDirectionsAPI() {
      if (!isActive) return;
      try {
        const directionsService = new window.google.maps.DirectionsService();

        const result = await directionsService.route({
          origin: pickup!,
          destination: destination!,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });

        if (!isActive) return;

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

        // ─── Update bounds to actual route bounds ───
        if (route.bounds && map && isActive) {
          const isMobile = window.innerWidth < 768;
          const padding = isMobile
            ? { top: 100, right: 40, bottom: window.innerHeight * 0.6, left: 40 }
            : { top: 80, right: 80, bottom: 80, left: 420 };
          map.fitBounds(route.bounds, padding);
        }

        // Decode the overview polyline for drawing + storage
        const encodedPolyline = route.overview_polyline ?? "";
        const geometry = window.google.maps.geometry;
        if (isActive) {
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

        if (isActive) {
          const distanceKm = Number((distanceValue / 1000).toFixed(2));
          const newRouteInfo: RouteInfo = { 
            distanceText, 
            distanceKm,
            durationText, 
            durationMinutes, 
            encodedPolyline 
          };
          setRouteInfo(newRouteInfo);

          if (pickup && destination && fareData) {
            saveBookingSession({
              pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.address ?? "" },
              drop: { lat: destination.lat, lng: destination.lng, label: destination.address ?? "" },
              route: { polyline: encodedPolyline, distanceText, durationText, durationMinutes, distanceKm },
              fare: fareData.fare,
              lastUpdated: Date.now(),
            });
          }
        }
      } catch (err) {
        if (isActive) {
          console.error("Route calculation failed:", err);
        }
      }
    }

    if (restoredFromSession.current && routeInfo?.encodedPolyline) {
      try {
        const geometry = window.google.maps.geometry;
        if (geometry?.encoding) {
          const decodedPath = geometry.encoding.decodePath(routeInfo.encodedPolyline);
          drawPolyline(decodedPath, 0.85);
          // Once drawn from session, turn off the flag to prevent redundant draws if effect re-runs
          restoredFromSession.current = false;
        } else {
          drawPolyline([new google.maps.LatLng(pickup.lat, pickup.lng), new google.maps.LatLng(destination.lat, destination.lng)], 0.7);
          restoredFromSession.current = false;
        }
      } catch {
        restoredFromSession.current = false;
        callDirectionsAPI();
      }
      return;
    }

    callDirectionsAPI();


    return () => {
      isActive = false;
      clearRoute();
    };
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

      {/* ── Floating Back Button ────────────────────────────────────────────── */}
      <AppButton
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-40 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 text-slate-700 hover:bg-white transition-all p-0 flex items-center justify-center md:left-[420px]"
        variant="ghost"
      >
        <ArrowLeft size={20} />
      </AppButton>


      {/* ── Route pill (CONFIRM step, floats at map top-center) ──────────── */}
      {step === "CONFIRM" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-slate-100 flex items-center gap-2 max-w-[70vw] animate-in fade-in slide-in-from-top-2">
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

          {/* ── BOOKING STEP (Consolidated) ────────────────────────────────── */}
          {step === "BOOKING" && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">{t("book_your_cng")}</h2>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Route size={20} />
                </div>
              </div>

              {/* Combined inputs with vertical connector */}
              <div className="relative space-y-4 mb-6 pl-10">
                {/* Vertical connector line */}
                <div className="absolute left-[19px] top-[28px] bottom-[28px] w-0.5 border-l-2 border-dashed border-slate-200 z-0" />

                {/* Pickup Field */}
                <div className="relative">
                  <div className={cn(
                    "absolute -left-[26px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md z-10 transition-all duration-300",
                    focusedInput === "PICKUP" ? "bg-primary scale-110 ring-4 ring-primary/20" : "bg-slate-300"
                  )} />
                  <div className="relative group">
                    <div className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
                      focusedInput === "PICKUP" ? "text-primary" : "text-slate-400"
                    )}>
                      <MapPin size={18} />
                    </div>
                    <input
                      ref={pickupSearchRef}
                      type="text"
                      value={pickupSearchValue}
                      onFocus={() => setFocusedInput("PICKUP")}
                      onChange={(e) => setPickupSearchValue(e.target.value)}
                      placeholder={t("hero_pickup_ph") as string}
                      className={cn(
                        "w-full pl-11 pr-20 py-4 rounded-2xl border-2 transition-all text-sm font-bold",
                        focusedInput === "PICKUP"
                          ? "border-primary/30 bg-primary/5 text-slate-800 shadow-sm"
                          : "border-slate-100 bg-slate-50/50 text-slate-500"
                      )}
                      autoComplete="off"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {pickupSearchValue && (
                        <AppButton
                          onClick={() => { setPickupSearchValue(""); setPickup(null); pickupSearchRef.current?.focus(); }}
                          className="text-slate-400 hover:text-slate-600 p-2 h-9 w-9 border-none transition-all cursor-pointer"
                          variant="ghost"
                          leftIcon={<X size={16} />}
                        />
                      )}
                      <AppButton
                        onClick={handleUseCurrentLocation}
                        className={cn(
                          "p-2 h-9 w-9 rounded-xl border-none transition-all cursor-pointer",
                          !pickup?.address ? "text-primary bg-primary/10 animate-pulse" : "text-slate-400 hover:text-primary hover:bg-primary/5"
                        )}
                        variant="ghost"
                        leftIcon={<LocateFixed size={18} />}
                      />
                    </div>
                  </div>
                </div>

                {/* Destination Field */}
                <div className="relative">
                  <div className={cn(
                    "absolute -left-[26px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-sm border-2 border-white shadow-md z-10 transition-all duration-300",
                    focusedInput === "DESTINATION" ? "bg-red-500 scale-110 ring-4 ring-red-500/20" : "bg-slate-300"
                  )} />
                  <div className="relative group">
                    <div className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300",
                      focusedInput === "DESTINATION" ? "text-red-500" : "text-slate-400"
                    )}>
                      <Navigation size={18} />
                    </div>
                    <input
                      ref={destSearchRef}
                      type="text"
                      value={destSearchValue}
                      onFocus={() => setFocusedInput("DESTINATION")}
                      onChange={(e) => setDestSearchValue(e.target.value)}
                      placeholder={t("hero_dest_ph") as string}
                      className={cn(
                        "w-full pl-11 pr-12 py-4 rounded-2xl border-2 transition-all text-sm font-bold",
                        focusedInput === "DESTINATION"
                          ? "border-red-200 bg-red-50/30 text-slate-800 shadow-sm"
                          : "border-slate-100 bg-slate-50/50 text-slate-500"
                      )}
                      autoComplete="off"
                    />
                    {destSearchValue && (
                      <AppButton
                        onClick={() => { setDestSearchValue(""); setDestination(null); destSearchRef.current?.focus(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 h-9 w-9 border-none cursor-pointer"
                        variant="ghost"
                        leftIcon={<X size={16} />}
                      />
                    )}
                  </div>
                </div>
              </div>


              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                {t("tap_map_hint")}
              </p>

              <AppButton
                className="w-full h-16 rounded-2xl shadow-xl text-lg font-black bg-primary hover:bg-primary-dark transition-all"
                onClick={handleNextStep}
                disabled={!pickup || !destination}
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
                    setStep("BOOKING");
                    setFocusedInput("DESTINATION");
                  }}
                  className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors h-auto border-none"
                  variant="ghost"
                >
                  {t("edit_route")}
                </AppButton>
              </div>

              {/* Route summary */}
              <div className="flex items-start gap-4 mb-5 bg-slate-50 rounded-2xl px-4 py-4">
                <div className="flex flex-col items-center gap-1 mt-1.5 shrink-0 w-6">
                  <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-sm" />
                  <div className="w-0.5 h-10 border-l-2 border-dashed border-slate-200" />
                  <div className="w-3 h-3 rounded-sm bg-red-500 border-2 border-white shadow-sm" />
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


