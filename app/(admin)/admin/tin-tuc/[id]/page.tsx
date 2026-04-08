"use client"

import dynamic from "next/dynamic"

const NewsEditor = dynamic(() => import("./NewsEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      Đang tải trình soạn thảo...
    </div>
  ),
})

export default function NewsEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <NewsEditor params={params} />
}
