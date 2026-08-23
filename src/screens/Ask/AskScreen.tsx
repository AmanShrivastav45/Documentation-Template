import { useState } from "react";
import { useDomains } from "../../hooks/useDomains";
import { useAsk } from "../../hooks/useAsk";
import { useToast } from "../../context/ToastContext";
import { SelectField } from "../../components/primitives/SelectField";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { Button } from "../../components/primitives/Button";
import { EmptyState } from "../../components/signature/EmptyState";
import { Skeleton } from "../../components/signature/Skeleton";
import { SourceCard } from "./SourceCard";
import { ApiClientError } from "../../api/client";
import type { PromptType, SearchProfile } from "../../types/domain";

const PROMPT_TYPES: PromptType[] = [
  "default", "classification", "analysis", "audit", "business", "rtb", "user", "development",
];

export function AskScreen() {
  const domainsQuery = useDomains();
  const ask = useAsk();
  const { showToast } = useToast();
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("");
  const [promptType, setPromptType] = useState<PromptType>("default");
  const [searchProfile, setSearchProfile] = useState<SearchProfile>("balanced");

  const activeDomain = domain || domainsQuery.data?.default_domain || "";

  async function handleAsk() {
    try {
      await ask.run({ question, domain: activeDomain, prompt_type: promptType, search_profile: searchProfile });
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Question failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <h1 className="text-title-xl text-ink">Ask</h1>

      <div className="flex flex-col gap-md">
        <label htmlFor="ask-question" className="text-label-md text-mute">
          Question
        </label>
        <textarea
          id="ask-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="What is the expected risk weighting approach for SBL positions?"
          className="rounded-md border border-hairline-strong bg-canvas text-body-md p-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <div className="flex flex-wrap items-end gap-md">
          <SelectField
            id="ask-domain"
            label="Domain"
            value={activeDomain as never}
            options={(domainsQuery.data?.domains ?? []).map((d) => ({ value: d as never, label: d }))}
            onChange={(v) => setDomain(v)}
          />
          <SelectField
            id="ask-prompt-type"
            label="Prompt type"
            value={promptType as never}
            options={PROMPT_TYPES.map((p) => ({ value: p as never, label: p }))}
            onChange={(v) => setPromptType(v as PromptType)}
          />
          <div className="flex flex-col gap-xxs">
            <span className="text-label-md text-mute">Search profile</span>
            <SegmentedControl
              aria-label="Search profile"
              value={searchProfile}
              onChange={setSearchProfile}
              segments={[
                { value: "precise", label: "Precise" },
                { value: "balanced", label: "Balanced" },
                { value: "comprehensive", label: "Comprehensive" },
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleAsk}
            loading={ask.status === "loading"}
            disabled={question.trim().length === 0}
            className="ml-auto"
          >
            Ask
          </Button>
        </div>
      </div>

      {ask.status === "loading" && (
        <div className="flex flex-col gap-sm">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {ask.data && (
        <div className="flex flex-col gap-lg">
          <p className="text-body-lg text-body max-w-[72ch]">{ask.data.answer}</p>
          <div className="flex flex-col gap-md">
            {ask.data.sources.map((s, i) => (
              <SourceCard key={i} source={s} />
            ))}
          </div>
        </div>
      )}

      {!ask.data && ask.status !== "loading" && (
        <EmptyState title="No question asked yet" description="Ask a question above to search the document corpus." />
      )}
    </div>
  );
}
