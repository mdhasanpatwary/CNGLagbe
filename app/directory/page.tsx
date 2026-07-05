"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { DriverDirectorySection } from "@/components/landing/DriverDirectorySection";
import { User } from "@/lib/types/user";

export default function DirectoryPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
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
        <DriverDirectorySection isLanding={false} />
      </main>
    </div>
  );
}
