"use client";

import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import supabase from "@/integrations/supabase/client";

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession ?? null);

      if (event === "SIGNED_IN") {
        // After sign-in, go to home
        navigate("/", { replace: true });
      } else if (event === "SIGNED_OUT") {
        // If user is on a protected route, send them to login
        if (location.pathname === "/profile") {
          navigate("/login", { replace: true });
        }
      }
      // Other events can be monitored if needed
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};