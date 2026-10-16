import { ImageResponse } from "next/og";

export const alt = "LocalPlate AI: recipes and meal plans from what you have";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Preview image used when the site is shared on WhatsApp, Facebook, X, etc.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background:
            "linear-gradient(135deg, #fff7ed 0%, #ffedd5 55%, #fed7aa 100%)",
          color: "#18181b",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 34,
            fontWeight: 700,
            color: "#ea580c",
          }}
        >
          LocalPlate AI
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Cook smarter with what you have
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 36,
            color: "#52525b",
          }}
        >
          Recipes, costs and meal plans in seconds.
        </div>
      </div>
    ),
    size
  );
}