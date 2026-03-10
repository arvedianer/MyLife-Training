import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatConversation {
  id: string;
  title: string;       // First user message, truncated to 40 chars
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;

  // Actions
  newConversation: () => string;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, msg: ChatMessage) => void;
  updateLastMessage: (conversationId: string, content: string) => void;
  deleteConversation: (id: string) => void;
  clearAll: () => void;

  // Selectors
  getActiveConversation: () => ChatConversation | null;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const MAX_CONVERSATIONS = 50;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      newConversation: () => {
        const id = generateId();
        const now = Date.now();
        const newConv: ChatConversation = {
          id,
          title: 'Neues Gespräch',
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => {
          const conversations = [newConv, ...state.conversations].slice(0, MAX_CONVERSATIONS);
          return { conversations, activeConversationId: id };
        });
        return id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, msg) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;
            // Set title from first user message
            const newMessages = [...conv.messages, msg];
            let title = conv.title;
            if (conv.title === 'Neues Gespräch' && msg.role === 'user') {
              title = msg.content.slice(0, 40) + (msg.content.length > 40 ? '…' : '');
            }
            return { ...conv, messages: newMessages, title, updatedAt: Date.now() };
          });
          return { conversations };
        });
      },

      updateLastMessage: (conversationId, content) => {
        set((state) => {
          const conversations = state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;
            const messages = [...conv.messages];
            if (messages.length === 0) return conv;
            messages[messages.length - 1] = { ...messages[messages.length - 1], content };
            return { ...conv, messages, updatedAt: Date.now() };
          });
          return { conversations };
        });
      },

      deleteConversation: (id) => {
        set((state) => {
          const conversations = state.conversations.filter((c) => c.id !== id);
          const activeConversationId =
            state.activeConversationId === id
              ? (conversations[0]?.id ?? null)
              : state.activeConversationId;
          return { conversations, activeConversationId };
        });
      },

      clearAll: () => {
        set({ conversations: [], activeConversationId: null });
      },

      getActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        return conversations.find((c) => c.id === activeConversationId) ?? null;
      },
    }),
    {
      name: 'mylife-chat',
      storage: {
        getItem: (name) => {
          const value = zustandStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          zustandStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          zustandStorage.removeItem(name);
        },
      },
    }
  )
);
