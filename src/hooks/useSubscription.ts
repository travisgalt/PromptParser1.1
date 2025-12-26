"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { useDebug } from "@/contexts/DebugContext";

type UseSubscriptionResult = {
  isPro: boolean;
  isLoading: boolean;
};

export function useSubscription(): UseSubscriptionResult {
  const { session, loading } = useSession();
  const { overridePro } = useDebug();

  // TODO: Replace with real Stripe/Subs check later (e.g., via backend).
  // For now, allow Debug override to force Pro; otherwise default to Free.
  const isPro = overridePro === true;

  return { isPro, isLoading: loading };
}

export default useSubscription;