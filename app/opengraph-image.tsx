import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Emmaashop — Boutique de mode & élégance africaine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image affichée en aperçu quand on partage le site (WhatsApp, Insta, Facebook…).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2D1B08 0%, #1A0800 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            borderRadius: 100,
            border: "7px solid #C9A84C",
          }}
        >
          <div style={{ fontSize: 130, fontStyle: "italic", color: "#EBCB74" }}>E</div>
        </div>
        <div style={{ marginTop: 44, fontSize: 92, fontWeight: 800, color: "#FFFDFB" }}>
          Emmaashop
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 30,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#C9A84C",
          }}
        >
          Mode &amp; élégance africaine
        </div>
      </div>
    ),
    { ...size }
  );
}
