import type { CompareResponse, FactVerdict, Verdict } from "../../types/domain";

const LONG_SNIPPET = Array.from(
  { length: 200 },
  (_, i) => `    step_${i} = intermediate_${i} * factor_${i}  # line ${i + 1}`
).join("\n");

const sixDiscrepancyFact: FactVerdict = {
  fact_id: "CF-0007",
  qualified_name: "RiskEngine.calculate_rwa",
  fact_type: "formula",
  verdict: "Misaligned",
  confidence: 0.74,
  reasoning:
    "The implementation diverges from the policy on multiple points: the floor, the operator used for the exposure haircut, and two missing conditional branches.",
  discrepancies: [
    {
      type: "missing_constraint",
      description: "Code does not apply the regulatory minimum floor of 0.15.",
      rule_text: "Risk weight floor shall be 15% of gross exposure.",
      code_location: "calculate_rwa: return risk_weight * exposure",
    },
    {
      type: "wrong_operator",
      description: "Uses '>' where policy requires '>=' for the threshold check.",
      rule_text: "Positions at or above the threshold shall be flagged.",
      code_location: "calculate_rwa: if exposure > threshold",
    },
    {
      type: "wrong_value",
      description: "Haircut constant is 0.08 in code but 0.10 in policy.",
      rule_text: "Haircut rate shall be 10% for Tier 2 collateral.",
      code_location: "calculate_rwa: haircut = 0.08",
    },
    {
      type: "missing_logic",
      description: "No handling for negative exposure adjustment.",
      rule_text: "Negative exposures shall be floored to zero before weighting.",
      code_location: "calculate_rwa: risk_weight * exposure",
    },
    {
      type: "wrong_formula",
      description: "Aggregation uses simple sum instead of the weighted sum required.",
      rule_text: "Aggregate exposure shall be a duration-weighted sum.",
      code_location: "calculate_rwa: sum(exposures)",
    },
    {
      type: "unimplemented",
      description: "Stress-scenario multiplier from the policy is not applied anywhere.",
      rule_text: "A 1.25x multiplier shall apply under stress scenarios.",
      code_location: "calculate_rwa: (not present)",
    },
  ],
  rule_reference: {
    document_name: "RTB_Model_Policy_v3.pdf",
    chunk_index: 77,
    similarity_score: 0.91,
    rule_text: "Risk weight floor shall be 15% of gross exposure.",
  },
};

const nullRuleReferenceFact: FactVerdict = {
  fact_id: "CF-0021",
  qualified_name: "MarketDataCache.refresh",
  fact_type: "unclassified",
  verdict: "Unrelated",
  confidence: 0.4,
  reasoning: "No corresponding rule text was found in the document corpus for this fact.",
  discrepancies: [],
  rule_reference: null,
};

const longSnippetFact: FactVerdict = {
  fact_id: "CF-0030",
  qualified_name: "PortfolioRiskEngine.compute_stressed_var",
  fact_type: "formula",
  verdict: "Partial",
  confidence: 0.68,
  reasoning:
    "The core VaR computation matches policy, but several intermediate scaling steps are not traceable to a documented requirement.",
  discrepancies: [
    {
      type: "missing_constraint",
      description: "Intermediate scaling steps 40-60 have no documented basis.",
      rule_text: "All intermediate risk scalars must derive from Section 4.2.",
      code_location: "compute_stressed_var: step_40..step_60",
    },
  ],
  rule_reference: {
    document_name: "RTB_Model_Policy_v3.pdf",
    chunk_index: 102,
    similarity_score: 0.83,
    rule_text: "All intermediate risk scalars must derive from Section 4.2.",
  },
};

const longNameFact: FactVerdict = {
  fact_id: "CF-0035",
  qualified_name:
    "RiskEngine.MarketRisk.ExposureAggregation.compute_duration_weighted_net_exposure_across_all_tenor_buckets",
  fact_type: "aggregation",
  verdict: "Aligned",
  confidence: 0.95,
  reasoning: "Duration-weighted aggregation matches the documented methodology exactly.",
  discrepancies: [],
  rule_reference: {
    document_name: "RTB_Model_Policy_v3.pdf",
    chunk_index: 12,
    similarity_score: 0.97,
    rule_text: "Net exposure shall be aggregated as a duration-weighted sum across all tenor buckets.",
  },
};

function makeFact(index: number, verdict: Verdict): FactVerdict {
  const confidence = Number((0.55 + ((index * 7) % 40) / 100).toFixed(2));
  return {
    fact_id: `CF-${String(index).padStart(4, "0")}`,
    qualified_name: `RiskEngine.metric_${index}`,
    fact_type: index % 3 === 0 ? "condition" : "formula",
    verdict,
    confidence,
    reasoning: `Auto-generated fixture reasoning for metric_${index}.`,
    discrepancies:
      verdict === "Aligned" || verdict === "Unrelated"
        ? []
        : [
            {
              type: "wrong_value",
              description: `metric_${index} constant differs from policy value.`,
              rule_text: `Policy fixture text for metric_${index}.`,
              code_location: `metric_${index}: constant = 0`,
            },
          ],
    rule_reference:
      verdict === "Unrelated"
        ? null
        : {
            document_name: "RTB_Model_Policy_v3.pdf",
            chunk_index: index,
            similarity_score: Number((0.6 + (index % 30) / 100).toFixed(2)),
            rule_text: `Policy fixture text for metric_${index}.`,
          },
  };
}

const generatedFacts: FactVerdict[] = [];
const verdictCycle: Verdict[] = ["Aligned", "Aligned", "Partial", "Misaligned", "Unrelated"];
for (let i = 1; i <= 37; i += 1) {
  if ([7, 21, 30, 35].includes(i)) continue;
  generatedFacts.push(makeFact(i, verdictCycle[i % verdictCycle.length]));
}

const allVerdicts = [
  ...generatedFacts,
  sixDiscrepancyFact,
  nullRuleReferenceFact,
  longSnippetFact,
  longNameFact,
].sort((a, b) => Number(a.fact_id.slice(3)) - Number(b.fact_id.slice(3)));

function summarize(verdicts: FactVerdict[]) {
  return {
    total: verdicts.length,
    aligned: verdicts.filter((v) => v.verdict === "Aligned").length,
    partial: verdicts.filter((v) => v.verdict === "Partial").length,
    misaligned: verdicts.filter((v) => v.verdict === "Misaligned").length,
    unrelated: verdicts.filter((v) => v.verdict === "Unrelated").length,
  };
}

export const compareFixture: CompareResponse = {
  run_id: "20260819_141851_market_risk_engine",
  domain: "rtb",
  compared_at: "2026-08-23T09:45:10.000000+00:00",
  total_facts_in_run: 37,
  facts_compared: allVerdicts.length,
  summary: summarize(allVerdicts),
  verdicts: allVerdicts,
  artifact_path: "C:/data/code/verdicts/20260823_094510_market_risk_engine_verdicts.json",
};

export const longSnippetSource = LONG_SNIPPET;
