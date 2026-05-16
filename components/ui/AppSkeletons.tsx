"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCircle, SkeletonLine, SkeletonBlock } from "@/components/ui/skeleton";

/**
 * HistoryListSkeleton
 * A premium list of history cards matching the dimensions of HistoryPage cards exactly.
 */
export function HistoryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-4">
            {/* Top row: date + status */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-7 h-7 rounded-xl" />
                <SkeletonLine className="w-24 h-3" />
              </div>
              <SkeletonLine className="w-16 h-5 rounded-full" />
            </div>
            
            {/* Route: pickup → drop */}
            <div className="flex flex-col gap-1.5 mb-3 pl-1">
              <div className="flex items-center gap-2">
                <SkeletonCircle className="w-2 h-2" />
                <SkeletonLine className="w-48 h-3" />
              </div>
              <div className="flex h-3 items-center ml-0.5">
                <div className="w-px h-full bg-slate-100" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonCircle className="w-2 h-2" />
                <SkeletonLine className="w-36 h-3" />
              </div>
            </div>
            
            {/* Bottom row: fare + cta */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <SkeletonLine className="w-20 h-5 rounded-lg" />
              <SkeletonLine className="w-16 h-3 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * StatsGridSkeleton
 * For dashboard info cards (Today's Trips, Earnings, Wallet).
 */
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-none bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-200/40 rounded-2xl overflow-hidden">
          <CardContent className="p-3 flex flex-col items-center text-center">
            <SkeletonLine className="w-12 h-2 mb-2" />
            <SkeletonLine className="w-10 h-5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * ActiveBookingSkeleton
 * For the ongoing ride banner/card.
 */
export function ActiveBookingSkeleton() {
  return (
    <Card className="border-none bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-12 h-12 rounded-2xl" />
            <div>
              <SkeletonLine className="w-28 h-3 mb-1.5" />
              <SkeletonLine className="w-20 h-2" />
            </div>
          </div>
          <SkeletonLine className="w-20 h-6 rounded-full" />
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="w-full h-16 rounded-2xl" />
          <div className="flex gap-2">
            <SkeletonBlock className="flex-1 h-14 rounded-2xl" />
            <SkeletonBlock className="flex-1 h-14 rounded-2xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * UserDashboardSkeleton
 * Matches the 4-column stats grid and large CTA button of the user dashboard.
 */
export function UserDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full">
      {/* Header Info */}
      <div className="flex flex-col gap-2">
        <SkeletonLine className="w-40 h-8" />
        <SkeletonLine className="w-28 h-3" />
      </div>
      
      {/* Book CNG CTA */}
      <SkeletonBlock className="w-full h-28 rounded-3xl" />

      {/* Stats Grid (4 columns) */}
      <div className="grid grid-cols-4 gap-2.5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <SkeletonLine className="w-8 h-2 mb-2" />
              <SkeletonLine className="w-10 h-5" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Recent History */}
      <div className="space-y-4">
        <SkeletonLine className="w-24 h-3 ml-1" />
        <HistoryListSkeleton count={3} />
      </div>
    </div>
  );
}

/**
 * DriverDashboardSkeleton
 * Matches the 3-column metrics, large toggle, and performance grid of the driver dashboard.
 */
export function DriverDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full">
      {/* Header Info */}
      <div className="flex flex-col gap-2">
        <SkeletonLine className="w-40 h-8" />
        <SkeletonLine className="w-28 h-3" />
      </div>
      
      {/* Metrics (3 columns) */}
      <StatsGridSkeleton />
      
      {/* Online Toggle Card */}
      <Card className="relative overflow-hidden border-none bg-white shadow-2xl shadow-slate-200/50 rounded-[2rem]">
        <CardContent className="p-8 flex flex-col items-center w-full">
          <SkeletonCircle className="w-10 h-10 mb-6" />
          <SkeletonLine className="w-40 h-8 mb-3" />
          <SkeletonLine className="w-32 h-3 mb-10" />
          <SkeletonBlock className="w-full h-20 rounded-2xl" />
        </CardContent>
      </Card>
      
      {/* Performance grid */}
      <div className="space-y-4">
        <SkeletonLine className="w-24 h-3 ml-1" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-24 rounded-2xl" />
          <SkeletonBlock className="h-24 rounded-2xl" />
          <SkeletonBlock className="h-24 rounded-2xl" />
          <SkeletonBlock className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * DriverHistorySkeleton
 * Combines stats grid and history list for the driver history page.
 */
export function DriverHistorySkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <CardContent className="p-3 flex flex-col items-center text-center">
              <SkeletonBlock className="w-7 h-7 rounded-lg mb-2" />
              <SkeletonLine className="w-14 h-2 mb-1" />
              <SkeletonLine className="w-10 h-4 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* List */}
      <HistoryListSkeleton count={3} />
    </div>
  );
}

/**
 * WalletSkeleton
 * Matches the balance card and transaction list of the wallet page.
 */
export function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 w-full">
      {/* Balance Card */}
      <Card className="border-none bg-slate-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <SkeletonBlock className="w-12 h-12 bg-white/10 rounded-2xl" />
            <SkeletonLine className="w-24 h-5 rounded-full bg-white/10" />
          </div>
          <div className="space-y-3">
            <SkeletonLine className="w-20 h-2 bg-white/10" />
            <SkeletonLine className="w-40 h-12 bg-white/20" />
          </div>
          <div className="mt-8 flex gap-4">
            <SkeletonBlock className="flex-1 h-14 bg-white/10 rounded-xl" />
            <SkeletonBlock className="w-14 h-14 bg-white/10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
      
      {/* Info Box */}
      <SkeletonBlock className="w-full h-16 rounded-2xl" />
      
      {/* Transactions History */}
      <div className="space-y-4">
        <div className="flex justify-between px-2">
          <SkeletonLine className="w-32 h-3" />
          <SkeletonLine className="w-16 h-3" />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none bg-white shadow-sm rounded-3xl overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <SkeletonBlock className="w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <SkeletonLine className="w-20 h-2" />
                    <SkeletonLine className="w-16 h-2" />
                  </div>
                  <div className="flex justify-between">
                    <SkeletonLine className="w-32 h-4" />
                    <SkeletonLine className="w-12 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ProfileSkeleton
 * Matches the user/driver profile page layout.
 */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 w-full">
      {/* Photo Section */}
      <div className="flex flex-col items-center">
        <SkeletonCircle className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl" />
        <SkeletonLine className="w-20 h-2 mt-4" />
      </div>
      
      {/* Form Fields */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonLine className="w-24 h-2 ml-1" />
            <SkeletonBlock className="w-full h-14 rounded-2xl" />
          </div>
        ))}
      </div>
      
      {/* Button */}
      <SkeletonBlock className="w-full h-16 rounded-2xl shadow-xl shadow-primary/10" />
    </div>
  );
}
