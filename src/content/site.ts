/**
 * Everything the site says about Naman lives here, so claims stay consistent across pages
 * and with the resumes (resume/content.yaml). Numbers are `Claim`s: each carries the source a
 * visitor sees on hover. If a number cannot be sourced, it does not belong on the site.
 */

export type Claim = { value: string; source: string };

export const site = {
  name: "Naman Chordia",
  shortRole: "Software Engineer · AI & Automation",
  location: "Pune, India",
  email: "namanchordia88@gmail.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://namanchordia.vercel.app").replace(/\/$/, ""),
  github: "https://github.com/NamanChordia07",
  linkedin: "https://www.linkedin.com/in/naman-chordia",
  description:
    "Software engineer building automation and AI systems for real-world workflows, and the checks that make them safe to ship. Proofline, ClueCode, and enterprise automation at IDeaS (a SAS company).",
  openTo: "Forward Deployed, Applied AI and Software Engineering roles, in India, remote or international.",
  currently: "Business Intelligence & Automation at IDeaS Revenue Solutions (a SAS company)",
} as const;

export const claims = {
  recall: {
    value: "98.9–100%",
    source: "Share of injected numeric errors caught on three held-out phrasing families, first run each (projects/proofline/docs/BENCHMARK.md).",
  },
  falseAlarms: {
    value: "1.1–4.5%",
    source: "Correct claims wrongly flagged on the same held-out first runs. After fixing what they exposed: 0.03–1.1%.",
  },
  naive: {
    value: "16–20%",
    source: "Recall of a baseline that flags a number only if no fact anywhere in the data has that value.",
  },
  naiveZero: {
    value: "0%",
    source: "Naive lookup detection of wrong-direction, wrong-basis, wrong-entity, wrong-metric and points-vs-percent errors, in every family.",
  },
  claims32k: {
    value: "32k",
    source: "About 8k labelled number and direction claims per template family, four families, three synthetic domains.",
  },
  plTests: { value: "58 tests", source: "pytest suite, 93% line coverage, mypy --strict (September 2026)." },
  throughput: {
    value: "~7,700 claims/s",
    source: "Single-threaded verification on a 2.1 GHz cloud vCPU, measured on the held-out corpus.",
  },
  ablation: {
    value: "24–29%",
    source: "False-alarm rate when display-precision intervals are replaced by a fixed ±1% tolerance (held-out first runs).",
  },
  ccTests: {
    value: "270+",
    source: "ClueCode's recorded green run, Sep 2026: web 138, shared 13, desktop unit 67, Electron security and a11y 11, website E2E 43, installer and auto-update 7.",
  },
  mailbox: {
    value: "~3 hours",
    source: "Manual tracking effort the service-delivery team no longer does, as estimated when the flows replaced it.",
  },
  cgpa: { value: "8.9/10", source: "B.Tech Computer Engineering, VIIT Pune, 2025." },
  students: { value: "150+", source: "Participants across 5+ security workshops and CTF events run as Cyber Cell Technical Head." },
} satisfies Record<string, Claim>;

export type Role = { title: string; dates: string; points: string[] };
export type Job = { company: string; location: string; url?: string; roles: Role[] };

export const experience: Job[] = [
  {
    company: "IDeaS Revenue Solutions (a SAS company)",
    location: "Pune, India",
    url: "https://ideas.com",
    roles: [
      {
        title: "Business Intelligence & Automation Intern",
        dates: "Jul 2025 – Present",
        points: [
          "Built a Python pipeline that generates client forecast-review reports (forecast vs. projections) as PDF, Word and Excel with LLM-written commentary; modular services, Dockerised, through SIT and UAT.",
          "Automated end-to-end checks of client setup on the G3 revenue-management platform with Playwright, validating account numbers and integration types across Salesforce, the product UI and its database.",
          "Built a Streamlit analytics tool (pandas, Altair) for best-available-rate trends and pricing-decision validation, structured as configuration, validation, calculation and chart services.",
          "Automated a shared customer-care mailbox with scheduled Power Automate flows that log client and system emails to Excel and reconcile replies from Sent Items.",
        ],
      },
      {
        title: "Software Developer Intern",
        dates: "Jan 2025 – Jun 2025",
        points: [
          "Migrated the legacy JSP/Struts “At-a-Glance” dashboard to Angular and Spring Boot: Angular components and REST APIs over optimized SQL and Java Streams.",
          "Extended the APIs from single-day to custom date ranges and shipped the new UI behind a database-driven feature toggle for a controlled rollout.",
        ],
      },
    ],
  },
  {
    company: "IFM Engineering Pvt. Ltd.",
    location: "Pune, India",
    roles: [
      {
        title: "Security Software Intern",
        dates: "Jul 2024 – Dec 2024",
        points: ["Detected and mitigated XSS, SQL-injection and misconfiguration risks in internal audits; automated vulnerability scanning."],
      },
    ],
  },
];

