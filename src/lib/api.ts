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

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get access token
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

// Check if authenticated
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Common API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = getAccessToken();
    const baseUrl = API_BASE_URL || '';

    // Build full URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 error - token expired
    if (response.status === 401) {
      // Try to refresh token
      try {
        await refreshTokenRequest();

        // Retry original request with new token
        const newToken = getAccessToken();
        if (!newToken) {
          throw new Error('Token refresh failed');
        }

        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        };

        const retryResponse = await fetch(url, {
          ...options,
          headers: newHeaders,
        });

        if (!retryResponse.ok) {
          throw new Error(`API request failed with status ${retryResponse.status}`);
        }

        if (retryResponse.status === 204 || retryResponse.status === 404) {
          return {} as T;
        }

        return await retryResponse.json();
      } catch (refreshError) {
        // Refresh failed, clear token and throw error
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        throw new Error('Authentication failed, please login again');
      }
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.message ||
        errorBody.error ||
        `API request failed with status ${response.status}`
      );
    }

    // For 204 and empty responses, return empty object
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    // Try to parse response JSON
    try {
      const data = await response.json();

      // Special handling for /auth/me interface, verify if the returned user information is valid
      if (endpoint === '/auth/me' || endpoint.endsWith('/auth/me')) {
        // Check if the necessary user information fields exist and are valid
        if (!data || !data.id || !data.username) {
          // Clear authentication information
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          throw new Error('Invalid user data received, please login again');
        }
      }

      return data as T;
    } catch (error) {
      console.warn('Failed to parse JSON response:', error);
      throw error;
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Refresh token request
export async function refreshTokenRequest(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    // Update stored token
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Use mock data in development environment if no API key
  if (!isAuthenticated()) {
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

    // Get access token
    const token = getAccessToken();
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

    const response = await fetch(`${baseUrl}/agent/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({
        model: 'volcengine/deepseek-v3',
        messages,
        stream: true
      })
    });

    // Handle authentication error, but do not retry streaming request
    if (response.status === 401 && token) {
      try {
        await refreshTokenRequest();
        // Prompt user to refresh page or retry conversation
        onChunk("\n\n[Authentication refreshed. Please try sending your message again.]");
        return {
          id: Date.now().toString(),
          choices: [
            {
              message: {
                content: "[Authentication refreshed. Please try sending your message again.]",
              },
            },
          ],
        };
      } catch (error) {
        // Clear user authentication data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');

        onChunk("\n\n[Authentication failed. Please log in again.]");
        return {
          id: Date.now().toString(),
          choices: [
            {
              message: {
                content: "[Authentication failed. Please log in again.]",
              },
            },
          ],
        };
      }
    }

    // Handle the case where the status code is 200 but the returned content indicates invalid user data
    if (response.status === 200) {
      // Check if the response contains a hint indicating invalid user data
      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        if (text.includes("invalid user") || text.includes("unauthorized") || text.includes("not authorized")) {
          // Clear user authentication data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');

          onChunk("\n\n[Your session is invalid. Please log in again.]");
          return {
            id: Date.now().toString(),
            choices: [
              {
                message: {
                  content: "[Your session is invalid. Please log in again.]",
                },
              },
            ],
          };
        }
      } catch (e) {
        // Error handling, continue with original process
        console.warn("Error checking response content", e);
      }
    }

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