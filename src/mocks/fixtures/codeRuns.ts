import type { CodeRun } from "../../types/domain";

export const codeRunsFixture: CodeRun[] = [
  {
    run_id: "20260819_141851_market_risk_engine",
    created_at: "20260819_141851",
    file_path: "risk/market_risk_engine.py",
    language: "python",
    facts_total: 37,
    key_calculation_count: 9,
    llm_refined: true,
    llm_skip_reason: null,
    artifact_path: "C:/data/code/facts/20260819_141851_market_risk_engine_facts.json",
  },
  {
    run_id: "20260821_101200_margin_calculator",
    created_at: "20260821_101200",
    file_path: "risk/margin_calculator.py",
    language: "python",
    facts_total: 14,
    key_calculation_count: 5,
    llm_refined: false,
    llm_skip_reason: "LLM_TIMEOUT",
    artifact_path: "C:/data/code/facts/20260821_101200_margin_calculator_facts.json",
  },
];
