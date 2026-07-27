import API from "@/lib/axios";

export const notificationsApi = {
  getNotifications: async () => {
    const response = await API.get(`/notifications`);
    return response.data.data.notifications;
  },
  markAsRead: async id => {
    await API.delete(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    await API.delete("/notifications/read");
  },
};
