"use client";

import { SidebarApp } from "@/components/sidebar-app";
import { Chat } from "@/components/chat";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useChatManager } from "@/hooks/use-chat-manager";
import { useEffect } from "react";

export default function Page() {
  const { currentChatId } = useChatManager();

  // Redirect to first chat if exists, otherwise show empty state
  useEffect(() => {
    if (currentChatId) {
      window.location.href = `/${currentChatId}`;
    }
  }, [currentChatId]);

  return (
    <SidebarProvider>
      <SidebarApp />
      <SidebarInset className="flex flex-col h-screen overflow-y-auto">
        <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 bg-background">
          <div className="flex flex-1 items-center gap-2 px-3">
            <h1 className="text-lg font-semibold">simple-ai</h1>
          </div>
        </header>
        <Chat />
      </SidebarInset>
    </SidebarProvider>
  );
}
