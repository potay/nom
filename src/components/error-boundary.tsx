"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[nom] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <span className="text-2xl">!</span>
          </div>
          <div>
            <p className="font-heading text-lg font-semibold italic">
              Something went wrong
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <p className="text-[10px] text-muted-foreground/40">
            v{process.env.APP_VERSION}
            {process.env.BUILD_SHA !== "dev"
              ? ` (${process.env.BUILD_SHA})`
              : ""}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
