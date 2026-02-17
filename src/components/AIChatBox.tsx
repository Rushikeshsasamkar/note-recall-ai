"use client";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { Message } from "ai";
import { useChat } from "ai/react";
import { Bot, Trash, XCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AIChatBoxProps {
  open: boolean;
  onClose: () => void;
}

export default function AIChatBox({ open, onClose }: AIChatBoxProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error,
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lastMessageIsUser = messages[messages.length - 1]?.role === "user";

  const content = (
    <div
      className={cn(
        "bottom-4 right-4 z-50 w-full max-w-[520px] px-2 sm:px-0 xl:right-20",
        open ? "fixed" : "hidden",
      )}
    >
      <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-card backdrop-blur">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bot className="h-4 w-4 text-primary" />
            MindDock Assistant
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
            aria-label="Close chat"
          >
            <XCircle size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3" ref={scrollRef}>
          {messages.map((message) => (
            <ChatMessage message={message} key={message.id} />
          ))}
          {isLoading && lastMessageIsUser && (
            <ChatMessage
              message={{
                role: "assistant",
                content: "Thinking...",
              }}
            />
          )}
          {error && (
            <ChatMessage
              message={{
                role: "assistant",
                content: "Something went wrong. Please try again.",
              }}
            />
          )}
          {!error && messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
              <div className="rounded-full border border-border/70 bg-background/70 p-3 shadow-sm">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              Ask the assistant a question about your notes.
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-border/60 p-3">
          <div className="flex gap-2">
            <Button
              title="Clear chat"
              variant="outline"
              size="icon"
              className="shrink-0"
              type="button"
              onClick={() => setMessages([])}
            >
              <Trash />
            </Button>
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Say something..."
              ref={inputRef}
            />
            <Button type="submit">Send</Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(content, document.body);
}

function ChatMessage({
  message: { role, content },
}: {
  message: Pick<Message, "role" | "content">;
}) {
  const { user } = useUser();

  const isAiMessage = role === "assistant";

  return (
    <div
      className={cn(
        "mb-3 flex items-end gap-2",
        isAiMessage ? "justify-start" : "justify-end",
      )}
    >
      {isAiMessage && (
        <div className="rounded-full border border-border/70 bg-background/70 p-2 shadow-sm">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      <p
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl border border-border/60 px-4 py-2 text-sm leading-relaxed shadow-sm",
          isAiMessage
            ? "bg-background/80 text-foreground"
            : "border-primary/20 bg-primary text-primary-foreground",
        )}
      >
        {content}
      </p>
      {!isAiMessage && user?.imageUrl && (
        <Image
          src={user.imageUrl}
          alt="User image"
          width={100}
          height={100}
          className="ml-2 h-10 w-10 rounded-full object-cover"
        />
      )}
    </div>
  );
}
