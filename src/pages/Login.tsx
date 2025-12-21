"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { resolvedTheme } = useTheme();
  const authTheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
          }}
          theme={authTheme}
        />
      </div>
    </div>
  );
}