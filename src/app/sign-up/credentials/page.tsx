import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MindDock - Sign Up (Credentials)",
};

export default function CredentialsSignUpPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <SignUp
        routing="path"
        path="/sign-up/credentials"
        signInUrl="/sign-in/credentials"
        afterSignUpUrl="/sign-in/credentials"
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
