import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Naman Chordia, Software Engineer, AI and Automation";

export default function Image() {
  return ogImage({
    kicker: "Software Engineer · AI & Automation",
    title: "I build AI that works outside the demo.",
    subtitle: "AI voice sales agent · Proofline · ClueCode · AI & automation at IDeaS (a SAS company)",
  });
}
