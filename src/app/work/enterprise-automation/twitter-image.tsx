import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Enterprise automation case study";

export default function Image() {
  return ogImage({
    kicker: "Case study · Work",
    title: "Enterprise automation at IDeaS (a SAS company).",
    subtitle: "Report pipelines with LLM commentary, Playwright checks across systems, a legacy dashboard modernised.",
  });
}