export type WorkItem = {
  slug: "proofline" | "cluecode" | "enterprise-automation";
  title: string;
  kicker: string;
  summary: string;
  facts: (Claim | string)[];
  stack: string[];
  year: string;
  links: { label: string; href: string }[];
};

export const work: WorkItem[] = [
  {
    slug: "proofline",
    title: "Proofline",
    kicker: "Open source · Applied AI · 2026",
    summary:
      "Checks every number an LLM writes into a business report against the data, explains how a wrong one is wrong, and repairs it. A CLI that can gate a pipeline, a Python library, and an MCP server agents can call.",
    facts: [claims.recall, claims.naive, claims.plTests],
    stack: ["Python", "MCP", "Gemini", "Claude", "pytest", "Hypothesis"],
    year: "2026",
    links: [{ label: "Source", href: "https://github.com/NamanChordia07/proofline" }],
  },
  {
    slug: "cluecode",
    title: "ClueCode",
    kicker: "Product · Full-stack · 2026",
    summary:
      "A Windows desktop AI assistant with subscriptions, designed and shipped solo: Electron client streaming multimodal Gemini answers, Next.js and Postgres backend, device-session leases, Razorpay billing.",
    facts: [claims.ccTests, "Live at cluecode.in", "One active device per account, enforced in Postgres"],
    stack: ["Electron", "TypeScript", "Next.js", "PostgreSQL", "Drizzle", "Razorpay"],
    year: "2026",
    links: [{ label: "cluecode.in", href: "https://cluecode.in" }],
  },
  {
    slug: "enterprise-automation",
    title: "Enterprise automation at IDeaS",
    kicker: "Work · Automation & integration · 2025–26",
    summary:
      "Report pipelines with LLM-written commentary, Playwright checks across Salesforce and a revenue-management platform, analytics tools, mailbox automation, and a legacy dashboard modernised to Angular and Spring Boot.",
    facts: [claims.mailbox, "Through SIT and UAT", "JSP/Struts → Angular + Spring Boot"],
    stack: ["Python", "Playwright", "Power Automate", "Streamlit", "Java", "Spring Boot", "Angular", "Docker"],
    year: "2025–26",
    links: [],
  },
];

export const areas = [
  {
    title: "Applied AI you can trust",
    body: "LLM features with the evaluation, guardrails and fallbacks that let them ship: grounded generation, verification, model fallback, prompt-injection defence.",
    tools: ["Gemini", "Claude", "Microsoft AI Builder", "MCP", "evals", "Python"],
  },
  {
    title: "Enterprise automation & integration",
    body: "Taking a manual, cross-system workflow and turning it into something scheduled, tested and boring: browser automation, report generation, mailbox and spreadsheet flows.",
    tools: ["Playwright", "Power Automate", "Salesforce", "pandas", "Streamlit", "Docker"],
  },
  {
    title: "Product engineering",
    body: "Full-stack systems that hold up: auth, payments, data models with real constraints, desktop security, and test suites that catch regressions before users do.",
    tools: ["TypeScript", "Next.js", "Electron", "Java", "Spring Boot", "Angular", "PostgreSQL"],
  },
] as const;

export const principles = [
  { title: "Start from the workflow", body: "Find out what people actually do, and what breaks, before choosing a tool. Most wins are plain automation." },
  { title: "Measure before you ship", body: "If a model is involved, decide how you will know it is right. Build the check, then the feature." },
  { title: "Make failure visible", body: "Unverifiable is not the same as correct. Surface it, log it, and give a human the evidence." },
] as const;

export const resumes = [
  {
    id: "fde",
    title: "Forward Deployed Engineer",
    focus: "Enterprise automation, integration across systems, end-to-end delivery, applied AI.",
    file: "/resume/Naman_Chordia_FDE_Resume.pdf",
    preview: "/resume/previews/Naman_Chordia_FDE_Resume.png",
  },
  {
    id: "ai",
    title: "AI Engineer",
    focus: "LLM systems, evaluation and guardrails, multimodal product work, automation.",
    file: "/resume/Naman_Chordia_AI_Engineer_Resume.pdf",
    preview: "/resume/previews/Naman_Chordia_AI_Engineer_Resume.png",
  },
  {
    id: "sde",
    title: "Software Engineer",
    focus: "Java/Spring Boot and Angular, TypeScript full-stack, backend design, testing.",
    file: "/resume/Naman_Chordia_SDE_Resume.pdf",
    preview: "/resume/previews/Naman_Chordia_SDE_Resume.png",
  },
] as const;

export const education = {
  school: "Vishwakarma Institute of Information Technology, Pune",
  degree: "B.Tech, Computer Engineering",
  year: "2025",
  cgpa: claims.cgpa,
  extra: [
    { text: "Technical Head, Cyber Cell, VIIT: ran 5+ security workshops and CTFs for", claim: claims.students, after: "students." },
    { text: "Joint runner-up, Data Viz-a-thon (Power BI, Tableau).", claim: null, after: "" },
  ],
} as const;
