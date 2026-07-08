"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { DriverDirectorySection } from "@/components/landing/DriverDirectorySection";
import { User } from "@/lib/types/user";

interface DirectoryPageClientProps {
  initialUser: User | null;
}

export default function DirectoryPageClient({ initialUser }: DirectoryPageClientProps) {
  const [user, setUser] = useState<User | null>(initialUser);

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
        <DriverDirectorySection isLanding={false} initialUser={user} />
      </main>
    </div>
  );
}
