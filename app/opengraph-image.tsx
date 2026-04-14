import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import path from "node:path"

/**
 * Open Graph image mặc định cho toàn site — hiển thị khi share URL vào
 * Facebook, Zalo, Messenger, Telegram, Discord, iMessage...
 *
 * Next.js tự pick file này và set og:image + twitter:image cho mọi route
 * (các route có opengraph-image.tsx riêng sẽ override).
 *
 * Tỉ lệ chuẩn OG: 1200×630 (1.91:1) — Facebook/Zalo không letterbox.
 */

export const runtime = "nodejs"
export const alt = "Hội Trầm Hương Việt Nam — Cộng đồng Doanh nghiệp Trầm Hương"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  // Đọc logo từ /public — base64 nhúng thẳng vào ImageResponse
  const logoBuffer = readFileSync(path.join(process.cwd(), "public/logo.png"))
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2d1f14 0%, #4a3421 50%, #2d1f14 100%)",
          padding: "60px 80px",
          gap: 60,
          position: "relative",
        }}
      >
        {/* Pattern decor — subtle gold accent lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 500,
            height: 500,
            background: "radial-gradient(circle at top right, rgba(212,165,116,0.15) 0%, transparent 60%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 500,
            height: 500,
            background: "radial-gradient(circle at bottom left, rgba(212,165,116,0.12) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Logo — circle white bg để làm nổi */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Logo" width={300} height={300} />
        </div>

        {/* Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#fff",
            flex: 1,
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: "#d4a574",
              letterSpacing: 4,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Vietnam Agarwood Association · VAWA
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              color: "#fff",
            }}
          >
            <span>Hội Trầm Hương</span>
            <span>Việt Nam</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.4,
              marginTop: 10,
            }}
          >
            Cộng đồng kết nối, chứng nhận và truyền thông sản phẩm trầm hương Việt Nam
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#d4a574",
              marginTop: 20,
              fontWeight: 500,
            }}
          >
            hoitramhuong.vn
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
