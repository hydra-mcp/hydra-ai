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

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 获取访问令牌
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

// 检查是否已认证
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// 通用API请求函数
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = getAccessToken();
    const baseUrl = API_BASE_URL || '';

    // 构建完整URL
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // 设置默认headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 处理401错误 - 令牌过期
    if (response.status === 401) {
      // 尝试刷新令牌
      try {
        await refreshTokenRequest();

        // 使用新令牌重试原请求
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
        // 刷新失败，清除令牌并抛出错误
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        throw new Error('Authentication failed, please login again');
      }
    }

    // 处理其他错误
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        errorBody.message ||
        errorBody.error ||
        `API request failed with status ${response.status}`
      );
    }

    // 对于204和空响应，返回空对象
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    // 尝试解析响应JSON
    try {
      const data = await response.json();

      // 特殊处理 /auth/me 接口，验证返回的用户信息是否有效
      if (endpoint === '/auth/me' || endpoint.endsWith('/auth/me')) {
        // 检查必要的用户信息字段是否存在且有效
        if (!data || !data.id || !data.username) {
          // 清除认证信息
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

// 刷新令牌请求
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

    // 更新存储的令牌
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

    // 获取访问令牌
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

    // 处理认证错误，但不重试流式请求
    if (response.status === 401 && token) {
      try {
        await refreshTokenRequest();
        // 提示用户刷新页面或重试对话
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
        // 清除用户认证数据
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

    // 处理状态码为200但返回内容表明用户数据无效的情况
    if (response.status === 200) {
      // 检查响应中是否包含表明用户数据无效的提示
      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        if (text.includes("invalid user") || text.includes("unauthorized") || text.includes("not authorized")) {
          // 清除用户认证数据
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
        // 错误处理，继续执行原流程
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