"use client";
import { useState, useEffect, useCallback } from "react";
import type { UIMessage } from "ai";

export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: UIMessage[];
}

export interface ChatGroup {
  recent: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  previous: Chat[];
}

const STORAGE_KEY = "simple-ai-chats";
const CURRENT_CHAT_KEY = "simple-ai-current-chat";

export function useChatManager() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load chats from localStorage on mount
  useEffect(() => {
    try {
      const storedChats = localStorage.getItem(STORAGE_KEY);
      const storedCurrentChat = localStorage.getItem(CURRENT_CHAT_KEY);
      
      if (storedChats) {
        const parsedChats: Chat[] = JSON.parse(storedChats).map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
        }));
        setChats(parsedChats);
      }
      
      if (storedCurrentChat) {
        setCurrentChatId(storedCurrentChat);
      }
    } catch (error) {
      console.error("Error loading chats from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      } catch (error) {
        console.error("Error saving chats to localStorage:", error);
      }
    }
  }, [chats, isLoading]);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (!isLoading && currentChatId) {
      try {
        localStorage.setItem(CURRENT_CHAT_KEY, currentChatId);
      } catch (error) {
        console.error("Error saving current chat to localStorage:", error);
      }
    }
  }, [currentChatId, isLoading]);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "New Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
    };

    setChats(prev => [newChat, ...prev]);
    // Set currentChatId so the chat becomes active
    setCurrentChatId(newChat.id);
    
    return newChat.id;
  }, []);

  const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, ...updates, updatedAt: new Date() }
        : chat
    ));
  }, []);

  const updateChatMessages = useCallback((chatId: string, messages: UIMessage[]) => {
    setChats(prev => {
      const chat = prev.find(c => c.id === chatId);
      if (chat && JSON.stringify(chat.messages) !== JSON.stringify(messages)) {
        return prev.map(c =>
          c.id === chatId
            ? { ...c, messages, updatedAt: new Date() }
            : c
        );
      }
      return prev;
    });
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChats(prev => {
      const chat = prev.find(c => c.id === chatId);
      if (chat && chat.title !== title) {
        return prev.map(c =>
          c.id === chatId
            ? { ...c, title, updatedAt: new Date() }
            : c
        );
      }
      return prev;
    });
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  }, [currentChatId, chats]);

  const selectChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  const getCurrentChat = useCallback(() => {
    return chats.find(chat => chat.id === currentChatId) || null;
  }, [chats, currentChatId]);

  const getGroupedChats = useCallback((): ChatGroup => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sortedChats = [...chats].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return {
      recent: sortedChats.filter(chat => chat.updatedAt >= sevenDaysAgo).slice(0, 5),
      lastWeek: sortedChats.filter(chat => 
        chat.updatedAt < sevenDaysAgo && chat.updatedAt >= thirtyDaysAgo
      ),
      lastMonth: sortedChats.filter(chat => 
        chat.updatedAt < thirtyDaysAgo && chat.updatedAt.getFullYear() === now.getFullYear()
      ),
      previous: sortedChats.filter(chat => 
        chat.updatedAt.getFullYear() < now.getFullYear()
      ),
    };
  }, [chats]);

  return {
    chats,
    currentChatId,
    currentChat: getCurrentChat(),
    groupedChats: getGroupedChats(),
    isLoading,
    createNewChat,
    updateChat,
    updateChatMessages,
    updateChatTitle,
    deleteChat,
    selectChat,
  };
}