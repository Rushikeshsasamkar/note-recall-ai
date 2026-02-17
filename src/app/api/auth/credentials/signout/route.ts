import {
  clearCredentialsSession,
  clearSessionCookie,
} from "@/lib/auth/credentials";

export async function POST() {
  try {
    await clearCredentialsSession();
    clearSessionCookie();
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
