import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { claims, experience, resume, site, work } from "@/content/site";
import { demo, segments } from "@/lib/demo";

const root = join(__dirname, "..", "..");

describe("site content", () => {
  it("every claim has a value and a real source", () => {
    for (const [key, c] of Object.entries(claims)) {
      expect(c.value, key).not.toBe("");
      expect(c.source.length, `${key} source`).toBeGreaterThan(30);
    }
  });

  it("every work item has a case study page", () => {
    for (const w of work) {
      expect(existsSync(join(root, "src/app/work", w.slug, "page.tsx")), w.slug).toBe(true);
    }
  });

  it("every resume download and preview exists, and web copies carry no phone number", () => {
    const pdf = join(root, "public", resume.file);
    expect(existsSync(pdf), resume.file).toBe(true);
    expect(readFileSync(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    expect(existsSync(join(root, "public", resume.preview)), resume.preview).toBe(true);
    const html = readFileSync(join(root, "resume/dist/Naman_Chordia_FDE_Resume.html"), "utf8");
    expect(html).toContain("+91");
  });

  it("experience entries have dated roles with points", () => {
    for (const job of experience) {
      for (const role of job.roles) {
        expect(role.dates).toMatch(/^[A-Z][a-z]{2} \d{4} – (Present|[A-Z][a-z]{2} \d{4})$/);
        expect(role.points.length).toBeGreaterThan(0);
      }
    }
  });

  it("uses an absolute https site URL without a trailing slash", () => {
    expect(site.url).toMatch(/^https:\/\/[^/]+$/);
  });
});

describe("Proofline demo data (exported from the engine)", () => {
  it("claim spans point at the right text", () => {
    for (const s of demo.samples) {
      for (const c of s.claims) expect(s.text.slice(c.start, c.end), `${s.id}`).toBe(c.text);
    }
  });

  it("each draft has errors and each repair removes every contradiction", () => {
    for (const s of demo.samples) {
      expect(s.counts.contradicted, s.id).toBeGreaterThan(0);
      expect(s.repaired.counts.contradicted, s.id).toBe(0);
      expect(s.repaired.edits.length, s.id).toBe(s.counts.contradicted);
    }
  });

  it("benchmark table has every system for every held-out family", () => {
    const families = new Set(demo.benchmark.firstRuns.map((r) => r.family));
    expect([...families].sort()).toEqual(["heldout", "heldout2", "heldout3"]);
    for (const f of families) {
      const systems = demo.benchmark.firstRuns.filter((r) => r.family === f).map((r) => r.system);
      expect(systems).toEqual(["proofline", "fixed_tolerance", "no_context", "no_basis", "naive_lookup"]);
    }
  });

  it("headline claims match the exported numbers", () => {
    const pl = demo.benchmark.firstRuns.filter((r) => r.system === "proofline");
    const naive = demo.benchmark.firstRuns.filter((r) => r.system === "naive_lookup");
    const pctRange = (xs: number[], d: number) => [Math.min(...xs), Math.max(...xs)].map((x) => (x * 100).toFixed(d));
    const [rLo, rHi] = pctRange(pl.map((r) => r.recall), 1);
    expect(claims.recall.value).toBe(`${rLo}–${Number(rHi)}%`);
    const [fLo, fHi] = pctRange(pl.map((r) => r.falseAlarms), 1);
    expect(claims.falseAlarms.value).toBe(`${fLo}–${fHi}%`);
    const [nLo, nHi] = pctRange(naive.map((r) => r.recall), 0);
    expect(claims.naive.value).toBe(`${nLo}–${nHi}%`);
  });
});

describe("segments()", () => {
  it("interleaves plain text and claims in order", () => {
    const text = "Revenue rose 12% to $1.2M.";
    const mk = (start: number, end: number) => ({
      start,
      end,
      text: text.slice(start, end),
      kind: "delta",
      metric: null,
      entity: null,
      basis: null,
      status: "supported" as const,
      reason: "ok",
      message: "",
      factId: null,
      derivation: null,
    });
    const segs = segments(text, [mk(20, 25), mk(13, 16)]);
    expect(segs.map((s) => s.value)).toEqual(["Revenue rose ", "12%", " to ", "$1.2M", "."]);
  });
});
