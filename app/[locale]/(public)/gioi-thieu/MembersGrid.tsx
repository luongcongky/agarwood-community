import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export type MemberItem = {
  id: string
  name: string
  avatarUrl: string | null
  companyName: string | null
  position: string | null
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase()
  return (
    <div
      className={cn(
        "w-full h-full bg-linear-to-br from-brand-700 to-brand-900 text-white font-bold",
        "flex items-center justify-center text-xl",
      )}
    >
      {initials}
    </div>
  )
}

function MemberCard({ member }: { member: MemberItem }) {
  return (
    <Link
      href={`/hoi-vien/${member.id}`}
      className="group text-left flex items-center gap-4 rounded-lg p-3 hover:bg-white/60 transition-colors w-full max-w-xs"
    >
      <div className="relative shrink-0 w-24 aspect-4/5 overflow-hidden rounded-md bg-brand-100">
        {member.avatarUrl ? (
          <Image
            src={member.avatarUrl}
            alt={member.name}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <InitialsAvatar name={member.name} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-bold text-brand-900 uppercase leading-tight group-hover:text-brand-700 whitespace-nowrap overflow-hidden text-ellipsis"
          title={member.name}
        >
          {member.name}
        </p>
        {member.position && (
          <p className="mt-1 text-xs font-semibold text-amber-700 leading-snug line-clamp-1">
            {member.position}
          </p>
        )}
        {member.companyName && (
          <p className="mt-1 text-xs font-medium text-brand-700 leading-snug line-clamp-2">
            {member.companyName}
          </p>
        )}
      </div>
    </Link>
  )
}

export function MembersGrid({ members }: { members: MemberItem[] }) {
  if (members.length === 0) return null
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-6xl mx-auto">
      {members.map((m) => (
        <div
          key={m.id}
          className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] flex justify-center"
        >
          <MemberCard member={m} />
        </div>
      ))}
    </div>
  )
}
