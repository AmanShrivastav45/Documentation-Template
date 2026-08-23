import type { AskResponse } from "../../types/domain";

export const askFixture: AskResponse = {
  question: "",
  answer:
    "The policy requires a minimum risk weight floor of 15% for RTB positions, with a duration-weighted aggregation methodology across all tenor buckets.",
  sources: [
    {
      source_location: {
        document_name: "RTB_Model_Policy_v3.pdf",
        chunk_index: 43,
        document_type: "pdf",
        match_type: "semantic",
        similarity_score: 0.89,
        context: "For securities borrowing/lending positions, the risk weight floor shall be 15% of gross exposure.",
        url: null,
      },
    },
  ],
};
