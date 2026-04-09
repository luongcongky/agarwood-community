import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "linear-gradient(135deg, #1a5632, #2d7a4a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 48, color: "#fff", fontWeight: 700, fontFamily: "serif", letterSpacing: -2 }}>
          TH
        </span>
        <span style={{ fontSize: 11, color: "#a3d9b1", fontWeight: 500, letterSpacing: 1 }}>
          AGARWOOD
        </span>
      </div>
    ),
    { ...size },
  )
}
