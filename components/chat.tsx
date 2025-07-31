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
import { useEffect, useState } from "react";
import { DefaultChatTransport } from 'ai';
import { ProgressiveTodos } from "@/components/ui/progressive-todos";

type ToolCallArgs = {
	enhanced_prompt?: string;
	todos?: Array<{
		id: string;
		description: string;
		action: string;
		details?: Record<string, any>;
		validation?: Record<string, any>;
	}>;
};

export function Chat({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	const { currentChat, updateChatMessages, updateChatTitle, createNewChat, selectChat } = useChatManager();
	
	const { messages, sendMessage, status, stop, setMessages, addToolResult } =
		useChat({
			transport: new DefaultChatTransport({
				api: "/api/ai/chat",
			}),
			onFinish: (message: any, meta?: { usage?: any; finishReason?: any }) => {
				console.log('[useChat] onFinish message', JSON.stringify(message, null, 2));
				if (meta) {
					console.log('[useChat] usage', meta.usage, 'finishReason', meta.finishReason);
				}
			},
			onToolCall: async ({ toolCall }: { toolCall: any }) => {
				console.log('[useChat] onToolCall received', JSON.stringify(toolCall, null, 2));
				// For verification only; do not return a result so the call remains a UI event.
			},
		});

	const [input, setInput] = useState('');
	const isLoading = status === 'submitted' || status === 'streaming';

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	const extractProgressiveTodos = (m: any): ToolCallArgs | null => {
		if (!m?.parts) return null;
		console.log('[Chat] Inspecting message parts for tool calls', JSON.stringify(m.parts, null, 2));

		// AI SDK v5 renames 'args'->'input' and 'result'->'output' in some stream parts.
		for (const p of m.parts) {
			// v5 typed tool parts come as 'tool-<name>' with state, or generic 'tool-call'/'tool'
			const isProgByTyped = typeof p.type === 'string' && p.type.startsWith('tool-progressive_todos');
			const isGenericTool = (p.type === 'tool-call' || p.type === 'tool') && (p.name === 'progressive_todos' || p.toolName === 'progressive_todos');

			if (isProgByTyped || isGenericTool) {
				try {
					const raw = (p.input ?? p.args ?? p);
					const args = typeof raw === 'string' ? JSON.parse(raw) : raw?.args ?? raw?.input ?? raw;
					console.log('[Chat] progressive_todos tool part detected. Parsed args:', JSON.stringify(args, null, 2));
					if (args && typeof args === 'object') return args as ToolCallArgs;
				} catch (e) {
					console.warn('[Chat] Failed parsing progressive_todos args', e, 'part:', p);
				}
			}
		}
		return null;
	};

	// Coerce tool args to ProgressiveTodos expected shape
	const mapToTodos = (args: ToolCallArgs | null) => {
		if (!args?.todos) return null;
		return args.todos.map(t => {
			const d = (t.details ?? {}) as Record<string, any>;
			const v = (t.validation ?? {}) as Record<string, any>;
			return {
				id: t.id,
				description: t.description,
				action: t.action,
				details: {
					type: typeof d.type === 'string' ? d.type : 'unknown',
					selector: typeof d.selector === 'string' ? d.selector : undefined,
					value: typeof d.value === 'string' ? d.value : undefined,
					timeout: typeof d.timeout === 'number' ? d.timeout : 0,
					expectation: typeof d.expectation === 'string' ? d.expectation : '',
				},
				validation: {
					selector: typeof v.selector === 'string' ? v.selector : '',
					expected_state: typeof v.expected_state === 'string' ? v.expected_state : '',
				},
			};
		});
	};

	// Update chat messages when messages change (but not when currentChat changes)
	useEffect(() => {
	  if (currentChat && messages.length > 0) {
	    const messagesChanged = JSON.stringify(messages) !== JSON.stringify(currentChat.messages);
	    if (messagesChanged) {
	      updateChatMessages(currentChat.id, messages);
	      
	      if (currentChat.title === "New Chat") {
	        const firstUserMessage = messages.find(m => m.role === "user");
	        if (firstUserMessage) {
	          const content = firstUserMessage.parts.map((p: any) => p.type === 'text' ? p.text : '').join('');
	          const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
	          updateChatTitle(currentChat.id, title);
	        }
	      }
	    }
	  }
	}, [messages, currentChat?.id]);

	// Load current chat messages when chat changes
	useEffect(() => {
	  if (currentChat) {
	    setMessages(currentChat.messages);
	  } else {
	    setMessages([]);
	  }
	}, [currentChat?.id, setMessages]);

	const submitMessage = () => {
		if (!input.trim()) return;

		let chatId = currentChat?.id;
		if (!chatId) {
			chatId = createNewChat();
			selectChat(chatId);
		}
		
		sendMessage({
			role: 'user',
			parts: [{ type: 'text', text: input }]
		});
		setInput('');
	};

	const handleSubmitMessage = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		submitMessage();
	};

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
					<form onSubmit={handleSubmitMessage} className="w-full">
						<ChatInput
							value={input}
							onChange={handleInputChange}
							onSubmit={submitMessage}
							loading={isLoading}
							onStop={stop}
						>
							<ChatInputTextArea placeholder="Start a new conversation..." />
							<ChatInputSubmit />
						</ChatInput>
					</form>
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
							{messages.map((message: any) => {
								console.log('[Chat] render message.id', message.id, 'role', message.role);
								console.log('[Chat] message.parts', JSON.stringify(message.parts, null, 2));

								const toolArgs = message.role !== "user" ? extractProgressiveTodos(message) : null;

								if (message.role !== "user") {
									return (
										<ChatMessage key={message.id} id={message.id}>
											<ChatMessageAvatar />
											<div className="w-full space-y-3">
												{toolArgs?.todos && (
													<ProgressiveTodos
														enhanced_prompt={toolArgs.enhanced_prompt || ''}
														todos={mapToTodos(toolArgs) || []}
													/>
												)}
												<ChatMessageContent content={message.parts.map((p: any) => p.type === 'text' ? p.text : '').join('')} />
											</div>
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
										<ChatMessageContent content={message.parts.map((p: any) => p.type === 'text' ? p.text : '').join('')} />
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
				<form onSubmit={handleSubmitMessage} className="w-full">
					<ChatInput
						value={input}
						onChange={handleInputChange}
						onSubmit={submitMessage}
						loading={isLoading}
						onStop={stop}
					>
						<ChatInputTextArea placeholder="Type a message..." />
						<ChatInputSubmit />
					</ChatInput>
				</form>
			</div>
		</div>
	);
}
