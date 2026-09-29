import { ogImage, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "ClueCode case study";

export default function Image() {
  return ogImage({
    kicker: "Case study · Product",
    title: "ClueCode: a desktop AI assistant with subscriptions, shipped solo.",
    subtitle: "Electron + Next.js + Postgres, device-session leases, signed idempotent webhooks, 270+ tests.",
  });
}
