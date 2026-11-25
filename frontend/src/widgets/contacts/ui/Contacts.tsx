import { visibleContacts } from "@/shared/config";
import { content, SECTION_INDEX_LABELS } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { assetUrl } from "@/shared/lib";
import { Container, Section, SectionHead } from "@/shared/ui";

import styles from "./Contacts.module.css";

const CONTACT_LOGO: Record<string, string> = {
  github: "assets/github.png",
};

export function Contacts() {
  const t = useT();
  const links = visibleContacts();

  return (
    <Section id="contacts" aria-labelledby="contacts-title">
      <Container>
        <SectionHead
          index={SECTION_INDEX_LABELS.contacts}
          titleId="contacts-title"
          title={t(content.contacts.title)}
        />
        <p className={styles.sub}>{t(content.contacts.subtitle)}</p>
        <div className={styles.grid}>
          {links.map((link) => (
            <a
              key={link.id}
              className={styles.card}
              href={link.href}
              {...(/^https?:/i.test(link.href)
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {CONTACT_LOGO[link.id] ? (
                <img
                  className={styles.logo}
                  src={assetUrl(CONTACT_LOGO[link.id])}
                  alt=""
                />
              ) : null}
              <span className={styles.label}>{link.label}</span>
              <span className={styles.value}>{link.value}</span>
            </a>
          ))}
        </div>
      </Container>
    </Section>
  );
}
