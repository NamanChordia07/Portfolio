import Link from "next/link";

import { Container } from "@/components/Section";

export default function NotFound() {
  return (
    <Container className="py-28">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">404 · unverifiable</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-fg">No page matches that address.</h1>
      <p className="mt-4 text-lg text-muted">
        Try the{" "}
        <Link href="/" className="link">
          home page
        </Link>{" "}
        or the{" "}
        <Link href="/#work" className="link">
          selected work
        </Link>
        .
      </p>
    </Container>
  );
}
