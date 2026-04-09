"use client";

import { useState } from "react";
import { useHousehold } from "@/components/providers/household-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function HouseholdGate({ children }: { children: React.ReactNode }) {
  const { household, loading, createHousehold, joinHousehold } = useHousehold();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (household) {
    return <>{children}</>;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createHousehold(name);
      toast.success("Household created!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create household",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await joinHousehold(inviteCode);
      toast.success("Joined household!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to join household",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h2 className="font-heading text-xl font-semibold italic">
            Set up your kitchen
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a household or join an existing one
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex gap-2">
            <Button
              variant={mode === "create" ? "default" : "outline"}
              className="flex-1 rounded-xl"
              onClick={() => setMode("create")}
            >
              Create new
            </Button>
            <Button
              variant={mode === "join" ? "default" : "outline"}
              className="flex-1 rounded-xl"
              onClick={() => setMode("join")}
            >
              Join existing
            </Button>
          </div>

          <Separator className="my-5" />

          {mode === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="household-name">Household name</Label>
                <Input
                  id="household-name"
                  placeholder="e.g. Home, Our Kitchen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                  className="rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={submitting || !name.trim()}
              >
                {submitting ? "Creating..." : "Create household"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite code</Label>
                <Input
                  id="invite-code"
                  placeholder="8-character code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  className="rounded-xl font-mono tracking-widest"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={submitting || inviteCode.length !== 8}
              >
                {submitting ? "Joining..." : "Join household"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
