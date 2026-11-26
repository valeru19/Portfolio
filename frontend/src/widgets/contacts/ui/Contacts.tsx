import type { ReactNode } from "react";

import { CopyEmailControl } from "@/features/copy-email";
import { NavSection } from "@/features/section-navigation";
import { privacyEmailAddress, visibleContacts } from "@/shared/config";
import { content, getSectionIndexLabel } from "@/shared/content";
import { useT } from "@/shared/i18n";
import { assetUrl } from "@/shared/lib";
import { Container, SectionHead } from "@/shared/ui";

import styles from "./Contacts.module.css";

const CONTACT_ICON: Record<string, string> = {
  email: "assets/email.png",
  telegram: "assets/telegram.png",
  github: "assets/github.png",
  hh: "assets/hh.png",
  linkedin: "assets/linkedin.png",
  vk: "assets/vk.png",
};

type Props = {
  /** Рендер внутри панели contacts (например Footer + privacy). */
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
          {links.map((link) => {
            const iconSrc = CONTACT_ICON[link.id];
            const isExternal = /^https?:/i.test(link.href);
            return (
              <a
                key={link.id}
                className={styles.iconButton}
                href={link.href}
                aria-label={`${link.label}: ${link.value}`}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {iconSrc ? (
                  <img className={styles.icon} src={assetUrl(iconSrc)} alt="" />
                ) : (
                  <span className={styles.iconFallback} aria-hidden="true">
                    {link.label.slice(0, 2)}
                  </span>
                )}
                <span className={styles.iconLabel}>{link.label}</span>
              </a>
            );
          })}
        </div>
        {email ? <CopyEmailControl email={email} /> : null}
      </Container>
      {endSlot}
    </NavSection>
  );
}
