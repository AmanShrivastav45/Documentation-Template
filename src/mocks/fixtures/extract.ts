import type { ExtractResponse } from "../../types/domain";

export const extractFixture: ExtractResponse = {
  file_path: "src/trade_handler.py",
  language: "python",
  metadata: {
    url: "https://gitlab.nomura.com/group/repo/-/blob/master/src/trade_handler.py",
    branch: "master",
    requested_at: "2026-08-23T09:20:10.000Z",
  },
  chunk_count: 2,
  key_calculation_count: 1,
  imports_in_file: ["import pandas as pd"],
  chunks: [
    {
      chunk_id: "src/trade_handler.py::TradeHandler::compute_margin",
      type: "method",
      name: "compute_margin",
      qualified_name: "TradeHandler.compute_margin",
      signature: "def compute_margin(self, exposure_df: pd.DataFrame) -> float:",
      docstring: "Computes margin for portfolio.",
      source_code: "def compute_margin(self, exposure_df):\n    return exposure_df['exposure'].sum() * self.haircut_rate",
      start_line: 117,
      end_line: 163,
      parent_context: {
        type: "class",
        name: "TradeHandler",
        docstring: null,
        bases: ["BaseHandler"],
      },
      decorators: [],
      is_key_calculation: true,
    },
    {
      chunk_id: "src/trade_handler.py::TradeHandler::log_trade",
      type: "method",
      name: "log_trade",
      qualified_name: "TradeHandler.log_trade",
      signature: "def log_trade(self, trade_id: str) -> None:",
      docstring: null,
      source_code: "def log_trade(self, trade_id):\n    logger.info('trade %s', trade_id)",
      start_line: 170,
      end_line: 173,
      parent_context: {
        type: "class",
        name: "TradeHandler",
        docstring: null,
        bases: ["BaseHandler"],
      },
      decorators: [],
      is_key_calculation: false,
    },
  ],
};
