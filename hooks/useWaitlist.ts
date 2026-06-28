import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { waitlistSchema, WaitlistInput } from "@/lib/schemas/waitlist";
import { useLang } from "@/hooks/useLang";
import { toast } from "sonner";

export function useWaitlist() {
  const { t } = useLang();
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<WaitlistInput>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      name: "",
      phone: "",
      role: "USER"
    }
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedRole = watch("role");

  // Fetch count
  const fetchCount = async () => {
    try {
      const res = await fetch("/api/waitlist");
      if (res.ok) {
        const data = await res.json();
        setWaitlistCount(data.count);
      }
    } catch (e) {
      console.error("Count fetch error:", e);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  const onSubmit = async (data: WaitlistInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setWaitlistCount(result.count);
        setHasJoined(true);
        toast.success(t("waitlist_success"));
        reset();
      } else {
        const errData = await res.json();
        if (res.status === 409 || errData.error === "DUPLICATE_PHONE") {
          toast.error(t("waitlist_duplicate"));
        } else {
          toast.error(t("error") || "An error occurred");
        }
      }
    } catch (error) {
      console.error("Waitlist join error:", error);
      toast.error(t("network_error") || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    waitlistCount,
    isSubmitting,
    hasJoined,
    register,
    handleSubmit: handleSubmit(onSubmit),
    setValue,
    selectedRole,
    errors
  };
}
