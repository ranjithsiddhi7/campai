import { SECTION_KEYS, SECTION_LABELS, type SectionKey } from "../../types/campaign";

interface WorkspaceNavProps {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
}

/** The twelve workspace sections: vertical list at lg and above, horizontal scrollable tab strip below. */
export function WorkspaceNav({ active, onSelect }: WorkspaceNavProps) {
  return (
    <nav aria-label="Campaign sections" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 border-b border-line pb-px lg:flex-col lg:border-b-0 lg:pb-0">
        {SECTION_KEYS.map((key) => {
          const isActive = key === active;
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(key)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full whitespace-nowrap rounded px-3 py-2 text-left text-small transition-colors duration-fast focus:outline-none focus-visible:shadow-focus ${
                  isActive
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
                }`}
              >
                {SECTION_LABELS[key]}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
