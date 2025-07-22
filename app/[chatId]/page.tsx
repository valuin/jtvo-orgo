"use client";

import { Chat } from "@/components/chat";
import { useChatManager } from "@/hooks/use-chat-manager";
import { useEffect, useState } from "react";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { selectChat } = useChatManager();
  const [resolvedParams, setResolvedParams] = useState<{ chatId: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.chatId) {
      selectChat(resolvedParams.chatId);
    }
  }, [resolvedParams?.chatId, selectChat]);

  if (!resolvedParams?.chatId) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <Chat />;
}