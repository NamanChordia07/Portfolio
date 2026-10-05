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
  phone: "+91 87999 55051",
  phoneHref: "tel:+918799955051",
  photo: "/images/naman-portrait.jpg",
  avatar: "/images/naman-avatar.jpg",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://namanchordia.vercel.app").replace(/\/$/, ""),
  github: "https://github.com/NamanChordia07",
  linkedin: "https://www.linkedin.com/in/naman-chordia-291b7a22a/",
  description:
    "Software engineer building AI systems that work outside the demo: a real-time AI voice sales agent, Proofline (LLM report verification), ClueCode, and enterprise automation at IDeaS (a SAS company).",
  openTo: "Forward Deployed, Applied AI and Software Engineering roles, in India, remote or international.",
  currently: "AI & Automation Developer at IDeaS Revenue Solutions (a SAS company)",
} as const;

export const claims = {
  recall: {
    value: "98.9–100%",
    source: "Share of injected numeric errors caught on three held-out phrasing families, first run each (github.com/NamanChordia07/Proofline, docs/BENCHMARK.md).",
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
  plTests: {
    value: "71 tests",
    source: "pytest suite, 95% line coverage, mypy --strict; both challenge sets run as regression tests (September 2026).",
  },
  throughput: {
    value: "~5,000–6,200 claims/s",
    source: "Single-threaded verification on a 2.1 GHz Xeon cloud vCPU across the four template families, about 2–2.5 ms per report (run of 29 Sep 2026).",
  },
  challengeHeldout: {
    value: "62 of 65",
    source: "Hand-written held-out challenge cases passed on the first run, before any fix: 100% recall, 87.9% precision (4 false positives, 0 missed errors). All 65 pass after the fixes.",
  },
  ablation: {
    value: "24–29%",
    source: "False-alarm rate when display-precision intervals are replaced by a fixed ±1% tolerance (held-out first runs).",
  },
  vaLatency: {
    value: "~2.9 s",
    source: "Median from end of speech to the agent's first audio, 13 turns in the browser demo (Chrome, push-to-talk), Oct 2026. Per turn: STT 0.7–1.3 s, LLM 0.8–1.6 s, TTS first audio 0.8–1.0 s.",
  },
  vaTests: {
    value: "121",
    source: "Automated tests passing at the commit that integrated FreJun (Oct 2026): telephony provider and routes, call lifecycle, engine regressions, prompt schemas.",
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
        title: "AI & Automation Developer",
        dates: "Nov 2025 – Present",
        points: [
          "Engineered a Dockerized Python pipeline of 4 modular services that generates client forecast-review reports in 3 formats (PDF, Word, Excel) with LLM-written commentary, delivered through SIT, UAT and hypercare.",
          "Developed Playwright end-to-end checks that validate client setup (account numbers, integration types) across 3 systems: Salesforce, the G3 revenue-management UI and its database.",
          "Created a Streamlit analytics app (pandas, Altair) of 4 services (config, validation, calculation, charts) for best-available-rate trends and pricing-decision validation.",
        ],
      },
      {
        title: "Business Intelligence & Automation Intern",
        dates: "Jul 2025 – Oct 2025",
        points: [
          "Streamlined a shared customer-care mailbox with scheduled Power Automate flows that log incoming emails to Excel and reconcile replies from Sent Items, saving the team about 3 hours of manual tracking.",
        ],
      },
      {
        title: "Software Developer Intern",
        dates: "Jan 2025 – Jun 2025",
        points: [
          "Migrated the legacy JSP/Struts “At-a-Glance” dashboard to Angular and Spring Boot: Angular components and REST APIs over optimized SQL and Java Streams.",
          "Extended the APIs from single-day to custom date ranges and released the new UI behind a database-driven feature toggle for a staged rollout.",
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
        points: ["Identified and mitigated 3 risk classes (XSS, SQL injection, misconfiguration) in internal security audits; automated vulnerability scanning."],
      },
    ],
  },
];

export type WorkItem = {
  slug: "proofline" | "voice-sales-agent" | "cluecode" | "enterprise-automation";
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
    slug: "voice-sales-agent",
    title: "AI Voice Sales Agent",
    kicker: "Client project · Voice AI · 2026",
    summary:
      "An outbound AI agent that phones leads, holds a scripted but adaptive qualification conversation, and hands qualified leads to a sales team. Streaming speech in and out, barge-in, and an LLM whose every action is validated before it happens.",
    facts: [claims.vaLatency, claims.vaTests, "FreJun telephony, HMAC-signed webhooks"],
    stack: ["Python", "FastAPI", "OpenAI", "PostgreSQL", "WebSockets", "FreJun"],
    year: "2026",
    links: [{ label: "Source", href: "https://github.com/NamanChordia07/ai-voice-sales-agent" }],
  },
  {
    slug: "proofline",
    title: "Proofline",
    kicker: "Open source · Applied AI · 2026",
    summary:
      "Checks every number an LLM writes into a business report against the data, explains how a wrong one is wrong, and repairs it. A CLI that can gate a pipeline, a Python library, and an MCP server agents can call.",
    facts: [claims.recall, claims.naive, claims.plTests],
    stack: ["Python", "MCP", "Gemini", "Claude", "pytest", "Hypothesis"],
    year: "2026",
    links: [{ label: "Source", href: "https://github.com/NamanChordia07/Proofline" }],
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
    tools: ["OpenAI", "Gemini", "Claude", "LangChain", "LangGraph", "voice agents", "MCP", "evals", "Python"],
  },
  {
    title: "Enterprise automation & integration",
    body: "Taking a manual, cross-system workflow and turning it into something scheduled, tested and boring: browser automation, report generation, mailbox and spreadsheet flows.",
    tools: ["Playwright", "Power Automate", "Salesforce", "pandas", "Streamlit", "Docker"],
  },
  {
    title: "Product engineering",
    body: "Full-stack systems that hold up: auth, payments, data models with real constraints, desktop security, and test suites that catch regressions before users do.",
    tools: ["TypeScript", "Next.js", "Electron", "Java", "Spring Boot", "Angular", "PostgreSQL", "CI/CD"],
  },
] as const;

export const principles = [
  { title: "Start from the workflow", body: "Find out what people actually do, and what breaks, before choosing a tool. Most wins are plain automation." },
  { title: "Measure before you ship", body: "If a model is involved, decide how you will know it is right. Build the check, then the feature." },
  { title: "Make failure visible", body: "Unverifiable is not the same as correct. Surface it, log it, and give a human the evidence." },
] as const;

export const stack = [
  "Python",
  "TypeScript",
  "OpenAI",
  "Gemini",
  "Claude",
  "LangChain",
  "LangGraph",
  "MCP",
  "FastAPI",
  "Next.js",
  "React",
  "Playwright",
  "PostgreSQL",
  "Electron",
  "Spring Boot",
  "Angular",
  "Docker",
  "GitHub Actions",
  "Power Automate",
  "WebSockets",
  "pandas",
] as const;

export const resume = {
  title: "Resume",
  focus: "One page: AI & automation at IDeaS, the AI voice sales agent, Proofline and ClueCode.",
  file: "/resume/Naman_Chordia_Resume.pdf",
  preview: "/resume/previews/Naman_Chordia_Resume.png",
} as const;

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
