import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/60", className)}
      {...props}
    />
  );
}

function SkeletonCircle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("rounded-full", className)} {...props} />;
}

function SkeletonLine({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("h-4 w-full rounded-lg", className)} {...props} />;
}

function SkeletonBlock({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("rounded-2xl", className)} {...props} />;
}

export { Skeleton, SkeletonCircle, SkeletonLine, SkeletonBlock };
