import type { Metadata } from "next";

import { CaseHeader, CaseSection, Decision, NextCase, Prose, Stats } from "@/components/Case";
import { Claim } from "@/components/Claim";
import { Flow } from "@/components/Flow";
import { ProoflineDemo } from "@/components/ProoflineDemo";
import { claims } from "@/content/site";
import { demo, pct } from "@/lib/demo";

// Set to the public repository URL once Proofline is published; until then the page links nothing dead.
const REPO: string | null = null;

export const metadata: Metadata = {
  title: "Proofline: verifying the numbers in LLM-written reports",
  description:
    "A verifier that checks every number an LLM writes into a business report against the data, diagnoses how a wrong one is wrong, and repairs it. Benchmarked on held-out phrasing against a naive baseline.",
  alternates: { canonical: "/work/proofline" },
  openGraph: { url: "/work/proofline" },
};

const systems: Record<string, string> = {
  proofline: "Proofline",
  fixed_tolerance: "Fixed ±1% tolerance",
  no_context: "No context carry-over",
  no_basis: "No basis handling",
  naive_lookup: "Naive value lookup",
};

const typeLabel: Record<string, string> = {
  wrong_value: "Wrong value",
  rounding_drift: "Rounding drift (2–3 units)",
  wrong_direction: "Wrong direction",
  unit_confusion: "Points written as percent",
  wrong_basis: "Wrong comparison basis",
  wrong_entity: "Another entity's figure",
  wrong_metric: "Another metric's figure",
  scale_error: "Scale slip (K/M, lakh/crore)",
  fabricated: "Metric not in the data",
};

