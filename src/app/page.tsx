import logo from "@/assets/logo.png";
import HomeAuthActions from "@/components/HomeAuthActions";
import { getAuth } from "@/lib/auth";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await getAuth();

  if (userId) redirect("/notes");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-64 w-64 rounded-full bg-primary/15 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-20 left-[-5%] h-72 w-72 rounded-full bg-accent/70 blur-3xl animate-float-slow" />
      <div className="rounded-full border border-border/60 bg-card/70 px-4 py-1 text-xs uppercase tracking-[0.4em] text-muted-foreground shadow-card backdrop-blur">
        Thoughtful notes, instant recall
      </div>
      <div className="flex items-center gap-4">
        <Image src={logo} alt="MindDock logo" width={100} height={100} />
        <span className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">
          MindDock
        </span>
      </div>
      <p className="text-balance max-w-2xl text-lg text-muted-foreground">
        An intelligent note-taking space that blends fast capture with
        context-aware AI, built on Next.js, Prisma, and modern vector search.
      </p>
      <HomeAuthActions />
    </main>
  );
}
