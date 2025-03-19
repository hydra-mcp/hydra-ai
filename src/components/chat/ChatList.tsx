import { cn } from '@/lib/utils';
import { Chat } from '@/types/chat';
import { MessageSquarePlus, MessageSquare, Trash2, MoreVertical, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CollapsibleGroup } from './CollapsibleGroup';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onClearAllChats?: () => void;
  isLoading?: boolean;
}

// Helper to format dates
const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const isThisWeek = date >= thisWeek;
  const isThisMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  if (isThisWeek) return 'This Week';
  if (isThisMonth) return 'This Month';

  return 'Older';
};

export function ChatList({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearAllChats,
  isLoading = false,
}: ChatListProps) {
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Group chats by date
  const groupedChats = useMemo(() => {
    const groups: Record<string, Chat[]> = {};

    chats.forEach(chat => {
      const dateGroup = formatDate(new Date(chat.updatedAt));
      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(chat);
    });

    // Sort groups by recency (Today, Yesterday, This Week, etc.)
    const sortOrder = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
    return Object.entries(groups)
      .sort((a, b) => sortOrder.indexOf(a[0]) - sortOrder.indexOf(b[0]));
  }, [chats]);

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChatToDelete(chatId);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      onDeleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  const cancelDelete = () => {
    setChatToDelete(null);
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    if (onClearAllChats) {
      onClearAllChats();
    }
    setShowClearConfirm(false);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 justify-start gap-2 transition-all hover:bg-primary hover:text-primary-foreground"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="transition-all hover:bg-muted">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onClearAllChats && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleClearAll}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Chats
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>Loading chats...</span>
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-3">
          {chats.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-3">
              <Calendar className="h-8 w-8 opacity-40" />
              <div>
                <p className="font-medium">No chat history yet</p>
                <p className="text-xs">Start a new conversation</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedChats.map(([group, groupChats]) => (
                <CollapsibleGroup
                  key={group}
                  title={group}
                  count={groupChats.length}
                  defaultOpen={group === 'Today' || group === 'Yesterday'}
                >
                  <div className="flex flex-col gap-1 py-1">
                    {groupChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="group flex items-center"
                      >
                        <Button
                          variant={chat.id === currentChatId ? 'secondary' : 'ghost'}
                          className={cn(
                            "flex-1 justify-start gap-2 pr-2 transition-all duration-200",
                            chat.id === currentChatId ? "font-medium" : "",
                            "hover:translate-x-1"
                          )}
                          onClick={() => onSelectChat(chat.id)}
                        >
                          <MessageSquare className={cn(
                            "h-4 w-4 transition-colors",
                            chat.id === currentChatId ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className="truncate">{chat.title}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                          <span className="sr-only">Delete chat</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleGroup>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Delete chat confirmation dialog */}
      <AlertDialog open={chatToDelete !== null} onOpenChange={cancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all chats confirmation dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all chats</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all chats? This will delete your entire chat history and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}