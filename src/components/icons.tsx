
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Icons = {
  spinner: ({ className, ...props }: React.ComponentProps<typeof Loader2>) => (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} {...props} />
  ),
};
