import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Naman Chordia, Software Engineer, AI and Automation";

export default function Image() {
  return ogImage({
    kicker: "Software Engineer · AI & Automation",
    title: "Automation and AI systems for real-world workflows, and the checks that make them safe to ship.",
    subtitle: "Proofline · ClueCode · Enterprise automation at IDeaS (a SAS company)",
  });
}
