import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { Gym } from '@/types/gym';

interface GymState {
  gyms: Gym[];
  addGym: (name: string) => Gym;
  removeGym: (gymId: string) => void;
  getGymById: (gymId: string) => Gym | undefined;
}

function generateGymId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
}

export const useGymStore = create<GymState>()(
  persist(
    (set, get) => ({
      gyms: [],

      addGym: (name: string) => {
        const gym: Gym = {
          id: generateGymId(name),
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ gyms: [...state.gyms, gym] }));
        return gym;
      },

      removeGym: (gymId: string) => {
        set((state) => ({ gyms: state.gyms.filter((g) => g.id !== gymId) }));
      },

      getGymById: (gymId: string) => {
        return get().gyms.find((g) => g.id === gymId);
      },
    }),
    {
      name: 'gym-storage',
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
