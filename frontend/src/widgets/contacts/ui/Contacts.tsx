import type { ReactNode } from "react";

import { CopyEmailControl } from "@/features/copy-email";
import { NavSection } from "@/features/section-navigation";
import { privacyEmailAddress, visibleContacts } from "@/shared/config";
import { content, getSectionIndexLabel } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { assetUrl } from "@/shared/lib";
import { Container, SectionHead } from "@/shared/ui";

import styles from "./Contacts.module.css";

const CONTACT_LOGO: Record<string, string> = {
  github: "assets/github.png",
};

type Props = {
  /** Rendered inside the contacts panel (e.g. Footer + privacy). */
  endSlot?: ReactNode;
};

export function Contacts({ endSlot }: Props) {
  const t = useT();
  const links = visibleContacts();
  const email = privacyEmailAddress();

  return (
    <NavSection id="contacts" aria-labelledby="contacts-title">
      <Container>
        <SectionHead
          index={getSectionIndexLabel("contacts")}
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
                <img className={styles.logo} src={assetUrl(CONTACT_LOGO[link.id])} alt="" />
              ) : null}
              <span className={styles.label}>{link.label}</span>
              <span className={styles.value}>{link.value}</span>
            </a>
          ))}
        </div>
        {email ? <CopyEmailControl email={email} /> : null}
      </Container>
      {endSlot}
    </NavSection>
  );
}
