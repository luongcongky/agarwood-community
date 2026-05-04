import Link from "next/link"
import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLocale, getTranslations } from "next-intl/server"
import { localize } from "@/i18n/localize"
import type { Locale } from "@/i18n/config"
import { LeadershipTabsV2, type LeaderItem } from "./LeadershipTabsV2"
import { MembersScrollV2, type MemberItem } from "./MembersScrollV2"
import { HeroAnimations } from "./HeroAnimations"
import { getStaticTexts } from "@/lib/static-texts"
import "./styles.css"

export const revalidate = 600

/** Leaders + VIP/INFINITE members — cùng cache key với /gioi-thieu (v1)
 *  để chia sẻ cache 10 phút giữa 2 route. Tags giống nhau → revalidate
 *  một chỗ refresh cả hai. */
const getLeadersAndMembers = unstable_cache(
  () =>
    Promise.all([
      prisma.leader.findMany({
        where: { isActive: true },
        orderBy: [{ term: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          name: true, name_en: true, name_zh: true, name_ar: true,
          honorific: true, honorific_en: true, honorific_zh: true, honorific_ar: true,
          title: true, title_en: true, title_zh: true, title_ar: true,
          workTitle: true, workTitle_en: true, workTitle_zh: true, workTitle_ar: true,
          bio: true, bio_en: true, bio_zh: true, bio_ar: true,
          photoUrl: true,
          term: true,
          category: true,
          user: { select: { avatarUrl: true, bio: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ["VIP", "INFINITE"] }, isActive: true },
        orderBy: [
          { contributionTotal: "desc" },
          { displayPriority: "desc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          company: {
            select: { name: true, logoUrl: true, representativePosition: true },
          },
        },
      }),
    ]),
  ["gioi-thieu_leaders_members"],
  { revalidate: 600, tags: ["gioi-thieu", "leaders", "members"] },
)

export async function generateMetadata() {
  const t = await getTranslations("about")
  return {
    title: t("metaTitle"),
    description: t("metaDesc"),
  }
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hội Trầm Hương Việt Nam",
  alternateName: "VAWA — Vietnam Agarwood Association",
  url: "https://hoitramhuong.vn",
  logo: "https://hoitramhuong.vn/logo.png",
  foundingDate: "2010-01-11",
  description:
    "Tổ chức xã hội nghề nghiệp kết nối, phát triển cộng đồng doanh nghiệp trầm hương Việt Nam.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Số 150, Đường Lý Chính Thắng, Phường Xuân Hòa",
    addressLocality: "Thành phố Hồ Chí Minh",
    postalCode: "700000",
    addressCountry: "VN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+84-913-810-060",
      contactType: "Chairman",
      email: "hoitramhuongvietnam2010@gmail.com",
    },
    {
      "@type": "ContactPoint",
      telephone: "+84-938-334-647",
      contactType: "Vice Chairman",
    },
  ],
  sameAs: ["https://www.facebook.com/hoitramhuongvietnam.org"],
}

const FOUNDING_YEAR = 2010

