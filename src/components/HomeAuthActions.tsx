import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomeAuthActions() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
        <Button size="lg" variant="outline" className="min-w-[160px]" asChild>
          <Link href="/credentials/sign-in">Sign In</Link>
        </Button>
        <Button size="lg" className="min-w-[160px]" asChild>
          <Link href="/credentials/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}