export default function ProoflinePage() {
  const rows = demo.benchmark.firstRuns;
  const families = ["heldout", "heldout2", "heldout3"];
  const perType = demo.benchmark.perType.filter((r) => r.family === "heldout3");

  return (
    <article>
      <CaseHeader
        kicker="Open source · Applied AI · September 2026"
        title="Proofline"
        lede="Every number an LLM writes into a business report, checked against the data before anyone reads it. When a number is wrong, Proofline says how it is wrong and repairs it with the smallest possible edit."
        meta={[
          { label: "Role", value: "Sole author: design, implementation, evaluation" },
          { label: "Built with", value: "Python (standard-library core), MCP, Gemini and Claude SDKs, pytest, Hypothesis" },
          { label: "Ships as", value: "Python library · CLI that exits non-zero on a bad report · MCP server" },
          {
            label: "Links",
            value: (
              <span className="flex flex-col gap-1">
                {REPO ? (
                  <>
                    <a className="link" href={REPO} target="_blank" rel="noopener noreferrer">
                      Source on GitHub ↗
                    </a>
                    <a className="link" href={`${REPO}/blob/main/docs/BENCHMARK.md`} target="_blank" rel="noopener noreferrer">
                      Benchmark write-up ↗
                    </a>
                  </>
                ) : (
                  <span className="text-muted">Source going public soon; the demo below runs on its real output.</span>
                )}
                <a className="link" href="#demo">
                  Live demo ↓
                </a>
              </span>
            ),
          },
        ]}
      />
      <Stats
        items={[
          { claim: claims.recall, label: "of injected errors caught on phrasing never seen in development" },
          { claim: claims.falseAlarms, label: "false alarms on those first runs (0.03–1.1% after fixes)" },
          { claim: claims.naive, label: "caught by a naive “is this number in the data?” check" },
          { claim: claims.claims32k, label: "labelled claims across three domains and four template families" },
        ]}
      />

      <CaseSection id="problem" label="The problem" title="Right numbers in the wrong place">
        <Prose>
          <p>
            Automated report commentary is one of the most common ways companies put LLMs in front of clients, and it has one failure
            mode that matters: a wrong number. The model rarely invents digits. It reports last year&apos;s change against budget,
            attributes one property&apos;s ADR to another, writes a 5.2-point occupancy gain as &ldquo;5.2%&rdquo;, or says revenue
            &ldquo;improved&rdquo; when it fell. The prose stays fluent, so nobody notices until a client does.
          </p>
          <p>
            I ran into this shape of problem building report automation with LLM-written commentary at work. The obvious fix, asking the
            model to double-check itself, uses the same fallible reasoning to audit its own output. Proofline takes the opposite
            position: <strong>the model writes; a deterministic system decides whether what it wrote is true.</strong>
          </p>
          <p>
            That split matters because most of these errors survive the check people reach for first: a naive lookup that asks whether a
            number appears anywhere in the data catches <Claim claim={claims.naiveZero} /> of wrong-direction, wrong-basis,
            wrong-entity, wrong-metric and points-vs-percent errors. The number is in the data. It is just attached to the wrong thing.
          </p>
        </Prose>
      </CaseSection>

      <CaseSection id="demo" label="Try it" title="Real output on three sample reports">
        <p className="mb-6 max-w-[68ch] text-[15.5px] leading-relaxed text-muted">
          Each sample is an LLM-style summary of synthetic data with deliberate mistakes. Highlights and diagnoses are the verifier&apos;s
          actual output, exported from the engine at build time. Select a number to see the fact it was checked against.
        </p>
        <ProoflineDemo />
      </CaseSection>

      <CaseSection id="how" label="How it works" title="Compute facts, attribute claims, verify, repair">
        <Flow
          label="Proofline pipeline"
          steps={[
            { title: "Compute facts", detail: "Levels, bases, absolute and % changes, with IDs and derivations", tone: "muted" },
            { title: "Parse numbers", detail: "Display precision, hedges, scale words, units" },
            { title: "Attribute claims", detail: "Metric, entity, basis, direction from the clause and context" },
            { title: "Verify", detail: "Supported, contradicted with a diagnosis, or unverifiable", tone: "accent" },
            { title: "Repair or feed back", detail: "Minimal edits, or exact problems back to the model" },
          ]}
        />
        <div className="mt-10">
          <Decision title="Facts are computed once, never generated">
            <p>
              A small declarative spec (metrics as column sums or ratios of sums, comparison bases as column suffixes or the previous
              period) expands into every level, base, absolute change and relative change for every entity and the total. Ratio metrics
              are always ratio-of-sums; averaging per-property ADRs is a classic way hand-built totals go wrong.
            </p>
          </Decision>
          <Decision title="A written number is an interval, not a point">
            <p>
              &ldquo;12%&rdquo; commits to [11.5, 12.5); &ldquo;$1.2M&rdquo; to ±$50K; &ldquo;about&rdquo;, &ldquo;nearly&rdquo; and
              &ldquo;over&rdquo; get their own bounds. Replacing this with a fixed ±1% tolerance, the thing most people write first,
              produces <Claim claim={claims.ablation} /> false alarms.
            </p>
          </Decision>
          <Decision title="Attribution is the hard part, so it reads like a person would">
            <p>
              Each number is tied to a metric, entity, comparison basis and direction from its clause, then from earlier clauses, then
              from the previous sentence when the sentence starts with &ldquo;It&rdquo; or &ldquo;This&rdquo;, then from the section
              heading. Words like &ldquo;improved&rdquo; resolve through metric polarity: a return rate that improved went down. Every
              attribution records why it was made, so every verdict can be explained.
            </p>
          </Decision>
          <Decision title="Unverifiable is a finding, not a pass">
            <p>
              A number that cannot be tied to a fact is reported rather than accepted; those are often the fabricated ones. The CLI exit
              code is driven by contradictions, so it can gate a report pipeline without blocking on prose it cannot check.
            </p>
          </Decision>
          <Decision title="Guarded generation">
            <p>
              With a model in the loop, Proofline drafts, verifies, and sends back a numbered list of exact problems with the fact each
              one should have used, for a bounded number of rounds, then falls back to deterministic repair. The same engine is exposed
              as an MCP server (<code>compute_facts</code>, <code>facts_brief</code>, <code>verify_narrative</code>,{" "}
              <code>repair_narrative</code>) so any agent can check its own numbers.
            </p>
          </Decision>
        </div>
      </CaseSection>

      <CaseSection id="evaluation" label="Evaluation" title="Measured on phrasing it had never seen">
        <Prose>
          <p>
            The benchmark generates reports from computed facts over three synthetic domains (hotel weekly in USD, retail monthly in INR
            with lakh and crore, SaaS monthly), injects nine kinds of error, and labels every number with an independent ground-truth
            check that never uses the verifier. Templates are split into families: I built against <code>dev</code>, then wrote each
            held-out family in a different voice and ran it once before looking at failures. Those first runs are the honest numbers.
          </p>
        </Prose>
        <div className="mt-8 overflow-x-auto rounded-xl border border-line" tabIndex={0} role="region" aria-label="Benchmark results, first run per held-out family">
          <table className="w-full min-w-[620px] text-left text-sm">
            <caption className="sr-only">First run on each held-out family</caption>
            <thead className="bg-sunk font-mono text-[11px] uppercase tracking-wider text-subtle">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">System</th>
                {families.map((f) => (
                  <th key={f} scope="col" className="px-4 py-3 font-normal">
                    {f}: recall / false alarms
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Object.keys(systems).map((sys) => (
                <tr key={sys} className={sys === "proofline" ? "bg-accent-soft/60" : ""}>
                  <th scope="row" className="px-4 py-3 font-medium text-fg">
                    {systems[sys]}
                  </th>
                  {families.map((f) => {
                    const r = rows.find((x) => x.family === f && x.system === sys)!;
                    return (
                      <td key={f} className="px-4 py-3 font-mono text-[13px] text-muted">
                        <span className="text-fg">{pct(r.recall)}</span> / {pct(r.falseAlarms, 2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-subtle">
          The no-context ablation also leaves {pct(Math.min(...rows.filter((r) => r.system === "no_context").map((r) => r.unverifiableClean)), 0)}
          –{pct(Math.max(...rows.filter((r) => r.system === "no_context").map((r) => r.unverifiableClean)), 0)} of correct claims
          unverifiable.
        </p>

        <h3 className="mt-12 font-medium text-fg">By error type (heldout3, current engine)</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line" tabIndex={0} role="region" aria-label="Detection by error type">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-sunk font-mono text-[11px] uppercase tracking-wider text-subtle">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">Error</th>
                <th scope="col" className="px-4 py-3 font-normal">n</th>
                <th scope="col" className="px-4 py-3 font-normal">Proofline</th>
                <th scope="col" className="px-4 py-3 font-normal">Naive lookup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {perType.map((r) => (
                <tr key={r.type}>
                  <th scope="row" className="px-4 py-2.5 font-normal text-fg">
                    {typeLabel[r.type] ?? r.type}
                  </th>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-muted">{r.n}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-fg">{pct(r.detected)}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-muted">{pct(r.naive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-10">
          <Prose>
            <p>
              <strong>What the numbers say.</strong> Recall held across every unseen phrasing family. Precision is where new constructions
              hurt: each held-out family exposed one or two (&ldquo;vs budget, by 7.0 percent&rdquo;, &ldquo;2.3% (2.2% last
              month)&rdquo;), each traced and fixed. One held-out run also exposed a bug in the benchmark itself: a template hard-coded the
              verb &ldquo;lifted&rdquo;, so falling metrics were labelled clean while the verifier, correctly, flagged them. I fixed the
              labels, not the verifier, and kept both result files.
            </p>
            <p>
              <strong>A second, harder test.</strong> Templates give many sentences from a few constructions, so I also wrote challenge
              sets by hand: one construction per case, labelled from the data, across thirteen categories from points-versus-percent and
              lakh/crore to ambiguous comparisons and identifiers. A held-out set written after the first was fixed passed{" "}
              <Claim claim={claims.challengeHeldout} /> cases on its first run. It missed no errors; the failures were false positives
              (&ldquo;sold 1,017 rooms&rdquo;, &ldquo;topped $460K&rdquo;, &ldquo;Tower 2&rdquo;), each fixed with a general rule and
              re-checked against the template families.
            </p>
            <p>
              <strong>What they don&apos;t say.</strong> The text is template-generated and the templates share an author with the
              extractor; injected error rates are chosen, not observed. The next measurement is a real model:{" "}
              <code>proofline eval-llm</code> reports first-draft versus guarded error rates for Gemini or Claude, and no real-model
              numbers are claimed until that has run.
            </p>
          </Prose>
        </div>
      </CaseSection>

      <CaseSection id="engineering" label="Engineering" title="Small, fast, and tested">
        <Prose>
          <ul>
            <li>
              Pure-Python core with no runtime dependencies; model SDKs and MCP are optional extras. Verification runs at{" "}
              <Claim claim={claims.throughput} /> single-threaded, so it adds nothing noticeable to a report job.
            </li>
            <li>
              <Claim claim={claims.plTests} />: unit, property-based (formatting round-trips), CLI exit codes, an in-process MCP client,
              fake-SDK provider contracts, and pinned expectations for the sample reports on this page.
            </li>
            <li>The benchmark generator is seeded and deterministic across processes (a set-ordering bug made it otherwise; found and fixed).</li>
          </ul>
        </Prose>
      </CaseSection>

      <CaseSection id="next" label="Next" title="Limitations and what I'd build next">
        <Prose>
          <ul>
            <li>
              <strong>LLM-assisted attribution</strong> for numbers the rules leave unattributed, measured on the same held-out families,
              with verification staying deterministic.
            </li>
            <li>
              <strong>More claim types:</strong> shares, rankings (&ldquo;the top property&rdquo;), multi-period trends, derived arithmetic.
            </li>
            <li>
              <strong>A real-model study</strong> across providers and prompt styles, and a report-diff mode for recurring reports.
            </li>
          </ul>
        </Prose>
      </CaseSection>

      <NextCase href="/work/voice-sales-agent" title="AI Voice Sales Agent" note="Qualifying leads over the phone in real time." />
    </article>
  );
}
