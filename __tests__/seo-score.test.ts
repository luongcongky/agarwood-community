import { describe, it, expect } from "vitest"
import {
  countWords,
  stripHtml,
  extractH2,
  countImages,
  countImagesMissingAlt,
  countInternalLinks,
  countExternalLinks,
  containsAllWords,
  containsPhrase,
  countOccurrences,
  keywordDensity,
  firstNWords,
  scoreSeo,
} from "@/lib/seo/score"

describe("SEO scoring helpers", () => {
  it("countWords handles empty + whitespace", () => {
    expect(countWords("")).toBe(0)
    expect(countWords("   ")).toBe(0)
    expect(countWords("trầm hương")).toBe(2)
    expect(countWords("  trầm   hương  kỳ nam  ")).toBe(4)
  })

  it("stripHtml removes tags + decodes entities", () => {
    expect(stripHtml("<p>Trầm <b>hương</b></p>")).toBe("Trầm hương")
    expect(stripHtml("a &amp; b &nbsp; c")).toBe("a & b c")
    expect(stripHtml("<script>alert(1)</script>safe")).toBe("safe")
  })

  it("extractH2 returns inner text only", () => {
    const html = `<h2>Đầu tiên</h2><p>x</p><h2 class="x">Thứ hai</h2><h3>không</h3>`
    expect(extractH2(html)).toEqual(["Đầu tiên", "Thứ hai"])
  })

  it("countImages + missingAlt", () => {
    const html = `<img src="a.jpg" alt="A"><img src="b.jpg"><img src="c.jpg" alt="">`
    expect(countImages(html)).toBe(3)
    // empty alt counts as missing
    expect(countImagesMissingAlt(html)).toBe(2)
  })

  it("counts internal vs external links", () => {
    const html = `<a href="/tin-tuc/x">i</a><a href="https://wiki.org/x">e</a><a href="#sec">anchor</a><a href="//cdn.com">protorel</a>`
    expect(countInternalLinks(html)).toBe(1)
    expect(countExternalLinks(html)).toBe(1)
  })

  it("containsAllWords matches every word case-insensitively", () => {
    expect(containsAllWords("Cách phân biệt trầm hương kỳ nam thật giả", "trầm hương kỳ nam"))
      .toBe(true)
    expect(containsAllWords("Trầm hương Việt Nam", "trầm hương kỳ nam")).toBe(false)
    expect(containsAllWords("", "x")).toBe(false)
  })

  it("containsPhrase = exact substring match (case-insensitive)", () => {
    expect(containsPhrase("Cách phân biệt trầm hương kỳ nam", "trầm hương")).toBe(true)
    expect(containsPhrase("Trầm xanh, hương vàng", "trầm hương")).toBe(false)
  })

  it("keywordDensity = (occ × kwWords / totalWords) × 100", () => {
    // 100 words, "trầm hương" appears 3 times → density = 3 * 2 / 100 * 100 = 6%
    const text = ("trầm hương " + "abc ".repeat(33) + "trầm hương đẹp trầm hương ").trim()
    const total = countWords(text)
    expect(total).toBe(40)
    const occ = countOccurrences(text, "trầm hương")
    expect(occ).toBe(3)
    expect(keywordDensity(text, "trầm hương")).toBeCloseTo((3 * 2 * 100) / 40, 2)
  })

  it("firstNWords returns first n words joined", () => {
    expect(firstNWords("a b c d e", 3)).toBe("a b c")
    expect(firstNWords("", 3)).toBe("")
    expect(firstNWords("a", 0)).toBe("")
  })
})

// ─────────────────────────────────────────────────────────────────────────────

const longContent = (focus: string, totalWords: number) => {
  // Build content with focus at 4% density and an H2.
  const filler = "trầm hương Việt Nam là một loại nguyên liệu quý hiếm dùng làm hương liệu cao cấp ".repeat(20)
  const intro = `<p>${focus} là chủ đề quan trọng trong bài viết này, ${filler.slice(0, 100)}</p>`
  const body = `<h2>${focus} có giá trị kinh tế cao</h2><p>${filler}</p>`
  const repeats = ` ${focus} `.repeat(Math.floor(totalWords * 0.04 / 2))
  return intro + body + `<p>${filler}${repeats}</p>` + `<img src="x.jpg" alt="${focus}">`
}

