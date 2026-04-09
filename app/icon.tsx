import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: "linear-gradient(135deg, #1a5632, #2d7a4a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        <span style={{ color: "#fff", fontWeight: 700, fontFamily: "serif", letterSpacing: -1 }}>
          TH
        </span>
      </div>
    ),
    { ...size },
  )
}
