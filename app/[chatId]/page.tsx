"use client";

import { SidebarApp } from "@/components/sidebar-app";
import { Chat } from "@/components/chat";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useChatManager } from "@/hooks/use-chat-manager";
import { useEffect } from "react";
import { notFound } from "next/navigation";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const { selectChat, currentChatId } = useChatManager();

  useEffect(() => {
    if (params.chatId && params.chatId !== currentChatId) {
      selectChat(params.chatId);
    }
  }, [params.chatId, currentChatId, selectChat]);

  if (!params.chatId) {
    notFound();
  }

  return (
    <SidebarProvider>
      <SidebarApp />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <h1 className="text-lg font-semibold">
              {currentChatId === params.chatId ? "Chat" : "Loading..."}
            </h1>
          </div>
        </header>
        <Chat />
      </SidebarInset>
    </SidebarProvider>
  );
}