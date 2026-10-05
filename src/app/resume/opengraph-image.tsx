import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Resume of Naman Chordia";

export default function Image() {
  return ogImage({
    kicker: "Resume",
    title: "One page: AI, automation and software engineering.",
    subtitle: "AI & Automation Developer at IDeaS · AI voice sales agent · Proofline · ClueCode",
  });
}
