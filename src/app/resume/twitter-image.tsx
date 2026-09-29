import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Resumes of Naman Chordia";

export default function Image() {
  return ogImage({
    kicker: "Resumes",
    title: "Three one-page resumes, one set of facts.",
    subtitle: "Forward Deployed Engineer · AI Engineer · Software Engineer",
  });
}
