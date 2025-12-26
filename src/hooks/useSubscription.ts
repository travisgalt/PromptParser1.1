"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";

type UseSubscriptionResult = {
  isPro: boolean;
  isLoading: boolean;
};

export function useSubscription(): UseSubscriptionResult {
  const { session, loading } = useSession();

  // TODO: Replace with real Stripe/Subs check (e.g., fetch user subscription from backend)
  // For now, mock as 'true' so we can test UI/flow easily.
  const isPro = true;

  return { isPro, isLoading: loading };
}

export default useSubscription;