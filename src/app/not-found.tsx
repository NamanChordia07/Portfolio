import { ArrowRight } from "@/components/Icons";
import { ButtonLink, Container } from "@/components/Section";

export default function NotFound() {
  return (
    <div className="grain relative overflow-hidden">
      <div aria-hidden="true" className="bg-grid mask-radial absolute inset-0" />
      <Container className="relative flex min-h-[80svh] flex-col justify-center pb-20 pt-32">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-subtle">404 · unverifiable</p>
        <h1 className="mt-5 max-w-3xl font-display text-6xl leading-[0.95] text-fg sm:text-8xl">
          No page matches <em>that address.</em>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">The link may be old, or the number may have been wrong. Either way, the work is one click away.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/">
            Home <ArrowRight className="size-4" />
          </ButtonLink>
          <ButtonLink href="/#work" variant="secondary">
            Selected work
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
