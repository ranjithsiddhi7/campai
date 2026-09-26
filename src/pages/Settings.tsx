// PLACEHOLDER (change set C1a). The teammate replaces this page on branch "teammate".
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/layout";
import { Card } from "../components/ui";

export default function Settings() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Settings" description={user?.email ?? undefined} />
      <Card title="AI usage">
        <p className="text-small text-ink-muted">Usage summary is coming.</p>
      </Card>
    </>
  );
}
