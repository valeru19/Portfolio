import { useMutation } from "@tanstack/react-query";

import { createApplication } from "@/shared/api";
import type { ApplicationCreate } from "@/shared/api";

export function useSubmitApplication() {
  return useMutation({
    mutationFn: (payload: ApplicationCreate) => createApplication(payload),
  });
}
