import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Wand2 } from "lucide-react";
import { useCampaign } from "../../hooks/useCampaign";
import { Button, Input, Spinner, buttonClasses } from "../ui";

const MIN = 3;
const MAX = 500;
const LENGTH_MESSAGE = "Describe the change in a few words, up to 500 characters.";
const RESETS_NOTE = "Your daily AI allowance resets at midnight UTC (Coordinated Universal Time).";

/** Plain-language revision request. No props: everything comes from useCampaign(). No lock UI (cut). */
export function ReviseBar() {
  const { requestRevision, revising, proposal, reviseError, saving } = useCampaign();
  const [instruction, setInstruction] = useState("");
  const [lastInstruction, setLastInstruction] = useState("");
  const [invalid, setInvalid] = useState(false);

  const blocked = proposal !== null;
  const disabled = revising || blocked || saving;

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < MIN || trimmed.length > MAX) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setLastInstruction(trimmed);
    void requestRevision(trimmed).then(() => setInstruction(""));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(instruction);
  };

  const code = reviseError?.code;
  const canRetry = code !== "daily_limit_reached" && code !== "refused";

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={onSubmit} className="flex items-start gap-3" noValidate>
        <div className="min-w-0 flex-1">
          <Input
            label="Ask for a change"
            hideLabel
            placeholder="For example: make it suitable for younger customers"
            value={instruction}
            maxLength={MAX}
            onChange={(e) => {
              setInstruction(e.target.value);
              if (invalid) setInvalid(false);
            }}
            disabled={disabled}
            error={invalid ? LENGTH_MESSAGE : null}
          />
        </div>
        <Button type="submit" size="lg" className="h-11" disabled={disabled} icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}>
          Revise
        </Button>
      </form>

      {revising && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Spinner size="sm" label="Revising your campaign…" />
          <span className="text-caption text-ink-muted">This usually takes 30 to 90 seconds.</span>
        </div>
      )}

      {blocked && !revising && <p className="text-caption text-ink-muted">Apply or discard the current proposal first.</p>}

      {reviseError && !revising && !blocked && (
        <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-small">
          <span className="text-state-danger">{reviseError.message}</span>
          {code === "daily_limit_reached" && (
            <>
              <span className="text-ink-muted">{RESETS_NOTE}</span>
              <Link to="/app/settings" className={buttonClasses("secondary", "sm")}>
                See your usage
              </Link>
            </>
          )}
          {canRetry && lastInstruction && (
            <Button variant="secondary" size="sm" onClick={() => submit(lastInstruction)}>
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
