import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

const read = (...parts: string[]) => readFile(join(process.cwd(), ...parts));

/** Shared Open Graph card: near-black, serif headline with an ember accent, and the portrait. */
export async function ogImage({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  const [serif, serifItalic, regular, mono, photo] = await Promise.all([
    read("node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff"),
    read("node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff"),
    read("node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf"),
    read("node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.ttf"),
    read("public/images/naman.jpg"),
  ]);
  const portrait = `data:image/jpeg;base64,${photo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "60px 64px",
          background: "#09090b",
          color: "#f2f0eb",
          fontFamily: "Geist",
          backgroundImage:
            "radial-gradient(circle at 88% 8%, rgba(255,122,69,0.22), transparent 42%), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 56px 56px, 56px 56px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Geist Mono", fontSize: 19, color: "#a6a5ad", letterSpacing: 2.5, textTransform: "uppercase" }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "#ff7a45" }} />
            {kicker}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontFamily: "Instrument Serif", fontSize: 76, lineHeight: 1.02, letterSpacing: -1.5, maxWidth: 720 }}>{title}</div>
            <div style={{ fontSize: 25, color: "#a6a5ad", lineHeight: 1.4, maxWidth: 700 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Geist Mono", fontSize: 19, color: "#8a8992" }}>
            <span style={{ color: "#f2f0eb" }}>namanchordia.vercel.app</span>
            <span>·</span>
            <span style={{ fontFamily: "Instrument Serif Italic", fontSize: 26, color: "#ff7a45" }}>AI that works outside the demo</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 330,
              borderRadius: 28,
              border: "1px solid rgba(255,122,69,0.55)",
              background: "#111114",
              overflow: "hidden",
              boxShadow: "0 30px 80px -20px rgba(255,122,69,0.35)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portrait} width={330} height={330} alt="" style={{ objectFit: "cover" }} />
            <div style={{ display: "flex", flexDirection: "column", padding: "16px 20px", gap: 4 }}>
              <div style={{ fontSize: 22, color: "#f2f0eb" }}>Naman Chordia</div>
              <div style={{ fontSize: 16, color: "#a6a5ad" }}>{"AI & Automation Developer · Pune"}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: regular, weight: 400 },
        { name: "Geist Mono", data: mono, weight: 400 },
        { name: "Instrument Serif", data: serif, weight: 400 },
        { name: "Instrument Serif Italic", data: serifItalic, weight: 400, style: "italic" },
      ],
    },
  );
}
