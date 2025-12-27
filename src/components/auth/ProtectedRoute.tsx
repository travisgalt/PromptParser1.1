"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
          </CardHeader>
          <CardContent>Please wait…</CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    // Log access_denied route attempt (best effort)
    try {
      supabase.functions.invoke("audit-events", {
        body: {
          action: "access_denied.route",
          target_resource: { type: "route", path: location.pathname },
          details: { reason: "Unauthenticated access" }
        }
      });
    } catch {
      // ignore
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;