import Link from "next/link"

interface SocialLinksProps {
  facebookUrl?: string | null
  youtubeUrl?: string | null
  /** "navbar" = brand-200 hover brand-300, "footer" = brand-300 hover brand-400 */
  variant?: "navbar" | "footer"
}

// Inline SVG để tránh phụ thuộc lucide-react v1.7 (không có brand icons)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function SocialLinks({ facebookUrl, youtubeUrl, variant = "navbar" }: SocialLinksProps) {
  if (!facebookUrl && !youtubeUrl) return null

  const colorClass =
    variant === "navbar"
      ? "text-brand-200 hover:text-brand-300 hover:bg-brand-700"
      : "text-brand-300 hover:text-brand-400"

  return (
    <div className="flex items-center gap-1" aria-label="Mạng xã hội">
      {facebookUrl && (
        <Link
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${colorClass}`}
        >
          <FacebookIcon className="h-5 w-5" />
        </Link>
      )}
      {youtubeUrl && (
        <Link
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${colorClass}`}
        >
          <YoutubeIcon className="h-5 w-5" />
        </Link>
      )}
    </div>
  )
}
