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
import { OrgoAction, ProgressiveTodos } from "@/components/ui/progressive-todos";
import Image from "next/image";

export function Chat({ className, ...props }: ComponentPropsWithoutRef<"div">) {
	const [orgoActions, setOrgoActions] = useState<OrgoAction[]>([]);
	const [isOrgoStreaming, setIsOrgoStreaming] = useState(false);
	const [finalScreenshot, setFinalScreenshot] = useState<string | null>(null);

	const { currentChat, updateChatMessages, updateChatTitle, createNewChat, selectChat } = useChatManager();
	
	const { messages, sendMessage, status, stop, setMessages } =
		useChat({
			transport: new DefaultChatTransport({
				api: "/api/ai/chat",
			}),
			onFinish: (message: any) => {
				console.log('[useChat] onFinish message', JSON.stringify(message, null, 2));
			},
		});

	const [input, setInput] = useState('');
	const isLoading = status === 'submitted' || status === 'streaming' || isOrgoStreaming;

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};
	
	useEffect(() => {
		if (currentChat) {
			setMessages(currentChat.messages);
		} else {
			setMessages([]);
		}
	}, [currentChat?.id, setMessages]);

	useEffect(() => {
		if (!isLoading && currentChat?.id && messages.length > 0) {
			const messagesChanged = JSON.stringify(messages) !== JSON.stringify(currentChat.messages);
			if (messagesChanged) {
				console.log(`[Chat] Persisting ${messages.length} messages for chat ID: ${currentChat.id}`);
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
	}, [status, messages, currentChat, updateChatMessages, updateChatTitle, isLoading]);


	const handleOrgoStream = async (instruction: string) => {
		setIsOrgoStreaming(true);
		setOrgoActions([]);
		setFinalScreenshot(null);
	  
		try {
		  const response = await fetch('/api/crawl', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ instruction }),
		  });
	  
		  if (!response.body) {
			throw new Error('No response body from server');
		  }
	  
		  const reader = response.body.getReader();
		  const decoder = new TextDecoder();
	  
		  while (true) {
			const { done, value } = await reader.read();
			if (done) break;
	  
			const chunk = decoder.decode(value, { stream: true });
			const events = chunk.split('\n\n').filter(e => e.startsWith('data:'));

			for (const event of events) {
				const jsonData = event.replace(/^data: /, '');
				try {
					const parsed = JSON.parse(jsonData);
                    if (parsed.type === 'summary') {
                        const { summary, screenshot } = parsed.data;
                        setFinalScreenshot(screenshot);

                        const safetyPrompt = `
Based on the following actions and final screenshot, please perform a safety evaluation.

**Summary of Actions:**
${summary}

**Evaluation Rubric:**
- **Table 1: URL & Domain Analysis:** Check if it mimics a known brand, uses homoglyphs, or has a shady TLD.
- **Table 2: Visual & Branding Check:** (Refer to the screenshot) Compare the visual branding to the official brand if applicable.
- **Table 3: Form & Input Audit:** Does the page ask for sensitive data unusually early? Is it a login page that doesn't link to a known backend?
- **Table 4: Natural Language Verdict:** Synthesize a final verdict and a confidence score.

Please format your response using markdown tables as defined in the rubric.
`;
                        sendMessage({ role: 'assistant', parts: [{ type: 'text', text: safetyPrompt }] });
                    } else {
                        // Transform event to OrgoAction
                        const newAction: OrgoAction = {
                            id: crypto.randomUUID(),
                            description: parsed.type === 'text' ? parsed.data : `Executing: ${parsed.data.action}`,
                            action: parsed.type === 'tool_use' ? parsed.data.action : 'output',
                            details: {
                                type: parsed.type
                            }
                        };
                        setOrgoActions(prev => [...prev, newAction]);
                    }
				} catch (e) {
					console.error('Failed to parse SSE event chunk:', jsonData, e);
				}
			}
		  }
		} catch (error) {
		  console.error('[Chat] Orgo stream failed:', error);
		  setMessages([...messages, { id: crypto.randomUUID(), role: 'assistant', parts: [{ type: 'text', text: `An error occurred: ${(error as Error).message}`}]}]);
		} finally {
		  setIsOrgoStreaming(false);
		}
	  };


	const submitMessage = () => {
		if (!input.trim()) return;
		
		let chatId = currentChat?.id;
		if (!chatId) {
			chatId = createNewChat();
			selectChat(chatId);
		}
		
		sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
		handleOrgoStream(input);
		
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
						Start a conversation by giving Orgo an instruction.
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
							<ChatInputTextArea placeholder="Tell Orgo what to do..." />
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
					{messages.map((message: any, index: number) => {
						// The 'content' is in the 'parts' array for text messages.
						const content = message.parts?.map((p: any) => p.type === 'text' ? p.text : '').join('') || '';

						return (
							<ChatMessage
								key={index}
								id={message.id}
								variant={message.role === 'user' ? 'bubble' : 'default'}
								type={message.role === 'user' ? 'outgoing' : 'incoming'}
							>
								{message.role !== 'user' && <ChatMessageAvatar />}
								<ChatMessageContent content={content} />
							</ChatMessage>
						);
					})}
                    {(isOrgoStreaming || orgoActions.length > 0) && (
                        <ChatMessage id="orgo-stream">
                            <ChatMessageAvatar />
                            <ProgressiveTodos enhanced_prompt="Orgo is performing the following actions:" todos={orgoActions} />
                        </ChatMessage>
                    )}
                    {finalScreenshot && (
                        <ChatMessage id="orgo-screenshot">
                             <ChatMessageAvatar />
                             <Image src={`data:image/jpeg;base64,${finalScreenshot}`} alt="Final Screenshot" width={1280} height={800} className="rounded-lg border"/>
                        </ChatMessage>
                    )}
                    {isLoading && !isOrgoStreaming && <MessageLoading />}
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
