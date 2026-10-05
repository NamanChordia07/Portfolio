import type { Metadata } from "next";

import { CaseHeader, CaseSection, Decision, NextCase, Prose, Stats } from "@/components/Case";
import { Claim } from "@/components/Claim";
import { Box, Connector } from "@/components/Flow";
import { claims } from "@/content/site";

const REPO = "https://github.com/NamanChordia07/ai-voice-sales-agent";

export const metadata: Metadata = {
  title: "AI Voice Sales Agent",
  description:
    "An outbound AI voice agent that phones leads, runs an adaptive qualification conversation and hands qualified leads to sales: streaming STT and TTS, barge-in, validated LLM actions, FreJun telephony, ~2.9 s median response.",
  alternates: { canonical: "/work/voice-sales-agent" },
  openGraph: { url: "/work/voice-sales-agent" },
};

export default function VoiceSalesAgentPage() {
  return (
    <article>
      <CaseHeader
        kicker="Client project · Voice AI · September–October 2026"
        title="AI Voice Sales Agent"
        lede="A lead sheet goes in. The system calls each lead, holds a scripted but adaptive conversation, records what it learns, and hands qualified leads to a human sales team. Built with a teammate for a client's lead-qualification campaign."
        meta={[
          {
            label: "Role",
            value:
              "Co-developer, team of two. I owned the FreJun telephony integration, call lifecycle, latency work and the browser demo; my teammate Karthik Nambiar built the core engine.",
          },
          { label: "Stack", value: "Python, FastAPI, PostgreSQL, WebSockets, OpenAI speech-to-text, LLM and text-to-speech" },
          { label: "Telephony", value: "FreJun (Teler) active; Exotel and Twilio adapters behind the same interface" },
          {
            label: "Links",
            value: (
              <a className="link" href={REPO} target="_blank" rel="noopener noreferrer">
                Source on GitHub ↗
              </a>
            ),
          },
        ]}
      />
      <Stats
        items={[
          { claim: claims.vaLatency, label: "median from the prospect finishing a sentence to the agent's first audio" },
          { claim: claims.vaTests, label: "automated tests: providers, routes, call lifecycle, engine regressions" },
          { value: "3", label: "telephony providers behind one interface: FreJun, Exotel, Twilio" },
          { value: "DNC first", label: "do-not-call is checked before every dial and every other rule" },
        ]}
      />

      <CaseSection id="architecture" label="Architecture" title="Two loops that never share a thread of logic">
        <Prose>
          <p>
            A phone call is two different problems. The <strong>media loop</strong> moves audio in real time: frames from the carrier,
            voice-activity detection, barge-in, and paced playback back to the line. The <strong>agent loop</strong> decides what to say:
            a state machine, a prompt, the model&apos;s proposal, and validation. They meet at one narrow seam: text in, text and an
            end-of-call flag out. That separation is what made it possible to swap carriers, and to run the same agent in the browser.
          </p>
        </Prose>
        <div className="mt-8 grid items-stretch gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Box
            title="Campaigns & calls"
            items={[
              "Lead CSV import, normalised to E.164",
              "Postgres work queue (FOR UPDATE SKIP LOCKED)",
              "One row per call attempt, unique per (campaign, lead, attempt)",
              "FreJun: initiate, call-flow endpoint, signed status webhooks",
            ]}
          />
          <Connector label="media WebSocket" />
          <Box
            title="Voice session"
            tone="accent"
            items={[
              "Speech-to-text on each utterance",
              "Voice-activity detection and barge-in with a grace window",
              "Text-to-speech streamed in small pieces, paced in real time",
            ]}
          />
          <Connector label="text in, text out" />
          <Box
            title="Agent"
            tone="muted"
            items={[
              "Script as a state machine (config, not code)",
              "LLM proposes a reply, facts and tool calls as structured output",
              "Validator: schema, allowed transition, allowed tool, else fallback",
              "Rules compute the qualification outcome",
            ]}
          />
        </div>
      </CaseSection>

      <CaseSection id="decisions" label="Decisions" title="The parts worth explaining">
        <Decision title="The model proposes; the application decides">
          <p>
            Every turn the LLM returns structured output: what to say, which state to move to, facts it heard, and any tool it wants to
            call. Nothing acts on that until a validator has checked the JSON, the schema, that the state transition is allowed by the
            script, and that the tool is in the registry. Anything malformed or disallowed falls back to the script&apos;s own line for
            the current state, so a bad model response costs one awkward sentence, never an ungoverned action. The model also never
            decides whether a lead qualifies: it reports facts, and configured rules compute the outcome.
          </p>
        </Decision>
        <Decision title="Do-not-call always wins">
          <p>
            Opt-outs write to one suppression table that every dial checks first, whether they came from the agent mid-call or from an
            operator. Scripts, qualification thresholds and prompts live in versioned YAML, so changing a client&apos;s pitch or bar is a
            configuration change, never a code change.
          </p>
        </Decision>
        <Decision title="Plain, idempotent plumbing">
          <p>
            No Kafka, Redis or workflow engine: a Postgres queue with <code>SKIP LOCKED</code> hands leads to workers, and each call
            attempt is its own row with a unique constraint, so a retry is a new attempt, never a duplicate dial. Status webhooks are
            verified with HMAC-SHA256 and a five-minute replay window, and hang-ups carry an idempotency key.
          </p>
        </Decision>
      </CaseSection>

      <CaseSection id="my-work" label="My part" title="Getting it onto a real phone line, and making it fast">
        <Prose>
          <ul>
            <li>
              <strong>FreJun (Teler) integration</strong>, built from FreJun&apos;s docs and official SDK: outbound initiation, the call-flow
              endpoint that answers with a stream flow, a media WebSocket that translates Teler&apos;s audio messages to the voice session
              and back, signed JSON status webhooks, and hang-up.
            </li>
            <li>
              <strong>Call lifecycle</strong>: leads now leave &ldquo;in progress&rdquo; when the media stream ends or a terminal webhook
              arrives, and the attempt is committed before dialling so the carrier&apos;s callbacks can always find it.
            </li>
            <li>
              <strong>Bugs found in live testing</strong>: the prompt context stuck on the first state, a failed tool call crashing the
              turn, the model never seeing tool argument schemas (so qualification was never recorded), duplicate callbacks, and the agent
              hanging up when asked who was calling.
            </li>
            <li>
              <strong>Latency</strong>: models re-chosen by benchmark on this project&apos;s own prompt (the LLM&apos;s time to a speakable
              reply fell from 1.96 s to 0.84 s), one pooled client, a cache-friendly prompt order, a single deadline per turn instead of two
              stacked timeouts, and smaller audio chunks. The browser demo now plays speech as it streams, with barge-in, at a measured{" "}
              <Claim claim={claims.vaLatency} /> median.
            </li>
          </ul>
        </Prose>
      </CaseSection>

      <CaseSection id="next" label="Next" title="Limits, honestly">
        <Prose>
          <ul>
            <li>
              The FreJun call path is built and tested end to end in code; the first real phone call through it waits on the client&apos;s
              carrier account setup (Indian numbers need KYC).
            </li>
            <li>
              Speech-to-text, the LLM and text-to-speech are three sequential network calls, so sub-second replies need a different
              design: streaming the caller&apos;s audio during speech, or a speech-to-speech model, which would speak before the validator
              can check the reply. That trade-off is a decision for the client, not a tweak.
            </li>
            <li>Client-specific scripts, numbers and credentials are kept out of the repository; it ships placeholder scripts.</li>
          </ul>
        </Prose>
      </CaseSection>

      <NextCase href="/work/cluecode" title="ClueCode" note="A desktop AI assistant with subscriptions, shipped end to end." />
    </article>
  );
}
