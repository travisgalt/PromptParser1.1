"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccountSettings() {
  const { session } = useSession();

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState(false);

  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasMaxLength = pwd.length <= 64;
    const hasNumOrSpecial = /[0-9]|[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    return hasMinLength && hasMaxLength && hasNumOrSpecial;
  };

  const onUpdatePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!session?.user) {
      setError("Please log in to update your password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword.length > 64) {
      setError("Password must be at most 64 characters.");
      return;
    }
    if (!validatePassword(newPassword)) {
      setError("Include at least one number or special character.");
      return;
    }

    setUpdating(true);
    const { error: apiError } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);

    if (apiError) {
      setError("Failed to update password. Please try again.");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setSuccess("Password updated successfully.");
  };

  // Transparent container; let modal background show through
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-400">New Password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={64}
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white rounded-md focus-visible:ring-2 focus-visible:ring-purple-500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-400">Confirm Password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={64}
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-slate-900 border-slate-700 text-white rounded-md focus-visible:ring-2 focus-visible:ring-purple-500"
        />
      </div>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}
      {success ? <div className="text-sm text-emerald-400">{success}</div> : null}

      <Button
        className="w-full bg-violet-600 text-white"
        onClick={onUpdatePassword}
        disabled={updating}
      >
        {updating ? "Updating..." : "Update Password"}
      </Button>
    </div>
  );
}