describe("scoreSeo — full rubric", () => {
  it("perfect article scores high on all categories", () => {
    const focus = "trầm hương kỳ nam"
    const content = longContent(focus, 600) + `<a href="/tin-tuc/x">trong nội bộ</a><a href="/tin-tuc/y">khác</a><a href="https://wiki.org/x">ngoại</a>`

    const result = scoreSeo({
      title: `Hướng dẫn phân biệt ${focus} thật và giả từ A đến Z dành cho người mới`,
      excerpt: `Bài viết hướng dẫn chi tiết cách phân biệt ${focus} thật giả qua mùi hương màu sắc kết cấu và nguồn gốc xuất xứ giúp người mua tránh hàng nhái rất phổ biến trên thị trường hiện nay năm 2026 này.`,
      content,
      focusKeyword: focus,
      secondaryKeywords: ["mùi hương", "kết cấu"],
      coverImageUrl: "https://example.com/x.jpg",
      coverImageAlt: `Hình ảnh ${focus} loại 1`,
      slug: "huong-dan-phan-biet-tram-huong-ky-nam",
      previousTitles: [],
      translatedLocaleCount: 1,
    })

    // Should hit at least 70/100 on legacy (a generously-built test article)
    expect(result.legacyScore).toBeGreaterThanOrEqual(70)
    expect(result.legacyMax).toBe(100)
    expect(result.modernMax).toBe(32)
  })

  it("empty article scores low (only vacuous-pass checks earn points)", () => {
    const result = scoreSeo({
      title: "",
      excerpt: "",
      content: "",
      focusKeyword: "",
      secondaryKeywords: [],
    })
    // Empty title is "unique" against an empty list (2 pts) and the
    // total-density-cap check trivially passes when density is 0 (3 pts).
    // No modern criterion vacuously passes.
    expect(result.legacyScore).toBeLessThanOrEqual(5)
    expect(result.modernScore).toBe(0)
  })

  it("rolls over secondary-keyword points to focus when no secondary keywords", () => {
    const focus = "trầm hương"
    const content = longContent(focus, 500)

    const withSec = scoreSeo({
      title: `Hướng dẫn ${focus} cho người mới bắt đầu năm 2026 chi tiết nhất A đến Z`,
      excerpt: `Bài viết hướng dẫn ${focus} chi tiết bao gồm mùi hương kết cấu và cách nhận biết giúp người mua tránh hàng giả rất phổ biến hiện nay tại các thị trường lớn.`,
      content,
      focusKeyword: focus,
      secondaryKeywords: ["mùi hương"],
      slug: "tram-huong",
      coverImageAlt: focus,
    })
    const noSec = scoreSeo({
      title: `Hướng dẫn ${focus} cho người mới bắt đầu năm 2026 chi tiết nhất A đến Z`,
      excerpt: `Bài viết hướng dẫn ${focus} chi tiết bao gồm mùi hương kết cấu và cách nhận biết giúp người mua tránh hàng giả rất phổ biến hiện nay tại các thị trường lớn.`,
      content,
      focusKeyword: focus,
      secondaryKeywords: [],
      slug: "tram-huong",
      coverImageAlt: focus,
    })

    // Legacy max stays at 100 in both cases
    expect(withSec.legacyMax).toBe(100)
    expect(noSec.legacyMax).toBe(100)
    // Without secondary, fewer checks in result
    expect(withSec.checks.filter((c) => c.id.includes("secondary")).length)
      .toBeGreaterThan(noSec.checks.filter((c) => c.id.includes("secondary")).length)
  })

  it("flags duplicate title", () => {
    const focus = "trầm hương"
    const r = scoreSeo({
      title: "Tin về trầm hương",
      excerpt: "x",
      content: "<p>x</p>",
      focusKeyword: focus,
      secondaryKeywords: [],
      previousTitles: ["Tin về trầm hương"],
    })
    const dupCheck = r.checks.find((c) => c.id === "title.unique")!
    expect(dupCheck.passed).toBe(false)
    expect(dupCheck.earned).toBe(0)
  })

  it("density check fails when keyword appears too rarely", () => {
    // 500-word content, focus appears once → density = 1 * 2 / 500 * 100 = 0.4%
    const focus = "trầm hương"
    const text = `${focus} ` + "abc ".repeat(498)
    const r = scoreSeo({
      title: `Bài về ${focus}`,
      excerpt: focus,
      content: `<p>${text}</p>`,
      focusKeyword: focus,
      secondaryKeywords: [],
    })
    const c = r.checks.find((c) => c.id === "content.focusKwDensity")!
    expect(c.passed).toBe(false)
    expect(c.earned).toBe(0)
  })

  it("warns when total density exceeds 10%", () => {
    const focus = "trầm hương"
    // 50 words, 12 occurrences → density = 12*2/50*100 = 48%
    const text = (`${focus} `).repeat(12) + "abc ".repeat(26)
    const r = scoreSeo({
      title: `Bài về ${focus}`,
      excerpt: focus,
      content: `<p>${text}</p>`,
      focusKeyword: focus,
      secondaryKeywords: [],
    })
    const cap = r.checks.find((c) => c.id === "content.totalDensityCap")!
    expect(cap.passed).toBe(false)
  })

  it("modern: alt text + slug + length checks", () => {
    const r = scoreSeo({
      title: "Trầm hương kỳ nam Việt Nam — Hướng dẫn 2026 chi tiết A-Z",
      seoTitle: "Trầm hương kỳ nam Việt Nam — Hướng dẫn 2026 chi tiết A-Z",  // 56 chars
      seoDescription: "x".repeat(150), // in 140-160 range
      excerpt: "x".repeat(150),
      content: "<p>nội dung</p>",
      focusKeyword: "trầm hương kỳ nam",
      secondaryKeywords: [],
      coverImageAlt: "Trầm hương kỳ nam loại 1",
      slug: "tram-huong-ky-nam-viet-nam",
    })

    const altCheck = r.checks.find((c) => c.id === "modern.coverAltKw")!
    const slugCheck = r.checks.find((c) => c.id === "modern.slugKw")!
    const titleLen = r.checks.find((c) => c.id === "modern.seoTitleLength")!
    const descLen = r.checks.find((c) => c.id === "modern.seoDescLength")!

    expect(altCheck.passed).toBe(true)
    expect(slugCheck.passed).toBe(true)
    expect(titleLen.passed).toBe(true)
    expect(descLen.passed).toBe(true)
  })
})
