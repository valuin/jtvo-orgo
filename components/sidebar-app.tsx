"use client";

import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { NavUser } from "@/components/nav-user";
import { MessageCircle, SquarePen } from "lucide-react";
import type { ComponentProps } from "react";
import { useChatManager } from "@/hooks/use-chat-manager";
import { useRouter } from "next/navigation";

const userData = {
	name: "John Doe",
	email: "m@example.com",
	avatar: "/avatar-1.png",
};

export function SidebarApp({ ...props }: ComponentProps<typeof Sidebar>) {
	const { groupedChats, currentChatId, createNewChat, selectChat } = useChatManager();
	const router = useRouter();

	const handleNewChat = () => {
		const newChatId = createNewChat();
		router.push(`/${newChatId}`);
	};

	const handleChatSelect = (chatId: string) => {
		selectChat(chatId);
		router.push(`/${chatId}`);
	};

	return (
		<Sidebar className="border-r-0" {...props}>
			<SidebarHeader>
				<div className="flex items-center justify-between p-2">
					<div className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
							<MessageCircle className="h-5 w-5 text-primary-foreground" />
						</div>
						<span className="text-lg font-semibold">simple-ai</span>
					</div>
					{/* New Chat Button */}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button size="icon" variant="ghost" onClick={handleNewChat}>
									<SquarePen className="h-5 w-5" />
									<span className="sr-only">New Chat</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>New Chat</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<div className="flex flex-col gap-4">
					{/* Recent Chats */}
					{groupedChats.recent.length > 0 && (
						<SidebarGroup>
							<SidebarGroupLabel>Recent</SidebarGroupLabel>
							<SidebarMenu>
								{groupedChats.recent.map((chat) => (
									<SidebarMenuItem key={chat.id}>
										<SidebarMenuButton
											className="w-full justify-start"
											isActive={currentChatId === chat.id}
											onClick={() => handleChatSelect(chat.id)}
										>
											<MessageCircle className="mr-2 h-4 w-4" />
											<span className="truncate">{chat.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroup>
					)}

					{/* Previous 7 Days */}
					{groupedChats.lastWeek.length > 0 && (
						<SidebarGroup>
							<SidebarGroupLabel>Previous 7 Days</SidebarGroupLabel>
							<SidebarMenu>
								{groupedChats.lastWeek.map((chat) => (
									<SidebarMenuItem key={chat.id}>
										<SidebarMenuButton
											className="w-full justify-start"
											isActive={currentChatId === chat.id}
											onClick={() => handleChatSelect(chat.id)}
										>
											<MessageCircle className="mr-2 h-4 w-4" />
											<span className="truncate">{chat.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroup>
					)}

					{/* Previous 30 Days */}
					{groupedChats.lastMonth.length > 0 && (
						<SidebarGroup>
							<SidebarGroupLabel>Previous 30 Days</SidebarGroupLabel>
							<SidebarMenu>
								{groupedChats.lastMonth.map((chat) => (
									<SidebarMenuItem key={chat.id}>
										<SidebarMenuButton
											className="w-full justify-start"
											isActive={currentChatId === chat.id}
											onClick={() => handleChatSelect(chat.id)}
										>
											<MessageCircle className="mr-2 h-4 w-4" />
											<span className="truncate">{chat.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroup>
					)}

					{/* Previous Years */}
					{groupedChats.previous.length > 0 && (
						<SidebarGroup>
							<SidebarGroupLabel>Previous Years</SidebarGroupLabel>
							<SidebarMenu>
								{groupedChats.previous.map((chat) => (
									<SidebarMenuItem key={chat.id}>
										<SidebarMenuButton
											className="w-full justify-start"
											isActive={currentChatId === chat.id}
											onClick={() => handleChatSelect(chat.id)}
										>
											<MessageCircle className="mr-2 h-4 w-4" />
											<span className="truncate">{chat.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroup>
					)}

					{/* Empty State */}
					{groupedChats.recent.length === 0 &&
					 groupedChats.lastWeek.length === 0 &&
					 groupedChats.lastMonth.length === 0 &&
					 groupedChats.previous.length === 0 && (
						<SidebarGroup>
							<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
								<MessageCircle className="h-8 w-8 mb-2" />
								<p className="text-sm">No chats yet</p>
								<p className="text-xs">Click the + button to start a new chat</p>
							</div>
						</SidebarGroup>
					)}
				</div>
			</SidebarContent>
			<SidebarRail />
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
		</Sidebar>
	);
}
