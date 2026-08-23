import { setupWorker } from "msw/browser";
import { simpleHandlers } from "./handlers/simple";
import { compareHandlers } from "./handlers/compare";

export const worker = setupWorker(...simpleHandlers, ...compareHandlers);

export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_MVC_USE_MOCKS !== "true") return;
  await worker.start({ onUnhandledRequest: "bypass" });
}
