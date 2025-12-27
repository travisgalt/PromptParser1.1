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
            // Normalize inputs for better contrast and consistency
            variables: {
              default: {
                colors: {
                  inputBackground: "white",
                  inputText: "hsl(222.2 47.4% 11.2%)",
                  inputBorder: "hsl(214.3 31.8% 91.4%)",
                  brand: "#7c3aed",
                  brandAccent: "#4f46e5",
                },
              },
              dark: {
                colors: {
                  inputBackground: "rgba(15, 23, 42, 0.85)", // slate-900/85
                  inputText: "hsl(210 40% 98%)",
                  inputBorder: "rgba(255,255,255,0.18)",
                  brand: "#7c3aed",
                  brandAccent: "#4f46e5",
                },
              },
            },
            // Hide placeholder text and add clear borders/focus rings
            className: {
              label: "text-sm font-medium",
              input:
                "placeholder-transparent bg-white text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 rounded-md dark:bg-slate-900/80 dark:text-slate-100 dark:border-white/15",
            },
          }}
          theme={authTheme}
        />
      </div>
    </div>
  );
}