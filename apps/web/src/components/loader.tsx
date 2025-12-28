import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
};

export default function Loader({ className, size = "default" }: LoaderProps) {
  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
      />
    </div>
  );
}
