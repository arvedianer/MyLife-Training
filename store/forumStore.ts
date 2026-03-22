import { create } from 'zustand';

interface ForumStore {
  totalUnread: number;
  unreadByChannel: Record<string, number>;
  setUnread: (channelId: string, count: number) => void;
  clearUnread: (channelId: string) => void;
}

export const useForumStore = create<ForumStore>((set) => ({
  totalUnread: 0,
  unreadByChannel: {},
  setUnread: (channelId, count) =>
    set((state) => {
      const updated = { ...state.unreadByChannel, [channelId]: count };
      const total = Object.values(updated).reduce((sum, n) => sum + n, 0);
      return { unreadByChannel: updated, totalUnread: total };
    }),
  clearUnread: (channelId) =>
    set((state) => {
      const updated = { ...state.unreadByChannel };
      delete updated[channelId];
      const total = Object.values(updated).reduce((sum, n) => sum + n, 0);
      return { unreadByChannel: updated, totalUnread: total };
    }),
}));
