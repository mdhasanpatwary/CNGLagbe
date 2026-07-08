"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contributedDriverSchema, ContributedDriverInput } from "@/lib/schemas/contributed-driver";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";
import { TextKey } from "@/constants/text";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types/user";

export interface ContributedDriver {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  nearbyBazar: string | null;
  vehicleType: string;
  contributorName?: string | null;
  contributorHash?: string | null;
  contributorPhotoUrl?: string | null;
}

export interface LeaderboardEntry {
  name: string;
  phone: string;
  photoUrl: string | null;
  count: number;
  hash: string;
}

interface UseDriverDirectoryOptions {
  isLanding?: boolean;
  initialUser?: User | null;
}

export function useDriverDirectory({ isLanding = false, initialUser }: UseDriverDirectoryOptions) {
  const { t } = useLang();
  const [drivers, setDrivers] = useState<ContributedDriver[]>([]);
  const [selectedBazar, setSelectedBazar] = useState("ALL");
  const [selectedVehicleType, setSelectedVehicleType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Leaderboard states
  const [activeTab, setActiveTab] = useState<"DRIVERS" | "LEADERBOARD">("DRIVERS");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<{ name: string; hash: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<ContributedDriver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [overallCount, setOverallCount] = useState<number | null>(null);

  const currentUser = initialUser ?? null;

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContributedDriverInput>({
    resolver: zodResolver(contributedDriverSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      nearbyBazar: "",
      vehicleType: "CNG",
      contributorName: "",
      contributorPhone: "",
      contributorPhotoUrl: "",
    }
  });

  const watchedVehicleType = useWatch({
    control,
    name: "vehicleType",
    defaultValue: "CNG",
  });
  const watchedContributorPhotoUrl = useWatch({
    control,
    name: "contributorPhotoUrl",
    defaultValue: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSubmitModalOpen && currentUser) {
      setValue("contributorName", currentUser.name || "");
      setValue("contributorPhone", currentUser.phone || "");
      setValue("contributorPhotoUrl", currentUser.photoUrl || "");
    }
  }, [isSubmitModalOpen, currentUser, setValue]);

  const fetchLeaderboard = useCallback(async () => {
    setIsLeaderboardLoading(true);
    try {
      const res = await fetch("/api/contributed-drivers/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Leaderboard fetch error:", e);
    } finally {
      setIsLeaderboardLoading(false);
    }
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `contributor-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("drivers")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("drivers")
        .getPublicUrl(filePath);

      setValue("contributorPhotoUrl", publicUrl);
      toast.success(t("uploaded" as TextKey) || "Photo uploaded!");
    } catch (err) {
      console.error("Photo upload error:", err);
      toast.error(t("upload_failed" as TextKey) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LEADERBOARD") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard]);

  // Fetch Drivers based on filters
  const fetchDrivers = useCallback(async (pageNum: number, signal?: AbortSignal) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingNext(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedBazar !== "ALL") params.append("bazar", selectedBazar);
      if (selectedVehicleType !== "ALL") params.append("vehicleType", selectedVehicleType);
      if (searchQuery) params.append("search", searchQuery);
      if (selectedContributor) params.append("contributorHash", selectedContributor.hash);

      if (isLanding) {
        params.append("limit", "10");
        params.append("page", "1");
      } else {
        params.append("limit", "12");
        params.append("page", pageNum.toString());
      }

      const res = await fetch(`/api/contributed-drivers?${params.toString()}`, { signal });
      if (res.ok) {
        const total = res.headers.get("X-Total-Count");
        const overall = res.headers.get("X-Overall-Count");
        if (total !== null) setTotalCount(parseInt(total, 10));
        if (overall !== null) setOverallCount(parseInt(overall, 10));

        const data = await res.json();
        if (isLanding) {
          setDrivers(data);
          setHasMore(false);
        } else {
          if (pageNum === 1) {
            setDrivers(data);
          } else {
            setDrivers((prev) => [...prev, ...data]);
          }
          setHasMore(data.length === 12);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error(e);
      }
    } finally {
      if (!signal || !signal.aborted) {
        setIsLoading(false);
        setIsFetchingNext(false);
      }
    }
  }, [selectedBazar, selectedVehicleType, searchQuery, isLanding, selectedContributor]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isSubmitModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSubmitModalOpen]);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
    setHasMore(true);
  }, [selectedBazar, selectedVehicleType, searchQuery, selectedContributor]);

  // Fetch drivers on page or filter changes
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let handler: NodeJS.Timeout;

    if (page === 1) {
      handler = setTimeout(() => {
        fetchDrivers(1, controller.signal);
      }, 300);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDrivers(page, controller.signal);
    }

    return () => {
      if (handler) clearTimeout(handler);
      controller.abort();
    };
  }, [page, selectedBazar, selectedVehicleType, searchQuery, selectedContributor, fetchDrivers]);

  // Setup Intersection Observer for Infinite Scroll
  useEffect(() => {
    if (isLanding || !hasMore || isLoading || isFetchingNext || activeTab !== "DRIVERS") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLanding, hasMore, isLoading, isFetchingNext, activeTab]);

  const onSubmit = async (data: ContributedDriverInput) => {
    setIsSubmitting(true);
    try {
      if (currentUser) {
        data.contributorName = currentUser.name || "";
        data.contributorPhone = currentUser.phone || "";
        data.contributorPhotoUrl = currentUser.photoUrl || "";
      }

      const res = await fetch("/api/contributed-drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (res.ok) {
        toast.success(
          resData.autoApproved
            ? (t("success_contribute" as TextKey) || "Driver added successfully!")
            : (t("success_contribute_pending" as TextKey) || "Submitted for approval!")
        );
        reset();
        setIsSubmitModalOpen(false);
        fetchDrivers(1);
      } else if (resData.error === "PHONE_EXISTS") {
        toast.error(t("error_phone_exists" as TextKey) || "Phone number already exists!");
      } else {
        toast.error("Failed to add driver. Try again.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error submitting form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    setIsDeleting(true);
    const toastId = toast.loading(t("loading" as TextKey) || "Deleting...");
    try {
      const res = await fetch(`/api/contributed-drivers/${driverToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(t("delete_success" as TextKey) || "Driver deleted!", { id: toastId });
        setIsDeleteModalOpen(false);
        setDriverToDelete(null);
        fetchDrivers(1);
      } else {
        toast.error(t("delete_failed" as TextKey) || "Failed to delete driver.", { id: toastId });
      }
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("Error deleting driver.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    drivers,
    selectedBazar,
    setSelectedBazar,
    selectedVehicleType,
    setSelectedVehicleType,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    isSubmitting,
    mounted,
    setMounted,
    hasMore,
    isFetchingNext,
    activeTab,
    setActiveTab,
    leaderboard,
    isLeaderboardLoading,
    uploading,
    selectedContributor,
    setSelectedContributor,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    driverToDelete,
    setDriverToDelete,
    isDeleting,
    totalCount,
    overallCount,
    currentUser,
    observerRef,
    register,
    handleSubmit,
    control,
    reset,
    errors,
    watchedVehicleType,
    watchedContributorPhotoUrl,
    handlePhotoUpload,
    onSubmit,
    handleDeleteDriver,
    fetchDrivers,
  };
}
