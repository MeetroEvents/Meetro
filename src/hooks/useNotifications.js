import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { notificationsApi } from "@/services/notificationsApi";

export function useNotifications() {
  const { accessToken } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const queryClient = useQueryClient();

  const { data: notificationsPayload } = useQuery({
    queryKey: ["notifications", accessToken],
    queryFn: notificationsApi.getNotifications,
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!notificationsPayload) return;

    const items = Array.isArray(notificationsPayload)
      ? notificationsPayload
      : (notificationsPayload?.data ?? []);

    setNotifications(items);
  }, [notificationsPayload, setNotifications]);

  useEffect(() => {
    if (!accessToken || !import.meta.env.VITE_WEBSOCKET_URL) return undefined;

    const websocketUrl = `${import.meta.env.VITE_WEBSOCKET_URL}?token=${encodeURIComponent(accessToken)}`;
    const socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
      console.log("WS connected");
    };

    socket.onmessage = event => {
      try {
        const payload = JSON.parse(event.data);
        const eventSlug =
          payload?.notification?.eventSlug || payload?.raw?.eventSlug;
        const notificationType = payload?.notification?.type;

        useNotificationStore.getState().addNotification(payload);

        if (eventSlug) {
          // Invalidate necessary event queries
          queryClient.invalidateQueries(["user-events"]);
          queryClient.invalidateQueries(["event-protected", eventSlug]);
          queryClient.invalidateQueries(["event", eventSlug]);
          queryClient.invalidateQueries(["guests", eventSlug]);
          if (notificationType === "chipin") {
            queryClient.invalidateQueries(["eventBalance", eventSlug]);
            queryClient.invalidateQueries(["payouts", eventSlug]);
          }
        }
      } catch (error) {
        console.error("Failed to parse notification payload", error);
      }
    };

    socket.onerror = error => {
      console.error("WebSocket notification error", error);
    };

    socket.onclose = event => {
      console.log("WS closed", event.code, event.reason);
    };

    return () => {
      socket.close();
    };
  }, [accessToken]); // only reconnect when the token changes
}
