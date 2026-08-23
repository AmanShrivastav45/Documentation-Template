import type { DocumentRecord } from "../../types/domain";

export const documentsFixture: DocumentRecord[] = [
  {
    filename: "RTB_Model_Policy_v3.pdf",
    domain: "rtb",
    uploaded_at: "2026-08-19T09:12:10.113Z",
    saved_path: "C:/data/uploads/documents/RTB_Model_Policy_v3.pdf",
    metadata_path: "C:/data/uploads/metadata/RTB_Model_Policy_v3_metadata.json",
    ingestion_status: "ingested",
    was_added: true,
  },
  {
    filename: "SBI_Margin_Framework.docx",
    domain: "sbi",
    uploaded_at: "2026-08-20T14:02:41.000Z",
    saved_path: "C:/data/uploads/documents/SBI_Margin_Framework.docx",
    metadata_path: "C:/data/uploads/metadata/SBI_Margin_Framework_metadata.json",
    ingestion_status: "pending",
    was_added: true,
  },
  {
    filename: "Exposure_Notes.txt",
    domain: "exposure",
    uploaded_at: "2026-08-21T11:30:00.000Z",
    saved_path: "C:/data/uploads/documents/Exposure_Notes.txt",
    metadata_path: "C:/data/uploads/metadata/Exposure_Notes_metadata.json",
    ingestion_status: "failed",
    was_added: false,
  },
];
