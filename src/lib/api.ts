import { Chat, Message, OpenAIResponse } from '@/types/chat';

// Development mock data
const MOCK_DELAY = 1000;
const MOCK_RESPONSES = [
  "I understand your question. Let me help you with that.",
  "That's an interesting point. Here's what I think...",
  "Based on my analysis, I would suggest...",
  "Let me break this down for you...",
];

// Local storage keys
const STORAGE_KEY = 'chatApp_chats';

// Function to mock streaming response
export async function mockStreamResponse(message: string, onChunk: (chunk: string) => void) {
  const fullResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)] +
    " " + message;

  // Split response into parts to simulate streaming
  const words = fullResponse.split(' ');

  for (let i = 0; i < words.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
  }

  return {
    id: Date.now().toString(),
    choices: [
      {
        message: {
          content: fullResponse,
        },
      },
    ],
  };
}

// Real OpenAI API request with chat history
export async function sendStreamMessage(
  message: string,
  chatHistory: Message[],
  onChunk: (chunk: string) => void
): Promise<OpenAIResponse> {
  // Use environment variables or configuration for API key
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

  // Use mock data in development environment
  if (!apiKey || import.meta.env.MODE === 'development') {
    return mockStreamResponse(message, onChunk);
  }

  try {
    // Convert chat history to OpenAI format
    const messages = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || '';
              if (content) {
                onChunk(content);
                fullContent += content;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    }

    return {
      id: Date.now().toString(),
      choices: [
        {
          message: {
            content: fullContent,
          },
        },
      ],
    };
  } catch (error) {
    console.error('Error in API request:', error);
    // Fallback to mock response when error occurs
    return mockStreamResponse(message, onChunk);
  }
}

// Keep original function as fallback
export async function sendMessage(message: string): Promise<OpenAIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

  // Simulate OpenAI response format
  return {
    id: Date.now().toString(),
    choices: [
      {
        message: {
          content: MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)] +
            " " + message,
        },
      },
    ],
  };
}

// Chat history management functions
export function saveChats(chats: Chat[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chats to localStorage:', error);
  }
}

export function loadChats(): Chat[] {
  try {
    const storedChats = localStorage.getItem(STORAGE_KEY);
    if (storedChats) {
      // Parse the stored data and convert date strings back to Date objects
      const chats: Chat[] = JSON.parse(storedChats);
      return chats.map(chat => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
  } catch (error) {
    console.error('Error loading chats from localStorage:', error);
  }
  return [];
}

export function deleteChat(chatId: string): Chat[] {
  const chats = loadChats();
  const updatedChats = chats.filter(chat => chat.id !== chatId);
  saveChats(updatedChats);
  return updatedChats;
}

export function clearAllChats(): void {
  saveChats([]);
}