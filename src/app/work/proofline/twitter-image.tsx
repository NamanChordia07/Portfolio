import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Proofline case study";

export default function Image() {
  return ogImage({
    kicker: "Case study · Open source",
    title: "Proofline: every number an LLM writes, checked against the data.",
    subtitle: "98.9–100% of injected errors caught on unseen phrasing, vs 16–20% for a naive lookup.",
  });
}
