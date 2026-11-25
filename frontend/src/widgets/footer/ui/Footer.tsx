import { privacyAnchorId, privacyContactForDeletion } from "@/shared/config";
import { content } from "@/shared/content";
import { useT } from "@/shared/i18n";

import styles from "./Footer.module.css";

export function Footer() {
  const t = useT();
  const privacyContact = privacyContactForDeletion();
  const paragraphs = t(content.privacy.paragraphs);
  const contactLineTemplate = t(content.privacy.contactLine);

  return (
    <footer className={styles.footer}>
      <a className={styles.top} href="#hero">
        {t(content.footer.top)}
      </a>
      <p className={styles.rights}>{t(content.footer.rights)}</p>
      <section id={privacyAnchorId} className={styles.privacy} aria-labelledby="privacy-title">
        <h2 id="privacy-title">{t(content.privacy.title)}</h2>
        {paragraphs.slice(0, 1).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {privacyContact ? (
          <p>{contactLineTemplate.replace("{contact}", privacyContact.value)}</p>
        ) : null}
        {paragraphs.slice(1).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </footer>
  );
}
