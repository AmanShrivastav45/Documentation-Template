import { useState } from "react";
import type { CodeRun, SearchProfile, Verdict } from "../../types/domain";
import { SelectField } from "../../components/primitives/SelectField";
import { Toggle } from "../../components/primitives/Toggle";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { Button } from "../../components/primitives/Button";
import { FactMultiselect } from "../../components/signature/FactMultiselect";

interface FactOption {
  factId: string;
  qualifiedName: string;
  verdict?: Verdict;
}

interface ControlBarProps {
  domains: string[];
  domain: string;
  onDomainChange: (d: string) => void;
  runs: CodeRun[];
  runId: string;
  onRunIdChange: (id: string) => void;
  keyOnly: boolean;
  onKeyOnlyChange: (v: boolean) => void;
  searchProfile: SearchProfile;
  onSearchProfileChange: (p: SearchProfile) => void;
  factOptions: FactOption[];
  factIds: string[] | null;
  onFactIdsChange: (ids: string[] | null) => void;
  onCompare: () => void;
  comparing: boolean;
  collapsed: boolean;
  onEdit: () => void;
}

function ControlBarFields(props: ControlBarProps) {
  const selectedRun = props.runs.find((r) => r.run_id === props.runId);
  const keyCount = selectedRun?.key_calculation_count ?? 0;
  const totalCount = selectedRun?.facts_total ?? 0;

  return (
    <>
      <SelectField
        id="compare-domain"
        label="Domain"
        value={props.domain as never}
        placeholder="Select domain"
        options={props.domains.map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => props.onDomainChange(v)}
      />
      <SelectField
        id="compare-run"
        label="Run"
        value={props.runId as never}
        placeholder="Select run"
        options={props.runs.map((r) => ({
          value: r.run_id as never,
          label: `${r.run_id} — ${r.file_path} (${r.facts_total} facts${r.llm_refined ? ", llm-refined" : ""})`,
        }))}
        onChange={(v) => props.onRunIdChange(v)}
      />
      <Toggle
        id="compare-key-only"
        checked={props.keyOnly}
        onChange={props.onKeyOnlyChange}
        label={`Key calculations only (${keyCount} of ${totalCount})`}
      />
      <div className="flex flex-col gap-xxs">
        <span className="text-label-md text-mute">Search profile</span>
        <SegmentedControl
          aria-label="Search profile"
          value={props.searchProfile}
          onChange={props.onSearchProfileChange}
          segments={[
            { value: "precise", label: "Precise" },
            { value: "balanced", label: "Balanced" },
            { value: "comprehensive", label: "Comprehensive" },
          ]}
        />
        <span className="text-caption text-mute max-w-[32ch]">
          Comprehensive searches more of the corpus and takes longer.
        </span>
      </div>
      {props.factOptions.length > 0 && (
        <FactMultiselect facts={props.factOptions} selected={props.factIds} onChange={props.onFactIdsChange} />
      )}
      <Button
        variant="primary"
        onClick={props.onCompare}
        loading={props.comparing}
        loadingLabel={`Comparing ${totalCount || "…"} facts…`}
        disabled={!props.domain || !props.runId}
        className="md:ml-auto"
      >
        Compare
      </Button>
    </>
  );
}

export function ControlBar(props: ControlBarProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  if (props.collapsed) {
    return (
      <div className="h-10 flex items-center gap-sm px-lg bg-surface border-b border-hairline">
        <span className="font-mono font-mono-noliga text-mono-id text-ink">
          {props.domain} · {props.runId} · {props.searchProfile}
          {props.keyOnly ? " · key only" : ""}
        </span>
        <Button variant="quiet" onClick={props.onEdit}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-surface border-b border-hairline">
      <div className="hidden md:flex flex-wrap items-end gap-md p-lg">
        <ControlBarFields {...props} />
      </div>
      <div className="md:hidden p-lg">
        <Button variant="outline" onClick={() => setMobileSheetOpen(true)} className="w-full">
          Set up compare
        </Button>
      </div>
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation" onClick={() => setMobileSheetOpen(false)}>
          <div className="absolute inset-0 bg-overlay" />
          <div
            className="absolute inset-x-0 bottom-0 bg-surface-raised rounded-t-lg shadow-pop p-lg flex flex-col gap-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ControlBarFields
              {...props}
              onCompare={() => {
                props.onCompare();
                setMobileSheetOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
