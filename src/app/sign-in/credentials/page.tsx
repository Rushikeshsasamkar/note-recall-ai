import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MindDock - Sign In (Credentials)",
};

export default function CredentialsSignInPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignIn
        routing="path"
        path="/sign-in/credentials"
        signUpUrl="/sign-up/credentials"
        appearance={{
          variables: { colorPrimary: "#0F172A" },
          elements: {
            socialButtonsBlock: "hidden",
            dividerRow: "hidden",
          },
        }}
      />
    </div>
  );
}
