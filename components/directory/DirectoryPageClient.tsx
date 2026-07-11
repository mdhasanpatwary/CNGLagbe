"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { DriverDirectorySection } from "@/components/landing/DriverDirectorySection";
import { useAuthUser } from "@/hooks/useAuthUser";

export default function DirectoryPageClient() {
  const { user, clearUser } = useAuthUser();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUser();
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header
        role="landing"
        variant="fixed"
        user={user}
        onLogout={handleLogout}
        className="py-2.5 shadow-sm"
        theme="light"
      />

      <main className="flex-1 pt-20 bg-slate-50">
        <DriverDirectorySection isLanding={false} initialUser={user} />
      </main>
    </div>
  );
}
