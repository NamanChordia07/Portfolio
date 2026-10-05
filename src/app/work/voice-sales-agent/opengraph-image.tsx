import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "AI Voice Sales Agent case study";

export default function Image() {
  return ogImage({
    kicker: "Case study · Voice AI",
    title: "An AI agent that qualifies sales leads over the phone.",
    subtitle: "Streaming speech in and out, barge-in, validated LLM actions, FreJun telephony, ~2.9 s median response.",
  });
}
