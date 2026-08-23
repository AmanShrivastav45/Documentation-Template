import type { IngestResponse } from "../../types/domain";

export const ingestFixture: IngestResponse = {
  source_metadata: {
    file_path: "src/trade_handler.py",
    language: "python",
    chunk_count: 2,
    key_calculation_count: 1,
    imports_in_file: ["import pandas as pd"],
  },
  normalization_summary: {
    facts_total: 2,
    formula_facts: 1,
    condition_facts: 0,
    aggregation_facts: 1,
    constant_facts: 0,
    data_dependency_facts: 0,
    function_dependency_facts: 0,
    unclassified_facts: 0,
  },
  code_facts: [
    {
      fact_id: "CF-0001",
      fact_type: "formula",
      name: "compute_margin",
      qualified_name: "TradeHandler.compute_margin",
      origin: {
        file_path: "src/trade_handler.py",
        qualified_name: "TradeHandler.compute_margin",
        start_line: 117,
        end_line: 163,
      },
      logic: {
        canonical_expression: "return exposure * haircut_rate",
        operators: ["*"],
        functions_called: ["sum"],
      },
      semantics: {
        business_intent: "Compute margin from exposure and haircut",
        is_key_calculation: true,
        confidence: 0.92,
      },
      evidence: {
        code_snippet: "def compute_margin(self, exposure_df):\n    return exposure_df['exposure'].sum() * self.haircut_rate",
        decorators: [],
      },
      embedding_text: "Type: formula. Computes margin from exposure and haircut.",
    },
  ],
  chunk_index: [
    {
      chunk_id: "src/trade_handler.py::TradeHandler::compute_margin",
      qualified_name: "TradeHandler.compute_margin",
      type: "method",
      start_line: 117,
      end_line: 163,
      fact_ids: ["CF-0001"],
    },
  ],
  normalization_warnings: [],
  llm_refined: true,
  llm_skip_reason: null,
};
