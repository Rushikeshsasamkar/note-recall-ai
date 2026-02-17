import { auth as clerkAuth } from "@clerk/nextjs";
import { getCredentialsUserId } from "@/lib/auth/credentials";

export type AuthProvider = "clerk" | "credentials" | null;

export async function getAuth(): Promise<{
  userId: string | null;
  provider: AuthProvider;
}> {
  const { userId } = clerkAuth();

  if (userId) {
    return { userId, provider: "clerk" };
  }

  const credentialsUserId = await getCredentialsUserId();

  if (credentialsUserId) {
    return { userId: credentialsUserId, provider: "credentials" };
  }

  return { userId: null, provider: null };
}
