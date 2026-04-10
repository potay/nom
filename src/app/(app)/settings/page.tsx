"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useHousehold } from "@/components/providers/household-provider";
import { signOut } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  function copyInviteCode() {
    if (!household) return;
    navigator.clipboard.writeText(household.inviteCode);
    toast.success("Invite code copied!");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{user?.displayName || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Household */}
      {household && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Household</CardTitle>
            <CardDescription>
              Share the invite code with your partner so they can join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span>{household.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Members</span>
              <span>{household.members.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Invite code</p>
                <p className="font-mono text-lg tracking-widest">
                  {household.inviteCode}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>

      <p className="pt-2 text-center text-[11px] text-muted-foreground/50">
        v{process.env.APP_VERSION}
        {process.env.BUILD_SHA !== "dev" ? ` (${process.env.BUILD_SHA})` : ""}
      </p>
    </div>
  );
}
