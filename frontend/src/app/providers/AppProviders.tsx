import type { ReactNode } from "react";

import { DocumentMetaSync, I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

import { QueryProvider } from "./QueryProvider";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <DocumentMetaSync />
        <QueryProvider>{children}</QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
