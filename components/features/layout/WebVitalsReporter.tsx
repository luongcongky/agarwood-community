"use client"

import { useEffect } from "react"
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals"

/** Client-only Core Web Vitals reporter.
 *
 *  - LCP (Largest Contentful Paint) — Google ranking signal, target < 2.5s
 *  - INP (Interaction to Next Paint) — replaces FID in 2024, target < 200ms
 *  - CLS (Cumulative Layout Shift) — target < 0.1
 *  - FCP / TTFB — diagnostic only
 *
 *  Metrics go to Google Analytics 4 as events so the standard
 *  "Web Vitals" report in GA4 shows them. In development (no GA_ID), we
 *  just console.log — good enough for local tuning.
 *
 *  Note: web-vitals only fires once per page load per metric; the hooks
 *  internally handle the timing semantics (INP fires on unload, LCP on
 *  the largest paint, CLS accumulates until navigate, etc).
 */
export function WebVitalsReporter() {
  useEffect(() => {
    const send = (metric: Metric) => {
      // GA4 — use its custom event format so it aggregates under Web Vitals.
      // Values are millisecond floats except CLS (unitless) — GA expects
      // integers, so we round. `nonInteraction: true` prevents bouncing
      // the session's engagement flag.
      const w = window as unknown as { gtag?: (...args: unknown[]) => void }
      if (typeof w.gtag === "function") {
        w.gtag("event", metric.name, {
          event_category: "Web Vitals",
          event_label: metric.id,
          value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
          metric_rating: metric.rating,
          non_interaction: true,
        })
      } else if (process.env.NODE_ENV !== "production") {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), `(${metric.rating})`)
      }
    }

    onCLS(send)
    onLCP(send)
    onINP(send)
    onFCP(send)
    onTTFB(send)
  }, [])

  return null
}
