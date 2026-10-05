import type { Metadata } from "next";
import Link from "next/link";

import { CaseHeader, CaseSection, Decision, NextCase, Prose } from "@/components/Case";
import { Claim } from "@/components/Claim";
import { Flow } from "@/components/Flow";
import { claims } from "@/content/site";

export const metadata: Metadata = {
  title: "Enterprise automation at IDeaS",
  description:
    "Report pipelines with LLM-written commentary, Playwright checks across Salesforce and a revenue-management platform, analytics tools, mailbox automation, and a JSP/Struts dashboard modernised to Angular and Spring Boot.",
  alternates: { canonical: "/work/enterprise-automation" },
  openGraph: { url: "/work/enterprise-automation" },
};

export default function EnterpriseAutomationPage() {
  return (
    <article>
      <CaseHeader
        kicker="Work · IDeaS Revenue Solutions (a SAS company) · 2025–26"
        title="Enterprise automation at IDeaS"
        lede="IDeaS builds revenue-management software for hotels. Around the product sit teams doing a lot of careful, manual, cross-system work. My job has been to turn that work into scheduled, tested automation, and to put LLMs where they genuinely help."
        meta={[
          {
            label: "Roles",
            value:
              "AI & Automation Developer (Nov 2025 – present); Business Intelligence & Automation Intern (Jul – Oct 2025); Software Developer Intern (Jan – Jun 2025)",
          },
          { label: "Stack", value: "Python, pandas, Playwright, Power Automate, Streamlit, Altair, Java, Spring Boot, Angular, SQL, Docker" },
          { label: "Systems", value: "G3 revenue-management platform, Salesforce, Excel/Word/PDF, Microsoft AI Builder" },
          { label: "Note", value: "Described at the level of what was built. No internal code, data, names or screenshots." },
        ]}
      />

      <CaseSection id="reports" label="01" title="Forecast-review reports with LLM-written commentary">
        <Flow
          label="Report pipeline"
          steps={[
            { title: "Data", detail: "Forecasts and projections per property", tone: "muted" },
            { title: "Calculations", detail: "Forecast vs. projection analysis" },
            { title: "Charts & tables", detail: "Rendered per section" },
            { title: "Commentary", detail: "LLM-written narrative (Microsoft AI Builder)", tone: "accent" },
            { title: "Merge", detail: "PDF, Word and Excel deliverables" },
          ]}
        />
        <div className="mt-8">
          <Prose>
            <p>
              A Python pipeline that assembles client forecast reviews. It is split into modular services (data, calculations, charts,
              document merge) so a new report section is an addition, not a rewrite, and it handles both full-history properties and those
              with limited history, where the model runs on a synthetic baseline. It is containerised with Docker and went through SIT, UAT
              and hypercare.
            </p>
            <p>
              The LLM writes narrative around numbers the pipeline has already computed. The failure mode worth worrying about is a wrong
              number in that narrative, which is exactly what led me to build{" "}
              <Link href="/work/proofline" className="link">
                Proofline
              </Link>
              .
            </p>
          </Prose>
        </div>
      </CaseSection>

      <CaseSection id="g3" label="02" title="Configuration checks across three systems, in a browser">
        <Flow
          label="Configuration check"
          steps={[
            { title: "Salesforce", detail: "Client account numbers, integration types", tone: "muted" },
            { title: "Product UI", detail: "The same settings in the G3 platform" },
            { title: "Database", detail: "What is actually stored" },
            { title: "Check", detail: "Playwright run in Dockerised test environments", tone: "accent" },
          ]}
        />
        <div className="mt-8">
          <Prose>
            <p>
              Setting up a client correctly means the same facts have to agree in CRM, in the product, and underneath it. I automated that
              end-to-end check with Playwright, running in Dockerised test environments, so it runs the same way every time instead of
              depending on someone clicking through three systems.
            </p>
          </Prose>
        </div>
      </CaseSection>

      <CaseSection id="tools" label="03" title="Analytics and mailbox automation">
        <Decision title="Pricing analytics in Streamlit">
          <p>
            A Streamlit app (pandas, Altair) that takes pricing exports and automates best-available-rate trend analysis, property and
            chain extraction, date filtering and pricing-decision validation. It is structured as configuration, validation, calculation
            and chart services, so analyses can be added without touching the UI.
          </p>
        </Decision>
        <Decision title="A shared customer-care mailbox that tracks itself">
          <p>
            Scheduled Power Automate flows parse incoming client and system emails (chain codes, timestamps) into Excel and reconcile
            replies from Sent Items, so the team sees what is waiting and what has been answered without maintaining a tracker by hand. It
            removed <Claim claim={claims.mailbox} /> of manual tracking.
          </p>
        </Decision>
      </CaseSection>

      <CaseSection id="modernisation" label="04" title="Modernising a legacy dashboard without a big-bang switch">
        <Prose>
          <p>
            As a Software Developer Intern I migrated the product&apos;s &ldquo;At-a-Glance&rdquo; control dashboard from JSP and Struts to
            Angular and Spring Boot: Angular components on top of REST APIs backed by optimised SQL and Java Stream processing. The APIs
            moved from single-day data to custom date ranges, which meant reworking and tuning the underlying queries.
          </p>
          <p>
            The new UI shipped behind a database-driven feature toggle, added through a SQL migration, so clients could be moved from the
            legacy JSP views to Angular in a controlled rollout, and moved back if something went wrong.
          </p>
        </Prose>
      </CaseSection>

      <CaseSection id="pattern" label="Pattern" title="What these have in common">
        <Prose>
          <ul>
            <li>Start from the workflow: who does it, how often, what breaks, what &ldquo;done&rdquo; looks like.</li>
            <li>Build the smallest reliable automation first; add an LLM only where language is the actual work.</li>
            <li>Test it where it will run (containers, SIT, UAT) and roll it out so it can be rolled back.</li>
          </ul>
        </Prose>
      </CaseSection>

      <NextCase href="/work/proofline" title="Proofline" note="Verifying the numbers in LLM-written reports." />
    </article>
  );
}
