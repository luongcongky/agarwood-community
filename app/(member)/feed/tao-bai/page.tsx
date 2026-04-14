"use client"

import dynamic from "next/dynamic"

const PostEditor = dynamic(() => import("./PostEditor"), {
  ssr: false,
  loading: () => (
    <div className="py-12 text-center text-brand-400">
      Đang tải trình soạn thảo...
    </div>
  ),
})

export default function TaoBaiPage() {
  return <PostEditor />
}
