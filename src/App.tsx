import { Route, Routes, useParams } from "react-router-dom";
import { RequireAuth } from "./hooks/useAuth";
import { CampaignProvider } from "./hooks/useCampaign";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from "./components/layout";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import NewCampaign from "./pages/NewCampaign";
import Campaign from "./pages/Campaign";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

/** /app/campaigns/:id: one provider per campaign (key resets state when the id changes). */
function CampaignRoute() {
  const { id = "" } = useParams();
  return (
    <ErrorBoundary homeHref="/app">
      <CampaignProvider key={id} campaignId={id}>
        <Campaign />
      </CampaignProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="new" element={<NewCampaign />} />
        <Route path="campaigns/:id" element={<CampaignRoute />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
