import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { RunProvider } from "./context/RunContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./layout/AppLayout";
import { CompareScreen } from "./screens/Compare/CompareScreen";
import { SourcesScreen } from "./screens/Sources/SourcesScreen";
import { AskScreen } from "./screens/Ask/AskScreen";
import { HistoryScreen } from "./screens/History/HistoryScreen";
import { SettingsScreen } from "./screens/Settings/SettingsScreen";

export default function App() {
  return (
    <ThemeProvider>
      <RunProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<CompareScreen />} />
                <Route path="sources" element={<SourcesScreen />} />
                <Route path="ask" element={<AskScreen />} />
                <Route path="history" element={<HistoryScreen />} />
                <Route path="settings" element={<SettingsScreen />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </RunProvider>
    </ThemeProvider>
  );
}
