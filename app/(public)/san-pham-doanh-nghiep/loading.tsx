import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-50">
      <div className="bg-brand-800 py-14 px-4 text-center">
        <Skeleton className="h-10 w-80 mx-auto bg-brand-700" />
        <Skeleton className="mt-3 h-4 w-96 mx-auto bg-brand-700" />
      </div>
      <div className="border-b border-brand-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-brand-200 overflow-hidden">
              <Skeleton className="h-52 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
