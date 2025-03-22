export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  createdAt: string;
}

// get the type of sender in Message
export type MessageSender = Message['sender'];

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  messages: Message[];
}

export interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}