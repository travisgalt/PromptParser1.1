"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useSubscription from "@/hooks/useSubscription";
import { showSuccess, showError } from "@/utils/toast";

export default function AccountSettings() {
  const { session } = useSession();
  const email = session?.user?.email ?? "";
  const { isPro } = useSubscription();

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [updating, setUpdating] = React.useState(false);

  const onUpdatePassword = async () => {
    if (!session?.user) {
      showError("Please log in to update your password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdating(false);
    if (error) {
      showError("Failed to update password.");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    showSuccess("Password updated.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} readOnly className="bg-white/5 border-white/10" />
        </div>
        <Badge className={isPro ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"}>
          {isPro ? "Pro" : "Free"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm Password</Label>
          <Input
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

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