import { http, HttpResponse } from "msw";
import { compareFixture } from "../fixtures/compare";
import type { CompareRequest } from "../../types/domain";

const BASE = import.meta.env.VITE_MVC_API_BASE_URL as string;

export const compareHandlers = [
  http.post(`${BASE}/api/v1/compare`, async ({ request }) => {
    const body = (await request.json()) as CompareRequest;

    if (body.run_id !== compareFixture.run_id) {
      return HttpResponse.json(
        {
          detail: `No facts artifact found for run_id '${body.run_id}'. Expected: <artifacts>/code/facts/${body.run_id}_facts.json`,
        },
        { status: 404 }
      );
    }

    let verdicts = compareFixture.verdicts;
    if (body.fact_ids?.length) {
      verdicts = verdicts.filter((v) => body.fact_ids!.includes(v.fact_id));
    }
    if (body.key_only) {
      verdicts = verdicts.slice(0, Math.ceil(verdicts.length * 0.25));
    }

    if (verdicts.length === 0) {
      return HttpResponse.json(
        { detail: "No facts matched the given filters. Check run_id, fact_ids, and key_only." },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      ...compareFixture,
      domain: body.domain,
      facts_compared: verdicts.length,
      verdicts,
      summary: {
        total: verdicts.length,
        aligned: verdicts.filter((v) => v.verdict === "Aligned").length,
        partial: verdicts.filter((v) => v.verdict === "Partial").length,
        misaligned: verdicts.filter((v) => v.verdict === "Misaligned").length,
        unrelated: verdicts.filter((v) => v.verdict === "Unrelated").length,
      },
    });
  }),
];
