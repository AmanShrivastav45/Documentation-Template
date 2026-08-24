import { http, HttpResponse } from "msw";
import { domainsFixture } from "../fixtures/domains";
import { documentsFixture } from "../fixtures/documents";
import { codeRunsFixture } from "../fixtures/codeRuns";
import { extractFixture } from "../fixtures/extract";
import { ingestFixture } from "../fixtures/ingest";
import { askFixture } from "../fixtures/ask";

const BASE = import.meta.env.VITE_MVC_API_BASE_URL as string;

export const simpleHandlers = [
  http.get(`${BASE}/api/v1/health`, () => HttpResponse.json({ status: "ok" })),
  http.get(`${BASE}/api/v1/documents/domains`, () => HttpResponse.json(domainsFixture)),
  http.get(`${BASE}/api/v1/documents/list`, () =>
    HttpResponse.json({ documents: documentsFixture })
  ),
  http.post(`${BASE}/api/v1/documents/upload`, async ({ request }) => {
    const form = await request.formData();
    const domain = String(form.get("domain") ?? "rtb");
    if (!domainsFixture.domains.includes(domain)) {
      return HttpResponse.json(
        {
          detail: [
            {
              message: `Unsupported domain '${domain}'.`,
              allowed_domains: domainsFixture.domains,
            },
          ],
        },
        { status: 422 }
      );
    }
    const file = form.get("file") as File | null;
    const filename = file?.name ?? "unknown";
    return HttpResponse.json(
      {
        filename,
        domain,
        saved_path: `C:/data/uploads/documents/${filename}`,
        metadata_path: `C:/data/uploads/metadata/${filename}_metadata.json`,
        ingestion_result: { status: "ingested", was_added: true, filename },
      },
      { status: 201 }
    );
  }),
  http.get(`${BASE}/api/v1/code/runs`, () => HttpResponse.json({ runs: codeRunsFixture })),
  http.post(`${BASE}/api/v1/code/extract`, async ({ request }) => {
    const body = (await request.json()) as { url: string };
    const match = /^https:\/\/.+\/-\/blob\/[^/]+\/(.+)$/.exec(body.url);
    if (!match) {
      return HttpResponse.json(
        {
          detail:
            "Cannot parse GitLab URL. Expected: https://gitlab.nomura.com/group/repo/-/blob/branch/path/to/file",
        },
        { status: 400 }
      );
    }
    const path = match[1];
    if (path === "src/no_token.py") {
      return HttpResponse.json(
        { detail: "GITLAB_TOKEN is not configured. Set the GITLAB_TOKEN environment variable." },
        { status: 401 }
      );
    }
    return HttpResponse.json(extractFixture);
  }),
  http.post(`${BASE}/api/v1/code/ingest`, () => HttpResponse.json(ingestFixture)),
  http.post(`${BASE}/api/v1/documents/query`, async ({ request }) => {
    const body = (await request.json()) as { question: string };
    return HttpResponse.json({ ...askFixture, question: body.question });
  }),
];
