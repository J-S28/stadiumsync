import { useState } from "react";
import { Siren, Megaphone, Radio } from "lucide-react";
import { Card, SectionHeader, AIBadge, Pill } from "../shared/ui.jsx";
import { callAssistant } from "../lib/callAssistant.js";
import { RAW_REPORTS, INCIDENT_FALLBACK, COMMS_FALLBACK, parseIncidentSummary, parseComms } from "../lib/incident.js";

const LANGS = [["en", "EN"], ["es", "ES"], ["pt", "PT"], ["fr", "FR"], ["de", "DE"]];

export default function IncidentCommandTab() {
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const [description, setDescription] = useState("Dense crowd backing up at Gate 4 due to a bag-check bottleneck.");
  const [lang, setLang] = useState("en");
  const [comms, setComms] = useState(null);
  const [generating, setGenerating] = useState(false);

  const summarize = async () => {
    setSummarizing(true);
    try {
      const reply = await callAssistant({
        mode: "incident",
        messages: RAW_REPORTS.map((r) => ({ role: "user", text: `${r.source}: ${r.text}` })),
      });
      setSummary(reply ? parseIncidentSummary(reply) : INCIDENT_FALLBACK);
    } catch {
      setSummary(INCIDENT_FALLBACK);
    } finally {
      setSummarizing(false);
    }
  };

  const generateComms = async () => {
    if (!description.trim() || generating) return;
    setGenerating(true);
    try {
      const reply = await callAssistant({ mode: "comms", lang, messages: [{ role: "user", text: description }] });
      setComms(reply ? parseComms(reply) : COMMS_FALLBACK);
    } catch {
      setComms(COMMS_FALLBACK);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionHeader label="Incident summarizer" badge={<AIBadge />} />
        <div className="space-y-2 mb-3">
          {RAW_REPORTS.map((r) => (
            <div key={r.source} className="flex items-start gap-2 text-xs text-[#8FA69B]">
              <Radio size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div><span className="text-[#F3F3EF] font-medium">{r.source}:</span> {r.text}</div>
            </div>
          ))}
        </div>
        {summary ? (
          <div className="bg-[#FF6B5B]/10 border border-[#FF6B5B]/25 rounded-xl p-3.5" role="status">
            <div className="flex items-start gap-2.5">
              <Siren size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-sm text-[#F3F3EF] flex-1">
                <div className="mb-1.5">{summary.alert}</div>
                <div className="text-[#FF6B5B] font-medium">{summary.deployment}</div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={summarize}
            disabled={summarizing}
            className="px-3.5 py-1.5 rounded-full bg-[#FF6B5B] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#FF6B5B] focus-visible:outline-none"
          >
            {summarizing ? "Summarizing…" : "Summarize with AI"}
          </button>
        )}
      </Card>

      <Card className="p-5">
        <SectionHeader label="Automated comms" badge={<AIBadge label="AI comms" />} />
        <label htmlFor="incident-description" className="sr-only">Incident description</label>
        <textarea
          id="incident-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={300}
          className="w-full bg-[#16281F] border border-[#223328] rounded-xl px-3.5 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] mb-3 resize-none focus-visible:ring-2 focus-visible:ring-[#3ED07A]"
        />
        <div className="flex items-center gap-1.5 mb-3">
          {LANGS.map(([code, label]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              aria-label={`Generate in ${label}`}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${lang === code ? "bg-[#3ED07A] text-[#0B140F] border-[#3ED07A]" : "bg-transparent text-[#8FA69B] border-[#223328]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={generateComms}
          disabled={generating || !description.trim()}
          className="px-3.5 py-1.5 rounded-full bg-[#3ED07A] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none mb-3"
        >
          {generating ? "Generating…" : "Generate announcement"}
        </button>
        {comms && (
          <div className="space-y-2" role="status">
            <div className="flex items-start gap-2 bg-[#16281F] rounded-xl p-3">
              <Megaphone size={14} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-sm text-[#F3F3EF]">{comms.pa}</div>
            </div>
            <div className="flex items-center gap-2">
              <Pill tone="live">Push</Pill>
              <span className="text-xs text-[#8FA69B]">{comms.push}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
