import prisma from "@/lib/db/prisma";
import {
  createCredentialsSession,
  setSessionCookie,
} from "@/lib/auth/credentials";
import { credentialsSignInSchema } from "@/lib/validation/credentials";
import { compare } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = credentialsSignInSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const identifier = parseResult.data.identifier.trim().toLowerCase();
    const isEmail = identifier.includes("@");

    const user = await prisma.credentialsUser.findFirst({
      where: isEmail ? { email: identifier } : { username: identifier },
    });

    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const validPassword = await compare(
      parseResult.data.password,
      user.passwordHash,
    );

    if (!validPassword) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { token, expiresAt } = await createCredentialsSession(user.id);
    setSessionCookie(token, expiresAt);

    return Response.json({ userId: user.id }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
