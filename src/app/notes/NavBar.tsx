"use client";

import logo from "@/assets/logo.png";
import AIChatButton from "@/components/AIChatButton";
import AddEditNoteDialog from "@/components/AddEditNoteDialog";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { Button } from "@/components/ui/button";
import type { AuthProvider } from "@/lib/auth";
import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function NavBar({ authProvider }: { authProvider: AuthProvider }) {
  const { theme } = useTheme();
  const router = useRouter();

  const [showAddEditNoteDialog, setShowAddEditNoteDialog] = useState(false);

  const handleCredentialsSignOut = async () => {
    await fetch("/api/auth/credentials/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/80 px-4 py-4 shadow-card backdrop-blur">
        <div className="m-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/notes" className="group flex items-center gap-2">
            <Image src={logo} alt="MindDock logo" width={40} height={40} />
            <span className="font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
              MindDock
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {authProvider === "clerk" && (
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  baseTheme: theme === "dark" ? dark : undefined,
                  elements: { avatarBox: { width: "2.5rem", height: "2.5rem" } },
                }}
              />
            )}
            {authProvider === "credentials" && (
              <Button variant="outline" onClick={handleCredentialsSignOut}>
                Sign Out
              </Button>
            )}
            <ThemeToggleButton />
            <Button onClick={() => setShowAddEditNoteDialog(true)}>
              <Plus size={20} className="mr-2" />
              Add Note
            </Button>
            <AIChatButton />
          </div>
        </div>
      </div>
      <AddEditNoteDialog
        open={showAddEditNoteDialog}
        setOpen={setShowAddEditNoteDialog}
      />
    </>
  );
}
