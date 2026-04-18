"use client"

import { useTranslations } from "next-intl"

import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

export type LeaderItem = {
  id: string
  name: string
  honorific: string | null
  /** Localized title shown to the user. */
  title: string
  /** Original Vietnamese title — used as the language-agnostic key for rank
   *  detection (chairman / vice / member). Rank inference can't run on the
   *  translated title because "Chairman" / "会长" / "Chủ tịch" all differ. */
  titleVi: string
  workTitle: string | null
  bio: string | null
  photoUrl: string | null
  term: string
  category: "BTV" | "BCH" | "BKT"
}

type TabKey = "BTV" | "BCH" | "BKT"

const TAB_I18N_KEYS: Record<TabKey, "btv" | "bch" | "bkt"> = {
  BTV: "btv",
  BCH: "bch",
  BKT: "bkt",
}

// ── Helpers ────────────────────────────────────────────────────────────────

function rankFromTitle(title: string): "chairman" | "vice" | "member" {
  const t = title.toLowerCase()
  if (/^chủ tịch\b/.test(t)) return "chairman"
  if (/phó chủ tịch/.test(t)) return "vice"
  return "member"
}

function InitialsAvatar({ name, size }: { name: string; size: "lg" | "md" | "sm" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const sizeClasses = {
    lg: "text-4xl",
    md: "text-2xl",
    sm: "text-xl",
  }
  return (
    <div
      className={cn(
        "w-full h-full bg-linear-to-br from-brand-700 to-brand-900 text-white font-bold flex items-center justify-center",
        sizeClasses[size],
      )}
    >
      {initials}
    </div>
  )
}

// ── Card components ────────────────────────────────────────────────────────

function LeaderCard({
  leader,
  size,
  onClick,
}: {
  leader: LeaderItem
  size: "lg" | "md" | "sm"
  onClick: () => void
}) {
  // Tất cả level đều dùng cùng 1 cỡ ảnh (theo feedback)
  // Card width thì to hơn 1 chút cho chairman để text area rộng hơn.
  const cardWidth = {
    lg: "w-full max-w-sm",
    md: "w-full max-w-sm",
    sm: "w-full max-w-xs",
  }[size]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group text-left flex items-center gap-4 rounded-lg p-3 hover:bg-white/60 transition-colors",
        cardWidth,
      )}
    >
      {/* Ảnh — vuông 4:5, cỡ đồng nhất mọi level */}
      <div className="relative shrink-0 w-24 aspect-4/5 overflow-hidden rounded-md bg-brand-100">
        {leader.photoUrl ? (
          <Image
            src={leader.photoUrl}
            alt={leader.name}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <InitialsAvatar name={leader.name} size={size} />
        )}
      </div>

      {/* Info bên phải */}
      <div className="min-w-0 flex-1">
        {leader.honorific && (
          <p className="text-[11px] uppercase tracking-wider font-semibold text-brand-500">
            {leader.honorific}
          </p>
        )}
        <p
          className={cn(
            "text-sm font-bold text-brand-900 uppercase leading-tight group-hover:text-brand-700 whitespace-nowrap overflow-hidden text-ellipsis",
            leader.honorific ? "mt-0.5" : "",
          )}
          title={leader.name}
        >
          {leader.name}
        </p>
        <p className="mt-1.5 text-xs font-medium text-brand-700 leading-snug line-clamp-2">
          {leader.title}
        </p>
      </div>
    </button>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────

