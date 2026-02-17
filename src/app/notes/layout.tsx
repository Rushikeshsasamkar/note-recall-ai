import NavBar from "./NavBar";
import { getAuth } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { provider } = await getAuth();

  return (
    <>
      <NavBar authProvider={provider} />
      <main className="relative m-auto max-w-7xl px-4 pb-16 pt-8">
        <div className="pointer-events-none absolute -top-16 right-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute bottom-0 left-4 h-48 w-48 rounded-full bg-accent/60 blur-3xl animate-float-slow" />
        <div className="relative z-10">{children}</div>
      </main>
    </>
  );
}
