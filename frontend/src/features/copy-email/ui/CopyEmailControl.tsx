import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";

import { useCopyEmail } from "../model/useCopyEmail";

import styles from "./CopyEmailControl.module.css";

type Props = {
  email: string;
};

export function CopyEmailControl({ email }: Props) {
  const t = useT();
  const { justCopied, copyEmail } = useCopyEmail(email);

  return (
    <div className={styles.row}>
      <button type="button" className={styles.button} onClick={() => void copyEmail()}>
        {t(content.contacts.copy)}
      </button>
      {justCopied ? (
        <span className={styles.feedback} role="status" aria-live="polite">
          {t(content.contacts.copied)}
        </span>
      ) : null}
    </div>
  );
}
