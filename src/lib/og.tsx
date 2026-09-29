import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

async function font(file: string) {
  return readFile(join(process.cwd(), "node_modules/geist/dist/fonts", file));
}

/** Shared Open Graph card: dark, typographic, with the "verified claim" underline motif. */
export async function ogImage({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  const [semibold, regular, mono] = await Promise.all([
    font("geist-sans/Geist-SemiBold.ttf"),
    font("geist-sans/Geist-Regular.ttf"),
    font("geist-mono/GeistMono-Regular.ttf"),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0b0c0e",
          color: "#ececef",
          fontFamily: "Geist",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#ececef",
              color: "#0b0c0e",
              fontFamily: "Geist Mono",
              fontSize: 17,
            }}
          >
            NC
          </div>
          <div style={{ fontFamily: "Geist Mono", fontSize: 20, color: "#a6a9b0", letterSpacing: 2, textTransform: "uppercase" }}>{kicker}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 28, color: "#a6a9b0", lineHeight: 1.4, maxWidth: 980 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Geist Mono", fontSize: 20, color: "#858993" }}>
          <div style={{ display: "flex" }}>Naman Chordia · Software Engineer, AI & Automation</div>
          <div style={{ display: "flex", borderBottom: "3px dashed #4fd1ae", color: "#ececef", paddingBottom: 4 }}>every number sourced</div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: regular, weight: 400 },
        { name: "Geist", data: semibold, weight: 600 },
        { name: "Geist Mono", data: mono, weight: 400 },
      ],
    },
  );
}
