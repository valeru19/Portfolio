import { useCallback, useEffect, useRef, useState } from "react";

import { copyText } from "@/shared/lib";

const FEEDBACK_MS = 1500;

export function useCopyEmail(email: string | null) {
  const [justCopied, setJustCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const copyEmail = useCallback(async () => {
    if (!email) return false;
    const ok = await copyText(email);
    if (!ok) return false;
    setJustCopied(true);
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setJustCopied(false);
    }, FEEDBACK_MS);
    return true;
  }, [email]);

  return { justCopied, copyEmail, isAvailable: Boolean(email) };
}
