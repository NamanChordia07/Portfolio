import type { Metadata } from "next";

import { CaseHeader, CaseSection, Decision, NextCase, Prose, Stats } from "@/components/Case";
import { Claim } from "@/components/Claim";
import { Box, Connector } from "@/components/Flow";
import { claims } from "@/content/site";

export const metadata: Metadata = {
  title: "ClueCode: a desktop AI assistant with subscriptions",
  description:
    "Designed and shipped solo: an Electron app that streams multimodal Gemini answers on the user's own key, a Next.js and Postgres backend with device-session leases, Razorpay billing via idempotent webhooks, and 270+ automated tests.",
  alternates: { canonical: "/work/cluecode" },
  openGraph: { url: "/work/cluecode" },
};

const byok = {
  value: "₹0",
  source: "AI inference cost to operate: users bring their own Gemini key, and requests go from the desktop straight to Google, never through ClueCode's servers.",
};
const lease = {
  value: "1",
  source: "Active desktop session per account, enforced by a partial unique index on (user_id) WHERE status = 'active' in Postgres, not just application code.",
};
const threats = {
  value: "15",
  source: "Rows in the written threat model (docs/security.md): each with the attack, the mitigation and the residual risk.",
};

export default function ClueCodePage() {
  return (
    <article>
      <CaseHeader
        kicker="Product · Full-stack · September 2026"
        title="ClueCode"
        lede="A Windows desktop AI assistant with subscriptions. Press a shortcut, it captures the screen, sends it to Gemini with the user's own key, and streams the answer into a small overlay. I designed, built, secured and deployed all of it."
        meta={[
          { label: "Role", value: "Solo: product, architecture, engineering, deployment" },
          { label: "Desktop", value: "Electron, TypeScript, React (control window), vanilla TS overlay" },
          { label: "Backend", value: "Next.js on Vercel, PostgreSQL on Neon, Drizzle, Better Auth, Razorpay" },
          {
            label: "Links",
            value: (
              <span className="flex flex-col gap-1">
                <a className="link" href="https://cluecode.in" target="_blank" rel="noopener noreferrer">
                  cluecode.in ↗
                </a>
                <span className="text-muted">Source is private; happy to walk through it.</span>
              </span>
            ),
          },
        ]}
      />
      <Stats
        items={[
          { claim: claims.ccTests, label: "automated tests: unit, Postgres integration, Electron security, WCAG 2.1 AA E2E" },
          { claim: lease, label: "active device per account, enforced by the database" },
          { claim: byok, label: "inference cost to operate, by design (bring your own key)" },
          { claim: threats, label: "threats modelled, each with mitigation and residual risk" },
        ]}
      />

      <CaseSection id="architecture" label="Architecture" title="Three concepts, three mechanisms">
        <Prose>
          <p>
            The design separates three questions that are easy to tangle: <strong>has this account paid?</strong> (subscriptions, driven
            only by verified payment webhooks), <strong>may this device run the assistant right now?</strong> (a server-side session
            lease), and <strong>who pays for inference?</strong> (the user&apos;s own Gemini key, encrypted on their machine). The server
            is authoritative for the first two; the key never reaches it.
          </p>
        </Prose>
        <div className="mt-8 grid items-stretch gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Box
            title="Desktop (Electron)"
            tone="accent"
            items={[
              "Main process: auth, session lease, key store, screen capture, AI provider, hotkeys",
              "Preload: fixed typed API; ipcRenderer never exposed",
              "Renderers: sandboxed, strict CSP, no network",
            ]}
          />
          <Connector label="HTTPS · bearer tokens" />
          <Box
            title="Web & API (Next.js on Vercel)"
            items={[
              "Better Auth: email + password, verification, resets",
              "Desktop sessions: start, heartbeat, end, revoke",
              "Billing: checkout, signed webhooks, entitlement",
              "Admin console, audit log, daily retention cron",
            ]}
          />
          <Connector label="SQL · webhooks" />
          <Box
            title="Data & services"
            tone="muted"
            items={["PostgreSQL on Neon: the only stateful component", "Razorpay subscriptions", "Google Gemini, called from the desktop with the user's key"]}
          />
        </div>
        <p className="mt-4 text-[13px] text-subtle">
          No Redis or queues: rate limiting and idempotency are atomic Postgres statements. Runtime settings (maintenance mode, minimum
          client version, model list) live in a config table cached for 30 seconds, so they change without a deploy.
        </p>
      </CaseSection>

      <CaseSection id="decisions" label="Decisions" title="The parts worth explaining">
        <Decision title="Session leases the database enforces">
          <p>
            Starting a session locks the user row, checks entitlement, expires lapsed sessions, and inserts a lease: 10 minutes, renewed
            by a heartbeat every 2 minutes, capped at 3 hours. A partial unique index on active sessions makes &ldquo;one device at a
            time&rdquo; a database invariant. All times come from Postgres <code>now()</code> and are sent as relative seconds; the desktop
            tracks them on a monotonic clock, so changing the PC clock does nothing. Crash, sleep, network loss, a second device,
            a payment lapsing mid-session: each has a defined outcome, and the server fails closed.
          </p>
        </Decision>
        <Decision title="Payments as a state machine driven only by signed webhooks">
          <p>
            Access is granted only when a Razorpay webhook with a valid HMAC-SHA256 signature arrives; the browser&apos;s checkout
            callback changes no state. Each event is processed once (a unique <code>(provider, event_id)</code> row inside the same
            transaction), with an out-of-order guard, and maps onto one internal subscription state machine. A single entitlement
            function answers &ldquo;is this account entitled?&rdquo; everywhere, including grace periods for late renewals.
          </p>
        </Decision>
        <Decision title="The user's key never leaves their machine">
          <p>
            The Gemini key is stored with Electron <code>safeStorage</code> (Windows DPAPI, bound to the OS user), decrypted per request,
            never returned to a renderer, never logged, never sent to the server. If the OS cannot encrypt, the app refuses to store it.
            That choice is also the business model: inference costs the operator <Claim claim={byok} />.
          </p>
        </Decision>
        <Decision title="Treat model output as hostile">
          <p>
            A screenshot can contain text written to manipulate the model. The system prompt treats on-screen text as material, not
            instructions; the answer is rendered through a strict sanitizer (no links, images, forms or styles) into a sandboxed renderer
            whose CSP allows no network. An end-to-end test feeds malicious model output and checks nothing executes.
          </p>
        </Decision>
        <Decision title="An AI layer that degrades gracefully">
          <p>
            One provider interface with a single streaming method covers every mode. The model menu is the server&apos;s supported list
            intersected with what the user&apos;s key can reach; a 404 falls back to the default model; a request with no first token in
            time is treated as stalled and moves to another model. Prompts are versioned and the version is logged with each request.
          </p>
        </Decision>
      </CaseSection>

      <CaseSection id="quality" label="Quality" title="Tests that would catch the expensive mistakes">
        <Prose>
          <ul>
            <li>Web unit and integration tests against a real Postgres (started automatically), covering billing, entitlement, sessions and admin permissions.</li>
            <li>Electron security E2E: no Node in renderers, CSP enforced, IPC surface fixed, malicious AI output inert.</li>
            <li>Website E2E with axe checks for WCAG 2.1 AA on every public, customer and admin page, in dark and light themes.</li>
            <li>A full-system journey against production with a real key, and installer plus auto-update tests.</li>
          </ul>
          <p>
            Together that is <Claim claim={claims.ccTests} /> tests in the latest recorded green run.
          </p>
        </Prose>
      </CaseSection>

      <CaseSection id="boundary" label="Product boundary" title="What it deliberately does not do">
        <Prose>
          <p>
            ClueCode is an ordinary visible window. It does not hide from screen sharing, recording or proctoring software, and its prompts
            do not try to disguise AI output. It is built for coding practice, learning (its Hint mode gives nudges rather than answers),
            and work where AI assistance is permitted. That boundary is written into the product&apos;s documentation and its behaviour.
          </p>
        </Prose>
      </CaseSection>

      <NextCase
        href="/work/enterprise-automation"
        title="Enterprise automation at IDeaS"
        note="Report pipelines, browser automation and a legacy modernisation."
      />
    </article>
  );
}
