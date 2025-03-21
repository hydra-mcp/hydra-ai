import { Chat } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { memo } from "react";
import { Bot, MessageSquarePlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatContainerProps {
    currentChat: Chat | undefined;
    isStreaming: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    onNewChat?: () => void;
}

export const ChatContainer = memo(({
    currentChat,
    isStreaming,
    messagesEndRef,
    onNewChat
}: ChatContainerProps) => {
    if (!currentChat) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome to HYDRA-AI</h2>
                {/* <h2 className="mb-2 text-2xl font-bold">Welcome to HYDRA-AI</h2> */}
                <p className="mb-6 max-w-md text-muted-foreground">
                    I'm your blockchain intelligence assistant. How can I help with project analysis, wallet behavior, or market trends today?
                </p>
                {/* <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-pulse">
                    <Bot className="h-10 w-10 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome to HYDRA-AI</h2>
                <p className="mb-6 max-w-md text-muted-foreground">
                    Start a new conversation or select an existing chat from the sidebar.
                </p>

                <Button
                    onClick={onNewChat}
                    className="flex items-center gap-2 px-4 py-2 transition-all hover:scale-105"
                    size="lg"
                >
                    <MessageSquarePlus className="h-5 w-5" />
                    Start New Chat
                    <ArrowRight className="h-4 w-4 ml-1" />
                </Button>

                <div className="mt-12 rounded-lg border p-4 bg-card/50 max-w-md">
                    <h3 className="mb-2 font-medium flex items-center">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary mr-2"></span>
                        Pro Tip
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You can organize your conversations by topic in the sidebar, and continue any chat at any time.
                    </p>
                </div> */}
            </div >
        );
    }

    if (currentChat.messages.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome to HYDRA-AI</h2>
                {/* <h2 className="mb-2 text-2xl font-bold">Welcome to HYDRA-AI</h2> */}
                <p className="mb-6 max-w-md text-muted-foreground">
                    I'm your blockchain intelligence assistant. How can I help with project analysis, wallet behavior, or market trends today?
                </p>

                <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Analyze Smart Wallets (High-Quality Account Addresses)</h3>
                        <p className="text-sm text-muted-foreground">
                            "Please analyze the smart wallet in this CA: xxxxxxxxxxxxxxxxxxxx"
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Get information</h3>
                        <p className="text-sm text-muted-foreground">
                            "Analyze the liquidity and trading volume trends for this project"
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Solve problems</h3>
                        <p className="text-sm text-muted-foreground">
                            "How can I identify potential high-value wallet behavior patterns?"
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                        <h3 className="mb-2 font-medium">Get insights</h3>
                        <p className="text-sm text-muted-foreground">
                            "Analyze the holding changes for this wallet address"
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-4 p-4">
                {currentChat.messages.map((message, index) => (
                    <MessageBubble
                        key={`${message.id}-${isStreaming && index === currentChat.messages.length - 1 ? 'streaming' : 'static'}`}
                        message={message}
                        isStreaming={isStreaming && index === currentChat.messages.length - 1 && message.sender === 'ai'}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}); 