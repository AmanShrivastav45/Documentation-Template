import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { RunProvider } from "./context/RunContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./layout/AppLayout";
import { EmptyState } from "./components/signature/EmptyState";

function StubScreen({ name }: { name: string }) {
  return (
    <div className="p-xl">
      <EmptyState title={`${name} screen`} description={`${name} is built in a later task.`} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RunProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<StubScreen name="Compare" />} />
                <Route path="sources" element={<StubScreen name="Sources" />} />
                <Route path="ask" element={<StubScreen name="Ask" />} />
                <Route path="history" element={<StubScreen name="History" />} />
                <Route path="settings" element={<StubScreen name="Settings" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </RunProvider>
    </ThemeProvider>
  );
}
