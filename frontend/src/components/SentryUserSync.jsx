import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import * as Sentry from "@sentry/react";

/** keeps Sentry user context in sync with the signed-in user (errors and replays show which user). */
export function SentryUserSync() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    Sentry.setUser(userId ? { id: userId } : null);
  }, [isLoaded, userId]);

  return null;
}
