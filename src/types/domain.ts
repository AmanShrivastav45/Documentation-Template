export type Verdict = "Aligned" | "Partial" | "Misaligned" | "Unrelated";

export type SearchProfile = "precise" | "balanced" | "comprehensive";

export interface CompareSummary {
  total: number;
  aligned: number;
  partial: number;
  misaligned: number;
  unrelated: number;
}

export type DiscrepancyType =
  | "wrong_value"
  | "missing_constraint"
  | "wrong_formula"
  | "missing_logic"
  | "wrong_operator"
  | "unimplemented";

export interface Discrepancy {
  type: DiscrepancyType;
  description: string;
  rule_text?: string | null;
  code_location?: string | null;
}

export interface RuleReference {
  document_name: string;
  chunk_index: number;
  similarity_score: number;
  rule_text: string;
}

export interface FactVerdict {
  fact_id: string;
  qualified_name: string;
  fact_type: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  discrepancies: Discrepancy[];
  rule_reference?: RuleReference | null;
}

export interface CompareResponse {
  run_id: string;
  domain: string;
  compared_at: string;
  total_facts_in_run: number;
  facts_compared: number;
  summary: CompareSummary;
  verdicts: FactVerdict[];
  artifact_path?: string | null;
}

export interface CompareRequest {
  run_id: string;
  domain: string;
  fact_ids?: string[] | null;
  key_only: boolean;
  search_profile: SearchProfile;
}

export interface DomainsResponse {
  default_domain: string;
  domains: string[];
}

export type IngestionStatus = "ingested" | "pending" | "failed";

export interface DocumentRecord {
  filename: string;
  domain: string;
  uploaded_at: string;
  saved_path: string;
  metadata_path: string;
  ingestion_status: IngestionStatus;
  was_added: boolean;
}

export interface UploadResponse {
  filename: string;
  domain: string;
  saved_path: string;
  metadata_path: string;
  ingestion_result: {
    status: IngestionStatus;
    was_added: boolean;
    filename: string;
  };
}

export type PromptType =
  | "default"
  | "classification"
  | "analysis"
  | "audit"
  | "business"
  | "rtb"
  | "user"
  | "development";

export interface AskRequest {
  question: string;
  domain: string;
  prompt_type: PromptType;
  search_profile: SearchProfile;
}

export interface AskSource {
  source_location: {
    document_name: string;
    chunk_index: number;
    document_type: string;
    match_type: string;
    similarity_score: number;
    context: string;
    url: string | null;
  };
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: AskSource[];
}

export interface CodeRun {
  run_id: string;
  created_at: string;
  file_path: string;
  language: string;
  facts_total: number;
  key_calculation_count: number;
  llm_refined: boolean;
  llm_skip_reason: string | null;
  artifact_path: string;
}

export interface ExtractRequest {
  url: string;
  branch?: string | null;
  key_only: boolean;
}

export interface CodeChunk {
  chunk_id: string;
  type: string;
  name: string;
  qualified_name: string;
  signature: string;
  docstring: string | null;
  source_code: string;
  start_line: number;
  end_line: number;
  parent_context: {
    type: string;
    name: string;
    docstring: string | null;
    bases: string[];
  } | null;
  decorators: string[];
  is_key_calculation: boolean;
}

export interface ExtractResponse {
  file_path: string;
  language: string;
  metadata: {
    url: string;
    branch: string;
    requested_at: string;
  };
  chunk_count: number;
  key_calculation_count: number;
  imports_in_file: string[];
  chunks: CodeChunk[];
}

export interface CodeFact {
  fact_id: string;
  fact_type: string;
  name: string;
  qualified_name: string;
  origin: {
    file_path: string;
    qualified_name: string;
    start_line: number;
    end_line: number;
  };
  logic: {
    canonical_expression: string;
    operators: string[];
    functions_called: string[];
  };
  semantics: {
    business_intent: string;
    is_key_calculation: boolean;
    confidence: number;
  };
  evidence: {
    code_snippet: string;
    decorators: string[];
  };
  embedding_text: string;
}

export interface IngestResponse {
  source_metadata: {
    file_path: string;
    language: string;
    chunk_count: number;
    key_calculation_count: number;
    imports_in_file: string[];
  };
  normalization_summary: {
    facts_total: number;
    formula_facts: number;
    condition_facts: number;
    aggregation_facts: number;
    constant_facts: number;
    data_dependency_facts: number;
    function_dependency_facts: number;
    unclassified_facts: number;
  };
  code_facts: CodeFact[];
  chunk_index: Array<{
    chunk_id: string;
    qualified_name: string;
    type: string;
    start_line: number;
    end_line: number;
    fact_ids: string[];
  }>;
  normalization_warnings: string[];
  llm_refined: boolean;
  llm_skip_reason: string | null;
}

export interface HealthStatus {
  status: "ok" | "unreachable";
}
