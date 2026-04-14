import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-brand-800 py-14 px-4 text-center">
        <Skeleton className="h-10 w-32 mx-auto bg-brand-700" />
        <Skeleton className="mt-3 h-4 w-72 mx-auto bg-brand-700" />
      </div>
      <div className="border-b border-brand-200 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Skeleton className="h-10 w-80" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-[400px] w-full rounded-xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-5 border-b border-brand-100">
                <Skeleton className="w-28 h-20 sm:w-36 sm:h-24 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
          <aside className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  )
}
