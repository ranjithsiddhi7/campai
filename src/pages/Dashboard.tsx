import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCampaign, listCampaigns, renameCampaign } from "../lib/campaigns";
import type { CampaignRow } from "../types/campaign";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout";
import { Button, EmptyState, ErrorState, Input, Modal, PageSpinner, StatusBadge, buttonClasses, useToast } from "../components/ui";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [toDelete, setToDelete] = useState<CampaignRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await listCampaigns());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRename(id: string, title: string) {
    await renameCampaign(id, title);
    await load();
    toast("Campaign renamed");
  }

  async function onConfirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCampaign(toDelete.id);
      setToDelete(null);
      await load();
      toast("Campaign deleted");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete this campaign.");
    } finally {
      setDeleting(false);
    }
  }

  function closeDelete() {
    if (deleting) return;
    setToDelete(null);
    setDeleteError(null);
  }

  if (loading && !campaigns) return <PageSpinner label="Loading your campaigns…" />;

  if (error && !campaigns) {
    return (
      <>
        <PageHeader title="Campaigns" />
        <ErrorState title="We couldn't load your campaigns" message={error} onRetry={load} retrying={loading} />
      </>
    );
  }

  const list = campaigns ?? [];

  return (
    <>
      <PageHeader
        title={
          <>
            Campaigns {list.length > 0 && <span className="text-ink-muted">({list.length})</span>}
          </>
        }
      />
      {error && (
        <div className="mb-6">
          <ErrorState compact title="We couldn't refresh your campaigns" message={error} onRetry={load} retrying={loading} />
        </div>
      )}
      {list.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-8 w-8" aria-hidden="true" />}
          title="No campaigns yet"
          description="Tell us what you want in your own words and we'll build the plan."
          action={
            <Link to="/app/new" className={buttonClasses("primary", "md")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Start your first campaign
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.id}>
              <CampaignCard campaign={c} onRename={onRename} onDelete={() => setToDelete(c)} />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={toDelete !== null}
        onClose={closeDelete}
        busy={deleting}
        title="Delete this campaign? This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={closeDelete} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} busy={deleting} busyLabel="Deleting…">
              {deleteError ? "Retry" : "Delete"}
            </Button>
          </>
        }
      >
        <p>
          <span className="text-ink">{toDelete?.title}</span> and its brief, plan versions and calendar will be removed.
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-state-danger">
            {deleteError}
          </p>
        )}
      </Modal>
    </>
  );
}

const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded text-ink-muted transition-colors duration-fast hover:bg-surface-active hover:text-ink focus:outline-none focus-visible:shadow-focus";

function CampaignCard({
  campaign: c,
  onRename,
  onDelete,
}: {
  campaign: CampaignRow;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(c.title);
  const [saving, setSaving] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const renameButton = useRef<HTMLButtonElement>(null);

  function startEdit() {
    setValue(c.title);
    setRenameError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setRenameError(null);
    requestAnimationFrame(() => renameButton.current?.focus());
  }

  async function save() {
    const next = value.trim();
    if (!next) return setRenameError("Add a name.");
    if (next === c.title) return cancel();
    setSaving(true);
    setRenameError(null);
    try {
      await onRename(c.id, next);
      setEditing(false);
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : "Could not rename this campaign.");
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  return (
    <div className="relative flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-colors duration-base focus-within:border-line-strong hover:border-line-strong hover:bg-surface-hover">
      {editing ? (
        <div className="relative z-10">
          <Input
            label="Campaign name"
            hideLabel
            value={value}
            maxLength={120}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={saving}
            error={renameError}
            hint={saving ? "Saving…" : "Enter to save, Escape to cancel."}
            autoFocus
          />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 min-w-0 break-words text-h3 text-ink">
            {/* The link covers the whole card; the action buttons sit above it. */}
            <Link to={`/app/campaigns/${c.id}`} className="rounded focus:outline-none focus-visible:shadow-focus after:absolute after:inset-0 after:content-['']">
              {c.title}
            </Link>
          </h2>
          <StatusBadge status={c.status} />
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div className="min-w-0">
          <p className="text-caption text-ink-muted">
            Updated {formatDistanceToNow(parseISO(c.updated_at), { addSuffix: true })}
            {c.status === "ready" && c.current_plan_version > 0 && ` · Version ${c.current_plan_version}`}
          </p>
          {c.status === "error" && <span className="mt-2 block text-caption text-state-danger">Retry build</span>}
        </div>
        {!editing && (
          <div className="relative z-10 flex shrink-0 gap-1">
            <button ref={renameButton} type="button" onClick={startEdit} className={iconButton} aria-label={`Rename ${c.title}`} title="Rename">
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={onDelete} className={iconButton} aria-label={`Delete ${c.title}`} title="Delete">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
