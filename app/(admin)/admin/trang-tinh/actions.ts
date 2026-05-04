"use server"

import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"

export async function saveStaticText(
  pageKey: string,
  itemKey: string,
  data: { value: string; value_en?: string; value_zh?: string; value_ar?: string }
) {
  try {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.staticPageConfig.upsert({
      where: { pageKey_itemKey: { pageKey, itemKey } },
      create: {
        pageKey,
        itemKey,
        value: data.value,
        value_en: data.value_en,
        value_zh: data.value_zh,
        value_ar: data.value_ar,
      },
      update: {
        value: data.value,
        value_en: data.value_en,
        value_zh: data.value_zh,
        value_ar: data.value_ar,
      },
    })

    // Revalidate affected pages
    revalidateTag(`static-text-${pageKey}`, "max")
    
    return { success: true }
  } catch (error) {
    console.error("Error saving static text:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
