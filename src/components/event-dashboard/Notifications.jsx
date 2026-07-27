import CloseIcon from "@/assets/icons/CloseIcon";
import TextButton from "../layout-components/Buttons/TextButtons";
import { useDisableScroll } from "@/hooks/useDisableScroll";
import { timeAgo } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { notificationsApi } from "@/services/notificationsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Notifications({ open, setOpen }) {
  const { notifications, removeNotification, clearNotifications } =
    useNotificationStore();
  // IsMobile
  const [isMobile, setIsMobile] = useState(false);

  const queryClient = useQueryClient();

  // Ref for the notifications container
  const notificationsRef = useRef(null);

  // Disable scroll hook
  useDisableScroll(open && isMobile);

  // Navigate hook
  const navigate = useNavigate();

  const { mutate: markAsRead } = useMutation({
    mutationFn: async notificationId =>
      notificationsApi.markAsRead(notificationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const { mutate: markAllAsRead } = useMutation({
    mutationFn: async () => notificationsApi.markAllAsRead(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationNavigate = notification => {
    markAsRead(notification.id);
    let url = `/manage-event/${notification.raw.eventSlug}`;
    switch (notification.raw.type) {
      case "rsvp":
        url += `?tab=guests`;
        break;
      case "chipin":
        url += "?tab=payouts";
        break;
      default:
        break;
    }
    // Close notifications box
    setOpen(false);

    // Remove notification from store
    removeNotification(notification.id);

    // Navigate to event
    navigate(url);
  };

  const handleClearNotifications = () => {
    markAllAsRead();
    clearNotifications();
  };

  // Track mobile state on resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        open &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      ref={notificationsRef}
      className="satoshi w-full z-20 md:z-auto md:min-h-[428px] h-full bg-white fixed top-0 left-0 md:top-[calc(100%+13px)] md:left-auto md:right-0 md:absolute rounded-t-[24px]  md:rounded-[24px] shadow-[0_4px_24px_0_rgba(0,0,0,0.25)] md:min-w-[337px] overflow-hidden flex flex-col"
    >
      {/* Top */}
      <div className="flex justify-between items-center p-4 pb-2 bg-[#F4F4F4]">
        <h3 className="text-[#001010] text-sm font-bold">Notifications</h3>
        <button className="cursor-pointer" onClick={handleClearNotifications}>
          <CloseIcon size={24} />
        </button>
      </div>
      {/* Bottom */}
      <div className="bg-[#FFFFFE] flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="flex flex-col">
            {notifications.map((item, i) => (
              <div
                onClick={() => handleNotificationNavigate(item)}
                key={i}
                className="p-4 pb-2 flex flex-col gap-y-1 cursor-pointer transition-all hover:bg-[#F0F0F0] border border-white"
              >
                {/* Notification top */}
                <div className="flex items-start gap-2">
                  <div className="h-[26px] min-w-[29px] rounded-[8px] overflow-hidden">
                    <img
                      src={item.raw.image}
                      className="object-cover block h-full w-full"
                      alt="event-img"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#001010]">
                      {item.raw.title}
                    </h3>
                    <p className="font-medium text-[#8A9191] text-[12px] leading-[18px]">
                      {item.raw.message}
                    </p>
                  </div>
                </div>
                {/* Notification bottom */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#8A9191] text-[12px] leading-[18px]">
                    {timeAgo(item.raw.createdAt)}
                  </span>
                  <TextButton text="View" className="min-w-0!" smallButton />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-[33px] md:px-[14px] flex h-full flex-col justify-center items-center gap-y-2 text-center">
            <h3 className="paytone text-[18px] leading-[28px]">
              No Notifications
            </h3>
            <p className="text-sm text-[#8A9191] font-bold">
              Looks like there's nothing happening right now.
              <br />
              Why not be the first to create an event?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