export default async function GioiThieuV2Page() {
  const locale = (await getLocale()) as Locale

  const [rawLeaders, rawMembers, t] = await Promise.all([
    getLeadersAndMembers().then((res) => res[0]),
    getLeadersAndMembers().then((res) => res[1]),
    getStaticTexts("about", locale),
  ])
  const totalMemberCount = rawMembers.length

  const currentTerm = rawLeaders[0]?.term ?? null
  const l = <T extends Record<string, unknown>>(record: T, field: string) =>
    localize(record, field, locale) as string | null

  const allLeaders: LeaderItem[] = rawLeaders.map((leader) => ({
    id: leader.id,
    name: l(leader, "name") ?? leader.name,
    honorific: l(leader, "honorific"),
    title: l(leader, "title") ?? leader.title,
    titleVi: leader.title,
    workTitle: l(leader, "workTitle"),
    bio: l(leader, "bio") ?? leader.user?.bio ?? null,
    photoUrl: leader.photoUrl ?? leader.user?.avatarUrl ?? null,
    term: leader.term,
    category: leader.category as "BTV" | "BCH" | "BKT" | "HDTD",
  }))
  // Chỉ hiển thị nhiệm kỳ hiện tại
  const currentLeaders = allLeaders.filter((l) => l.term === currentTerm)
  const currentLeaderCount = currentLeaders.length

  const members: MemberItem[] = rawMembers.map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatarUrl ?? m.company?.logoUrl ?? null,
    companyName: m.company?.name ?? null,
    position: m.company?.representativePosition ?? null,
  }))

  const yearsActive = new Date().getFullYear() - FOUNDING_YEAR

  return (
    <div className="gtv2-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* 1. HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-rings" />
        <div className="hero-logo">
          <img src="/logo.png" alt="Logo Hội Trầm Hương Việt Nam — VAWA" />
        </div>
        <div className="hero-inner">
          <div className="eyebrow hero-eyebrow">
            {t("heroEyebrow")}
          </div>
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: t("heroTitle") }} />
          <p className="hero-sub">
            {t("heroSub")}
          </p>
          <div className="hero-logo hero-logo-mobile">
            <img src="/logo.png" alt="Logo Hội Trầm Hương Việt Nam — VAWA" />
          </div>
          <div className="hero-meta">
            <div className="hero-meta-item">
              <div className="hero-meta-label">Thành lập</div>
              <div className="hero-meta-value">11 · 01 · 2010</div>
            </div>
            <div className="hero-meta-item">
              <div className="hero-meta-label">Trụ sở</div>
              <div className="hero-meta-value">Thành phố Hồ Chí Minh</div>
            </div>
            <div className="hero-meta-item">
              <div className="hero-meta-label">Phạm vi</div>
              <div className="hero-meta-value">Toàn quốc</div>
            </div>
          </div>
        </div>
        <div className="hero-scroll">Cuộn xuống</div>
      </section>

      {/* 2. STATS */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat reveal">
            <div className="stat-num" data-counter={String(yearsActive)}>
              <em>+</em>
            </div>
            <div className="stat-label">Năm hoạt động</div>
          </div>
          <div className="stat reveal">
            <div className="stat-num" data-counter={String(totalMemberCount)}>
              <em>+</em>
            </div>
            <div className="stat-label">Hội viên</div>
          </div>
          <div className="stat reveal">
            <div className="stat-num" data-counter={String(currentLeaderCount)}></div>
            <div className="stat-label">Lãnh đạo</div>
          </div>
          <div className="stat reveal">
            <div className="stat-num" data-counter="4"></div>
            <div className="stat-label">Ngôn ngữ</div>
          </div>
        </div>
      </section>

      {/* 3. INTRO */}
      <section className="section intro">
        <div className="container">
          <div className="intro-grid">
            <div className="intro-text reveal reveal-from-bottom">
              <div className="eyebrow">{t("introEyebrow")}</div>
              <h2 className="display-1" dangerouslySetInnerHTML={{ __html: t("introTitle") }} />
              <p className="lead" dangerouslySetInnerHTML={{ __html: t("introLead1") }} />
              <p className="lead" dangerouslySetInnerHTML={{ __html: t("introLead2") }} />
              <blockquote className="intro-quote">
                &ldquo;{t("introQuote")}&rdquo;
              </blockquote>
            </div>
            <div className="intro-image reveal reveal-from-right">
              <img src="/rung-gio-bau.jpg" alt="Rừng gió bầu" />
              <div className="intro-image-tag">Rừng gió bầu</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LEADERSHIP */}
      <section className="section leadership">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Ban lãnh đạo Hội</div>
            <h2 className="display-1" style={{ marginTop: "1.25rem" }}>
              Những người <em>dẫn dắt</em>
            </h2>
          </div>
          <LeadershipTabsV2 leaders={currentLeaders} />
        </div>
      </section>

      {/* 5. ORG CHART */}
      <section className="section org">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Cơ cấu tổ chức</div>
            <h2 className="display-1" style={{ marginTop: "1.25rem" }}>
              {t("orgTitle")}
            </h2>
            <p className="lead" style={{ marginTop: "1.25rem", color: "var(--gray-500)" }}>
              {t("orgSub")}
            </p>
          </div>

          <div className="org-tree reveal">
            <div className="org-node primary">Đại hội</div>
            <div className="org-line"></div>
            <div className="org-node accent">Ban Chấp hành</div>
            <div className="org-line"></div>
            <div className="org-node">Ban Thường vụ</div>
            <div className="org-line"></div>
            <div className="org-row">
              <div className="org-leaf">
                <div className="org-line"></div>
                <div className="org-node">Ban Kiểm tra</div>
              </div>
              <div className="org-leaf">
                <div className="org-line"></div>
                <div className="org-node">Văn phòng &amp; Chuyên môn</div>
              </div>
              <div className="org-leaf">
                <div className="org-line"></div>
                <div className="org-node">Tổ chức trực thuộc</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MEMBERS */}
      <section className="section members">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Cộng đồng hội viên</div>
            <h2 className="display-1" style={{ marginTop: "1.25rem" }}>
              Quy tụ <em>tinh hoa</em>
            </h2>
            <p className="lead" style={{ marginTop: "1.25rem", color: "var(--gray-500)" }}>
              {totalMemberCount} hội viên VIP · doanh nghiệp · nghệ nhân từ khắp Việt Nam
            </p>
          </div>
          <MembersScrollV2 members={members} totalCount={totalMemberCount} />
        </div>
      </section>

      {/* 7. CONTACT */}
      <section className="section contact">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow">Địa chỉ trụ sở</div>
            <h2 className="display-1" style={{ marginTop: "1.25rem" }}>
              Đến <em>thăm</em> chúng tôi
            </h2>
          </div>
          <div className="contact-grid">
            <div className="contact-map reveal">
              <iframe
                src="https://www.google.com/maps?q=10.785890,106.684595&hl=vi&z=18&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title="Bản đồ trụ sở Hội Trầm Hương Việt Nam"
              />
            </div>
            <div className="contact-card reveal">
              <div className="eyebrow">VAWA</div>
              <h3>Hội Trầm Hương Việt Nam</h3>
              <ul className="contact-list">
                <li>
                  <div className="ic">◎</div>
                  <div>Số 150, Lý Chính Thắng, P. Xuân Hoà, TP. HCM</div>
                </li>
                <li>
                  <div className="ic">☏</div>
                  <div>0913 810 060 · 0938 334 647</div>
                </li>
                <li>
                  <div className="ic">✉</div>
                  <div>hoitramhuongvietnam2010@gmail.com</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA */}
      <section className="cta">
        <div className="cta-bg" />
        <div className="cta-inner reveal">
          <div className="eyebrow">{t("ctaEyebrow")}</div>
          <h2 dangerouslySetInnerHTML={{ __html: t("ctaTitle") }} />
          <p>{t("ctaDesc")}</p>
          <Link href="/dang-ky" className="btn">
            Trở thành hội viên
          </Link>
        </div>
      </section>

      <HeroAnimations />
    </div>
  )
}

