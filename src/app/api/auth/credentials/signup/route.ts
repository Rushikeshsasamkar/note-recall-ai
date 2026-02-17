import prisma from "@/lib/db/prisma";
import {
  createCredentialsSession,
  setSessionCookie,
} from "@/lib/auth/credentials";
import { credentialsSignUpSchema } from "@/lib/validation/credentials";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = credentialsSignUpSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    let { email, username, password } = parseResult.data;
    email = email.trim().toLowerCase();
    username = username?.trim().toLowerCase();
    if (username === "") username = undefined;

    const existingUser = await prisma.credentialsUser.findFirst({
      where: {
        OR: [
          { email },
          ...(username ? [{ username }] : []),
        ],
      },
    });

    if (existingUser) {
      return Response.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.credentialsUser.create({
      data: {
        email,
        username,
        passwordHash,
      },
    });

    const { token, expiresAt } = await createCredentialsSession(user.id);
    setSessionCookie(token, expiresAt);

    return Response.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
