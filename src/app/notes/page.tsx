import Note from "@/components/Note";
import prisma from "@/lib/db/prisma";
import { getAuth } from "@/lib/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "MindDock - Notes",
};

export default async function NotesPage() {
  const { userId } = await getAuth();

  if (!userId) {
    redirect("/credentials/sign-in");
  }

  const allNotes = await prisma.note.findMany({ where: { userId } });

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Your workspace
        </p>
        <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
          Notes that stay in motion
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Capture ideas, plan projects, and ask the assistant to surface exactly
          what you need.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allNotes.map((note) => (
          <Note note={note} key={note.id} />
        ))}
        {allNotes.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/70 bg-card/60 p-8 text-center text-muted-foreground shadow-card backdrop-blur">
            {"You don't have any notes yet. Why don't you create one?"}
          </div>
        )}
      </div>
    </section>
  );
}
