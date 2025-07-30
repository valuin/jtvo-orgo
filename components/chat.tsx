"use client";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTextArea,
} from "@/components/ui/chat-input";
import {
	ChatMessage,
	ChatMessageAvatar,
	ChatMessageContent,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { MessageLoading } from "@/components/ui/message-loading";
import { useChat } from '@ai-sdk/react';
import type { ComponentPropsWithoutRef } from "react";
import { useChatManager } from "@/hooks/use-chat-manager";
import { useEffect } from "react";

export function Chat({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	const { currentChat, updateChatMessages, updateChatTitle, createNewChat, selectChat } = useChatManager();
	
	const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } =
		useChat({
			api: "/api/ai/chat",
			initialMessages: currentChat?.messages || [],
			onFinish: (message) => {
				console.log("Message finished:", message);
			},
		});

	// Update chat messages when messages change (but not when currentChat changes)
	useEffect(() => {
	  if (currentChat && messages.length > 0) {
	    // Only update if messages are different from stored messages
	    const messagesChanged = JSON.stringify(messages) !== JSON.stringify(currentChat.messages);
	    if (messagesChanged) {
	      updateChatMessages(currentChat.id, messages);
	      
	      // Auto-generate title from first user message if chat title is "New Chat"
	      if (currentChat.title === "New Chat") {
	        const firstUserMessage = messages.find(m => m.role === "user");
	        if (firstUserMessage) {
	          const title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "");
	          updateChatTitle(currentChat.id, title);
	        }
	      }
	    }
	  }
	}, [messages, currentChat?.id]); // Add currentChat.id to prevent cross-contamination

	// Load current chat messages when chat changes
	useEffect(() => {
	  if (currentChat) {
	    // Always set messages when switching chats to ensure proper loading
	    setMessages(currentChat.messages);
	  } else {
	    setMessages([]);
	  }
	}, [currentChat?.id, setMessages]); // Include setMessages as it's stable

	const handleSubmitMessage = () => {
	  if (isLoading) {
	    return;
	  }
	  
	  // Create new chat if none exists
	  if (!currentChat) {
	    const newChatId = createNewChat();
	    // Select the newly created chat
	    selectChat(newChatId);
	  }
	  
	  handleSubmit();
	};

	// Show empty state when no chat is selected
	if (!currentChat) {
		return (
			<div className="flex-1 flex flex-col h-full items-center justify-center" {...props}>
				<div className="text-center text-muted-foreground max-w-md">
					<div className="mb-4">
						<svg
							className="mx-auto h-12 w-12 text-muted-foreground/50"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-semibold mb-2">Welcome to JTVO x ORGO</h3>
					<p className="text-sm mb-4">
						Start a conversation by clicking the "New Chat" button in the sidebar or type a message below.
					</p>
				</div>
				<div className="px-2 py-4 max-w-2xl mx-auto w-full">
					<ChatInput
						value={input}
						onChange={handleInputChange}
						onSubmit={handleSubmitMessage}
						loading={isLoading}
						onStop={stop}
					>
						<ChatInputTextArea placeholder="Start a new conversation..." />
						<ChatInputSubmit />
					</ChatInput>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto" {...props}>
			<ChatMessageArea scrollButtonAlignment="center">
				<div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
					{messages.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							<p>No messages yet. Start the conversation!</p>
						</div>
					) : (
						<>
							{messages.map((message) => {
								if (message.role !== "user") {
									return (
										<ChatMessage key={message.id} id={message.id}>
											<ChatMessageAvatar />
											<ChatMessageContent content={message.content} />
										</ChatMessage>
									);
								}
								return (
									<ChatMessage
										key={message.id}
										id={message.id}
										variant="bubble"
										type="outgoing"
									>
										<ChatMessageContent content={message.content} />
									</ChatMessage>
								);
							})}
							{isLoading && (
								<ChatMessage id="loading">
									<ChatMessageAvatar />
									<div className="flex items-center justify-center p-4">
										<MessageLoading />
									</div>
								</ChatMessage>
							)}
						</>
					)}
				</div>
			</ChatMessageArea>
			<div className="px-2 py-4 max-w-2xl mx-auto w-full">
				<ChatInput
					value={input}
					onChange={handleInputChange}
					onSubmit={handleSubmitMessage}
					loading={isLoading}
					onStop={stop}
				>
					<ChatInputTextArea placeholder="Type a message..." />
					<ChatInputSubmit />
				</ChatInput>
			</div>
		</div>
	);
}
