import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
