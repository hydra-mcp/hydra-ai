import { Chat } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

interface ChatContainerProps {
    currentChat: Chat | undefined;
    isStreaming: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatContainer = ({
    currentChat,
    isStreaming,
    messagesEndRef,
}: ChatContainerProps) => {
    if (!currentChat) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Select a chat or start a new one</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-4 p-4">
                {currentChat.messages.map((message) => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isStreaming={isStreaming && message.id === currentChat.messages[currentChat.messages.length - 1].id}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}; 