import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <span
      className={cn(
        "font-heading font-semibold italic tracking-tight",
        sizes[size],
        className,
      )}
    >
      n<span className="text-primary/60">o</span>m
    </span>
  );
}
