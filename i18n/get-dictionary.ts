import "server-only"
import type { Locale } from "./config"

const dictionaries = {
  vi: () => import("@/messages/vi.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
  zh: () => import("@/messages/zh.json").then((m) => m.default),
  ar: () => import("@/messages/ar.json").then((m) => m.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()

/** Type derived from the Vietnamese (default) dictionary */
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
