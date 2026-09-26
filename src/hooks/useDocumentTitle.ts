import { useEffect } from "react";

/** Sets document.title to "<title> · campAI" (or just "campAI"). */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · campAI` : "campAI";
  }, [title]);
}
