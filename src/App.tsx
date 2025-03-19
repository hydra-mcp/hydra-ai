import { Moon, Sun, Bot, Send, ChevronDown, PanelLeftOpen, PanelLeftClose, Sparkles, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { useToast } from '@/hooks/use-toast';
import { ChatList } from '@/components/chat/ChatList';
import { Chat, Message } from '@/types/chat';
import { sendStreamMessage, saveChats, loadChats, deleteChat, clearAllChats } from '@/lib/api';
import { MessageSound } from '@/components/chat/MessageSound';
import { ChatContainer } from '@/components/chat/ChatContainer';

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [playSentSound, setPlaySentSound] = useState(false);
  const [playReceivedSound, setPlayReceivedSound] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Load chats from local storage on initial render
  useEffect(() => {
    const loadSavedChats = async () => {
      setIsLoadingChats(true);
      try {
        // Simulate network delay for demo purposes
        await new Promise(resolve => setTimeout(resolve, 800));

        const savedChats = loadChats();
        if (savedChats.length > 0) {
          setChats(savedChats);
          setCurrentChatId(savedChats[0].id);
        } else {
          createNewChat();
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        toast({
          title: 'Error loading chats',
          description: 'Failed to load your chat history.',
          duration: 3000,
        });
        createNewChat();
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadSavedChats();

    // Check system dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      saveChats(chats);
    }
  }, [chats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setIsScrolledUp(!isAtBottom);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    );
  };

  const handleDeleteChat = (chatId: string) => {
    const updatedChats = deleteChat(chatId);
    setChats(updatedChats);

    // If the deleted chat was the current one, select the next available chat
    if (chatId === currentChatId) {
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);

      // If no chats left, create a new one
      if (updatedChats.length === 0) {
        createNewChat();
      }
    }

    toast({
      title: 'Chat deleted',
      description: 'The chat has been removed.',
      duration: 3000,
    });
  };

  const handleClearAllChats = () => {
    clearAllChats();
    setChats([]);
    createNewChat();

    toast({
      title: 'All chats cleared',
      description: 'Your chat history has been cleared.',
      duration: 3000,
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;

    // Trigger sent sound
    setPlaySentSound(true);
    setTimeout(() => setPlaySentSound(false), 300);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    // Update chat with user message
    const updatedMessages = [...(currentChat?.messages || []), userMessage];
    updateChat(currentChatId, {
      messages: updatedMessages,
      updatedAt: new Date(),
      title: updatedMessages.length === 1 ? input.slice(0, 30) : currentChat?.title,
    });

    // Create AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',  // Initially empty
      sender: 'ai',
      timestamp: new Date(),
    };

    // Add empty AI message
    updateChat(currentChatId, {
      messages: [...updatedMessages, aiMessage],
      updatedAt: new Date(),
    });

    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Use streaming response API with chat history for context
      await sendStreamMessage(
        input,
        // Send previous messages for context (excluding the empty AI message)
        updatedMessages,
        (chunk) => {
          // Update message content with each new chunk
          setStreamingContent(prev => prev + chunk);

          // Also update the message in the chat
          updateChat(currentChatId, {
            messages: [...updatedMessages, {
              ...aiMessage,
              content: streamingContent + chunk,
            }],
            updatedAt: new Date(),
          });
        }
      );

      // Streaming complete
      setIsStreaming(false);

      // Ensure the final message contains the complete content
      updateChat(currentChatId, {
        messages: [...updatedMessages, {
          ...aiMessage,
          content: streamingContent,
        }],
        updatedAt: new Date(),
      });

      // Trigger received sound when AI message is complete
      setPlayReceivedSound(true);
      setTimeout(() => setPlayReceivedSound(false), 300);
    } catch (error) {
      // Handle error
      setIsStreaming(false);
      toast({
        title: 'Error',
        description: 'Failed to get AI response.',
        duration: 3000,
      });

      // Add error message
      updateChat(currentChatId, {
        messages: [...updatedMessages, {
          ...aiMessage,
          content: 'Sorry, I encountered an issue and couldn\'t respond to your request. Please try again later.',
        }],
        updatedAt: new Date(),
      });
    }
  };

  useEffect(() => {
    if (currentChat?.messages.length > 0) {
      scrollToBottom();
    }
  }, [currentChat?.messages]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    toast({
      title: `Switched to ${isDarkMode ? 'light' : 'dark'} mode`,
      duration: 1500,
    });
  };

  return (
    <div className={cn(
      'flex h-screen flex-col bg-gradient-to-br from-background to-background/90 transition-colors duration-500',
      isDarkMode ? 'dark' : ''
    )}>
      {/* Sound effects */}
      <MessageSound play={playSentSound} soundType="sent" />
      <MessageSound play={playReceivedSound} soundType="received" />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full transform border-r bg-background/95 backdrop-blur-md transition-all duration-300 shadow-lg lg:z-30',
          'w-72 lg:w-72',
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>Chat History</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="p-4">
            <ChatList
              chats={chats}
              currentChatId={currentChatId}
              onSelectChat={(id) => {
                setCurrentChatId(id);
                setIsSidebarOpen(false); // Close sidebar after selection on mobile
              }}
              onNewChat={() => {
                createNewChat();
                setIsSidebarOpen(false); // Close sidebar after creating new chat on mobile
              }}
              onDeleteChat={handleDeleteChat}
              onClearAllChats={handleClearAllChats}
              isLoading={isLoadingChats}
            />
          </div>
        </div>
      </aside>

      {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 lg:hidden bg-background/80 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 z-20 w-full border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className={cn(
          'flex h-14 max-w-[100vw] items-center px-4',
          isSidebarOpen ? 'lg:pl-80' : '',
          'transition-all duration-300'
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 transition-transform hover:scale-105"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
          <div className="flex items-center gap-2 font-bold">
            <Bot className="h-6 w-6 text-primary animate-bounce" />
            <span className="hidden sm:inline-block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AI Chat Assistant</span>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-transform hover:scale-110 hover:rotate-12"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className={cn(
        'relative z-10 min-h-screen pt-14 pb-20',
        isSidebarOpen ? 'lg:pl-72' : '',
        'transition-all duration-300'
      )}>
        <div className={cn(
          'container h-full py-4',
          isSidebarOpen ? 'lg:pr-4 lg:pl-4' : 'px-4'
        )}>
          <ScrollArea
            ref={scrollAreaRef}
            className="h-[calc(100vh-8.5rem)] rounded-lg border bg-background/5 shadow-inner"
            onScroll={handleScroll}
          >
            <ChatContainer
              currentChat={currentChat}
              isStreaming={isStreaming}
              messagesEndRef={messagesEndRef}
            />
          </ScrollArea>

          {/* Scroll to Bottom Button */}
          {isScrolledUp && (
            <Button
              variant="secondary"
              size="icon"
              className="fixed bottom-24 right-6 z-10 rounded-full shadow-lg transition-transform hover:scale-110 animate-bounce-slow"
              onClick={scrollToBottom}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className={cn(
        'fixed bottom-0 right-0 z-20 w-full border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-lg',
        'transition-all duration-300'
      )}>
        <div className={cn(
          'flex gap-2 p-2 sm:p-4 mx-auto',
          isSidebarOpen ? 'lg:pl-80' : 'px-4',
          'transition-all duration-300'
        )}>
          <AutoResizeTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="min-h-[40px] max-h-[120px] sm:max-h-[200px] resize-none rounded-lg border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-shadow text-sm sm:text-base"
            disabled={isStreaming}
          />
          <Button
            disabled={!currentChatId || isStreaming || !input.trim()}
            onClick={handleSend}
            className={cn(
              "shrink-0 transition-all px-2 sm:px-4",
              isStreaming ? "opacity-50" : "hover:scale-105 hover:shadow-md hover:shadow-primary/20"
            )}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline-block">Send</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default App;