function LeaderModal({ leader, onClose }: { leader: LeaderItem; onClose: () => void }) {
  const t = useTranslations("leadershipTabs")
  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-brand-200 hover:bg-brand-100 transition-colors"
          aria-label={t("close")}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 p-6 md:p-8">
          <div className="relative w-full aspect-4/5 rounded-xl overflow-hidden bg-brand-100 shrink-0">
            {leader.photoUrl ? (
              <Image
                src={leader.photoUrl}
                alt={leader.name}
                fill
                sizes="240px"
                className="object-cover"
              />
            ) : (
              <InitialsAvatar name={leader.name} size="lg" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider font-semibold text-brand-500">
              {t(TAB_I18N_KEYS[leader.category])} · {leader.term}
            </p>
            <h3 className="mt-1 text-2xl sm:text-3xl font-bold text-brand-900 leading-tight">
              {leader.honorific ? `${leader.honorific} ` : ""}
              {leader.name}
            </h3>
            <p className="mt-2 text-base font-semibold text-amber-700">{leader.title}</p>
            {leader.workTitle && (
              <p className="mt-2 text-sm text-brand-600 leading-relaxed">{leader.workTitle}</p>
            )}

            {leader.bio ? (
              <div className="mt-5 pt-5 border-t border-brand-200">
                <p className="text-xs uppercase tracking-wider font-semibold text-brand-500 mb-2">
                  {t("biography")}
                </p>
                <div
                  className="prose prose-sm max-w-none text-brand-800 whitespace-pre-line leading-relaxed"
                >
                  {leader.bio}
                </div>
              </div>
            ) : (
              <div className="mt-5 pt-5 border-t border-brand-200">
                <p className="text-sm italic text-brand-400">
                  {t("bioUpdating")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function LeadershipTabs({ leaders }: { leaders: LeaderItem[] }) {
  const t = useTranslations("leadershipTabs")

  // Default tab — BTV if có, fallback sang tab đầu tiên có data
  const availableTabs = useMemo<TabKey[]>(() => {
    const all = new Set(leaders.map((l) => l.category))
    return (["BTV", "BCH", "BKT"] as TabKey[]).filter((t) => all.has(t))
  }, [leaders])

  const [activeTab, setActiveTab] = useState<TabKey>(availableTabs[0] ?? "BTV")
  const [selected, setSelected] = useState<LeaderItem | null>(null)

  const currentLeaders = useMemo(
    () => leaders.filter((l) => l.category === activeTab),
    [leaders, activeTab],
  )

  // Phân cấp — always infer from VI title so translated labels don't break it.
  const chairman = currentLeaders.find((l) => rankFromTitle(l.titleVi) === "chairman")
  const vicePresidents = currentLeaders.filter((l) => rankFromTitle(l.titleVi) === "vice")
  const members = currentLeaders.filter((l) => rankFromTitle(l.titleVi) === "member")

  const currentTerm = currentLeaders[0]?.term

  if (availableTabs.length === 0) {
    return (
      <div className="rounded-xl border border-brand-200 bg-white p-12 text-center text-brand-500 italic">
        {t("noLeadershipInfo")}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="border-b border-brand-200 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {availableTabs.map((tab) => {
            const count = leaders.filter((l) => l.category === tab).length
            const isActive = tab === activeTab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative px-5 py-3 text-sm font-semibold transition-colors whitespace-nowrap",
                  isActive
                    ? "text-brand-900"
                    : "text-brand-500 hover:text-brand-700",
                )}
              >
                {t(TAB_I18N_KEYS[tab])}{" "}
                <span
                  className={cn(
                    "ml-1 text-xs font-normal",
                    isActive ? "text-brand-600" : "text-brand-400",
                  )}
                >
                  ({count})
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-600 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {currentTerm && (
        <p className="text-center text-sm text-brand-500 -mt-4">{currentTerm}</p>
      )}

      {/* Chairman — nổi bật, đứng giữa */}
      {chairman && (
        <div className="flex justify-center">
          <LeaderCard leader={chairman} size="lg" onClick={() => setSelected(chairman)} />
        </div>
      )}

      {/* Vice presidents — flex-wrap center để hàng cuối luôn căn giữa */}
      {vicePresidents.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-5xl mx-auto">
          {vicePresidents.map((l) => (
            <div key={l.id} className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] flex justify-center">
              <LeaderCard leader={l} size="md" onClick={() => setSelected(l)} />
            </div>
          ))}
        </div>
      )}

      {/* Members — flex-wrap center */}
      {members.length > 0 && (
        <div>
          {(chairman || vicePresidents.length > 0) && (
            <div className="flex items-center gap-3 mb-6 mt-8">
              <div className="flex-1 h-px bg-brand-200" />
              <span className="text-xs uppercase tracking-wider font-semibold text-brand-500">
                {t("membersSection")}
              </span>
              <div className="flex-1 h-px bg-brand-200" />
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-6xl mx-auto">
            {members.map((l) => (
              <div
                key={l.id}
                className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] flex justify-center"
              >
                <LeaderCard leader={l} size="sm" onClick={() => setSelected(l)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selected && <LeaderModal leader={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
