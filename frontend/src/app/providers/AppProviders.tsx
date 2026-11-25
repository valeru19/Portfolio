import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}
