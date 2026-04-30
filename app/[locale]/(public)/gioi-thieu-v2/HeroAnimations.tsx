"use client"

import { useEffect } from "react"

// HeroAnimations — client-side mount-only effects:
//   1. Stagger reveal-on-scroll: gán --i index cho mỗi .reveal trong sibling
//      group, observe IntersectionObserver, add .in khi vào viewport
//   2. Stat counter "nhảy nhảy": easeOutBack overshoot + scale pop pulse
//      (fix bug nodeValue cũ bằng cách inject text node trước <em>+</em>)
//
// Returns null — chỉ side effects DOM. Đặt một lần ở cuối page.tsx server
// component để bind sau khi HTML rendered.

const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function HeroAnimations() {
  useEffect(() => {
    // ── Stagger --i index cho mỗi .reveal theo sibling order ───────────────
    document.querySelectorAll<HTMLElement>(".gtv2-page .reveal").forEach((el) => {
      const parent = el.parentElement
      if (!parent) return
      const siblings = Array.from(parent.children).filter((c) =>
        c.classList.contains("reveal"),
      )
      const idx = siblings.indexOf(el)
      if (!el.style.getPropertyValue("--i")) {
        el.style.setProperty("--i", String(idx))
      }
    })

    // ── Reveal-on-scroll IO ─────────────────────────────────────────────────
    const revealIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in")
            revealIO.unobserve(e.target)
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    )
    document.querySelectorAll(".gtv2-page .reveal").forEach((el) => revealIO.observe(el))

    // ── Stat counter "nhảy nhảy" ────────────────────────────────────────────
    const counters = document.querySelectorAll<HTMLElement>(".gtv2-page [data-counter]")
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const target = parseInt(el.dataset.counter ?? "0", 10)
          const suffix = el.querySelector("em")
          if (suffix) suffix.remove()
          const textNode = document.createTextNode("0")
          el.insertBefore(textNode, el.firstChild)

          const duration = 1800
          const start = performance.now()
          let lastShown = -1

          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = easeOutBack(t)
            const value = Math.max(0, Math.round(target * eased))
            if (value !== lastShown) {
              lastShown = value
              textNode.nodeValue = String(value)
              el.classList.remove("pop")
              void el.offsetWidth
              el.classList.add("pop")
            }
            if (t < 1) {
              requestAnimationFrame(tick)
            } else {
              textNode.nodeValue = String(target)
              if (suffix) el.appendChild(suffix)
            }
          }
          requestAnimationFrame(tick)
          counterIO.unobserve(el)
        })
      },
      { threshold: 0.4 },
    )
    counters.forEach((c) => counterIO.observe(c))

    return () => {
      revealIO.disconnect()
      counterIO.disconnect()
    }
  }, [])

  return null
}
