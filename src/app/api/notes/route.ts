import { notesIndex } from "@/lib/db/pinecone";
import prisma from "@/lib/db/prisma";
import { getAuth } from "@/lib/auth";
import { getEmbedding } from "@/lib/openai";
import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "@/lib/validation/note";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parseResult.data;

    const { userId } = await getAuth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const embedding = notesIndex
      ? await getEmbeddingForNote(title, content)
      : null;

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId,
      },
    });

    if (notesIndex && embedding) {
      try {
        await notesIndex.upsert([
          {
            id: note.id,
            values: embedding,
            metadata: { userId },
          },
        ]);
      } catch (error) {
        console.error("Pinecone upsert failed, skipping index update.", error);
      }
    }

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const parseResult = updateNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, title, content } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const { userId } = await getAuth();

    if (!userId || userId !== note.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const embedding = notesIndex
      ? await getEmbeddingForNote(title, content)
      : null;

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
      },
    });

    if (notesIndex && embedding) {
      try {
        await notesIndex.upsert([
          {
            id,
            values: embedding,
            metadata: { userId },
          },
        ]);
      } catch (error) {
        console.error("Pinecone upsert failed, skipping index update.", error);
      }
    }

    return Response.json({ updatedNote }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    const parseResult = deleteNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id } = parseResult.data;

    const note = await prisma.note.findUnique({ where: { id } });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const { userId } = await getAuth();

    if (!userId || userId !== note.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.note.delete({ where: { id } });

    if (notesIndex) {
      try {
        await notesIndex.deleteOne(id);
      } catch (error) {
        console.error("Pinecone delete failed, skipping index update.", error);
      }
    }

    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getEmbeddingForNote(title: string, content: string | undefined) {
  return getEmbedding(`${title}\n\n${content ?? ""}`);
}
