import { assetUrl } from "@/shared/lib";
import { Tag } from "@/shared/ui";

type Props = {
  label: string;
  logoId?: string;
  logoSrc?: string;
};

export function TechTag({ label, logoId, logoSrc }: Props) {
  return (
    <Tag
      logoId={logoId}
      logoSrc={logoSrc ? assetUrl(logoSrc) : undefined}
      logoAlt=""
    >
      {label}
    </Tag>
  );
}
