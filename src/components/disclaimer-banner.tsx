import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <Alert className="border-primary/30 bg-primary/5">
      <Info className="size-4 text-primary" />
      <AlertTitle>Illustrative, not advice</AlertTitle>
      <AlertDescription>
        Projections use simplified assumptions such as steady inflation and
        steady returns. Use this to compare options, not as a guarantee of what
        markets will do.
      </AlertDescription>
    </Alert>
  );
}
