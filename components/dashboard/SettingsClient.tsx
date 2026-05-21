"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientSignOut } from "@/lib/client-auth";
import { format } from "date-fns";
import { Eye, EyeOff, Loader2, AlertTriangle, Shield, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";

import { changePassword, deleteMyAccount } from "@/lib/actions/client/profile";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsClientProps {
  profile: {
    _id: string;
    firstName: string;
    email: string;
    status: string;
    createdAt: string;
  };
}

export default function SettingsClient({ profile }: SettingsClientProps) {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (result.success) {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }

    if (!deleteConfirmed) {
      toast.error("Please confirm that you understand this action");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteMyAccount(deletePassword);

      if (result.success) {
        toast.success("Account deleted successfully");
        clientSignOut("/");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const passwordMeetsRequirements = (password: string) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    return { hasUppercase, hasLowercase, hasNumber, hasMinLength };
  };

  const requirements = passwordMeetsRequirements(newPassword);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-[#FAFAFA]">
          Settings
        </h1>
        <p className="text-[#A1A1AA] mt-1">
          Manage your account settings and security
        </p>
      </div>

      {/* Change Password */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#C9A96E]/10">
            <Shield className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
              Change Password
            </h3>
            <p className="text-sm text-[#71717A]">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-[#0a0a0a] border-[#262626] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-[#0a0a0a] border-[#262626] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {newPassword && (
              <div className="text-xs space-y-1 mt-2">
                <p className={requirements.hasMinLength ? "text-green-400" : "text-[#71717A]"}>
                  {requirements.hasMinLength ? "✓" : "○"} At least 8 characters
                </p>
                <p className={requirements.hasUppercase ? "text-green-400" : "text-[#71717A]"}>
                  {requirements.hasUppercase ? "✓" : "○"} One uppercase letter
                </p>
                <p className={requirements.hasLowercase ? "text-green-400" : "text-[#71717A]"}>
                  {requirements.hasLowercase ? "✓" : "○"} One lowercase letter
                </p>
                <p className={requirements.hasNumber ? "text-green-400" : "text-[#71717A]"}>
                  {requirements.hasNumber ? "✓" : "○"} One number
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-[#0a0a0a] border-[#262626] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="bg-[#C9A96E] hover:bg-[#D4B87A] text-black font-medium"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-[#111111] border border-[#262626] rounded-xl p-6">
        <h3 className="font-display text-lg font-semibold text-[#FAFAFA] mb-6">
          Account Information
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
            <Mail className="w-5 h-5 text-[#71717A]" />
            <div>
              <p className="text-sm text-[#71717A]">Email Address</p>
              <p className="text-[#FAFAFA]">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
            <Calendar className="w-5 h-5 text-[#71717A]" />
            <div>
              <p className="text-sm text-[#71717A]">Account Created</p>
              <p className="text-[#FAFAFA]">
                {format(new Date(profile.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg">
            <Shield className="w-5 h-5 text-[#71717A]" />
            <div>
              <p className="text-sm text-[#71717A]">Account Status</p>
              <Badge
                variant="outline"
                className={
                  profile.status === "active"
                    ? "border-green-500/30 text-green-400"
                    : "border-yellow-500/30 text-yellow-400"
                }
              >
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#111111] border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
              Danger Zone
            </h3>
            <p className="text-sm text-[#71717A]">
              Irreversible actions for your account
            </p>
          </div>
        </div>

        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
          <h4 className="font-medium text-[#FAFAFA] mb-2">Delete Account</h4>
          <p className="text-sm text-[#A1A1AA] mb-4">
            This action is permanent. All your data including bookings will be deleted
            and cannot be recovered.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#111111] border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-[#FAFAFA] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-[#A1A1AA]">
              Are you sure you want to delete your account? This action cannot be
              undone and all your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Enter your password to confirm</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="bg-[#0a0a0a] border-[#262626]"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="confirm-delete"
                checked={deleteConfirmed}
                onCheckedChange={(checked) => setDeleteConfirmed(checked === true)}
                className="mt-1"
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm text-[#A1A1AA] cursor-pointer"
              >
                I understand this action cannot be undone and all my data will be
                permanently deleted
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletePassword("");
                setDeleteConfirmed(false);
              }}
              className="border-[#262626]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deletePassword || !deleteConfirmed}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete My Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
