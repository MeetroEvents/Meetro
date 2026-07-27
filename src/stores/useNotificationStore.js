import { create } from "zustand";
import { persist } from "zustand/middleware";

const normalizeNotification = payload => {
  if (!payload) return null;

  const fallbackTitle = payload.title || payload.type || "New notification";
  const fallbackText = payload.message || payload.text || payload.body || "";

  return {
    id: payload.id || payload._id || `${fallbackTitle}-${Date.now()}`,
    title: fallbackTitle,
    text: fallbackText,
    url: payload.url || payload.link || "/home",
    img: payload.img || payload.image || "",
    createdAt: payload.createdAt || new Date().toISOString(),
    unread: payload.unread ?? true,
    raw: payload,
  };
};

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      setNotifications: notifications => {
        const normalized = notifications
          .map(normalizeNotification)
          .filter(Boolean);

        set({
          notifications: normalized,
          unreadCount: normalized.filter(item => item.unread).length,
        });
      },
      addNotification: payload => {
        const normalized = normalizeNotification(payload);
        if (!normalized) return;

        const notifications = [normalized, ...get().notifications];
        const uniqueNotifications = notifications.filter(
          (item, index, array) =>
            array.findIndex(candidate => candidate.id === item.id) === index
        );

        set({
          notifications: uniqueNotifications,
          unreadCount: uniqueNotifications.filter(item => item.unread).length,
        });
      },
      clearNotifications: () => {
        const notifications = [];

        set({ notifications, unreadCount: 0 });
      },
      removeNotification: id => {
        const notifications = get().notifications.filter(
          item => item.id !== id
        );
        set({
          notifications,
          unreadCount: notifications.filter(item => item.unread).length,
        });
      },
    }),
    {
      name: "notification-storage",
      partialize: state => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
