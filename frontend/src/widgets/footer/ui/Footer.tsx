import { privacyAnchorId, privacyTodoNote } from "@/shared/config";
import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";

import styles from "./Footer.module.css";

export function Footer() {
  const t = useT();

  return (
    <footer className={styles.footer}>
      <a className={styles.top} href="#hero">
        {t(content.footer.top)}
      </a>
      <p className={styles.rights}>{t(content.footer.rights)}</p>
      <section id={privacyAnchorId} className={styles.privacy} aria-labelledby="privacy-title">
        <h2 id="privacy-title">{t(content.apply.privacyLink)}</h2>
        <p>{t(privacyTodoNote)}</p>
      </section>
    </footer>
  );
}
