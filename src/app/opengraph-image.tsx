import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#16181d",
          color: "#e8eaed",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: "#ff6b35",
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 700 }}>KarbonRota</div>
        </div>
        <div style={{ fontSize: 32, color: "#9aa3b2", textAlign: "center", maxWidth: 900, padding: "0 40px" }}>
          AB müşterin karbon verini istiyor. Veremezsen varsayılan değerle fiyatlanırsın.
        </div>
        <div style={{ marginTop: 32, fontSize: 22, color: "#5b8dbe" }}>SKDM / CBAM Hazırlık Platformu</div>
      </div>
    ),
    { ...size }
  );
}
