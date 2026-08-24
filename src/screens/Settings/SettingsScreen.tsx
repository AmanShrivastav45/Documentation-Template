import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useHealth } from "../../hooks/useHealth";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { TextInput } from "../../components/primitives/TextInput";
import { getApiBaseUrl, setApiBaseUrl, getApiTimeoutMs, setApiTimeoutMs } from "../../api/config";

const MOCKS_ENABLED = import.meta.env.VITE_MVC_USE_MOCKS === "true";

export function SettingsScreen() {
  const { mode, setMode } = useTheme();
  const health = useHealth();
  const [baseUrl, setBaseUrlState] = useState(getApiBaseUrl());
  const [timeoutMs, setTimeoutState] = useState(String(getApiTimeoutMs()));
  const [saved, setSaved] = useState(false);

  function commitBaseUrl() {
    if (baseUrl.trim().length === 0) return;
    setApiBaseUrl(baseUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function commitTimeout() {
    const parsed = Number(timeoutMs);
    if (!Number.isNaN(parsed) && parsed > 0) setApiTimeoutMs(parsed);
  }

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <h1 className="text-title-xl text-ink">Settings</h1>

      <section className="flex flex-col gap-md">
        <h2 className="text-title-md text-ink">Theme</h2>
        <SegmentedControl
          aria-label="Theme"
          value={mode}
          onChange={setMode}
          segments={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-title-md text-ink">API configuration</h2>
        {MOCKS_ENABLED && (
          <p className="text-body-sm text-mute">
            Mock data is enabled (<code className="inline-code font-mono font-mono-noliga">VITE_MVC_USE_MOCKS=true</code>).
            Changing the base URL below only takes effect once mocking is disabled.
          </p>
        )}
        <TextInput
          id="settings-base-url"
          label="API base URL"
          mono
          value={baseUrl}
          onChange={(e) => setBaseUrlState(e.target.value)}
          onBlur={commitBaseUrl}
        />
        {saved && <p className="text-body-sm text-verdict-aligned">Saved.</p>}
        <TextInput
          id="settings-timeout"
          label="Request timeout (ms)"
          mono
          value={timeoutMs}
          onChange={(e) => setTimeoutState(e.target.value)}
          onBlur={commitTimeout}
        />
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-title-md text-ink">Backend health</h2>
        <p className="text-body-md text-ink">
          Status:{" "}
          {health.status === "success" && health.data?.status === "ok"
            ? "Reachable"
            : health.status === "error"
              ? "Unreachable"
              : "Checking…"}
        </p>
        <p className="text-body-sm text-mute font-mono font-mono-noliga">{getApiBaseUrl()}</p>
      </section>
    </div>
  );
}
