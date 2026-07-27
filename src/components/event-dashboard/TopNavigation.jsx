import MeetroLogoAlt from "@/assets/icons/MeetroLogoAlt";
import ProfileModal from "./ProfileModal";
import Notifications from "./Notifications";
import IconButton from "../layout-components/Buttons/IconButton";
import Avatar from "../layout-components/Avatar";
import MeetroLogoAltMobile from "@/assets/icons/MeetroLogoAltMobile";
import { useState, useEffect } from "react";
import { ArrowDown2, ArrowUp2, Map1, Notification } from "iconsax-reactjs";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { twMerge } from "tailwind-merge";
import { Link } from "react-router";
import { useNotifications } from "@/hooks/useNotifications";

// Notifications
export default function TopNavigation() {
  // Notifications state
  const [openNotifications, setOpenNotifications] = useState(false);
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  useNotifications();

  // Profile modal state
  const [openProfile, setOpenProfile] = useState(false);

  // Scroll state
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={twMerge(
        `sticky top-0 z-50 w-full bg-[#F0F0F0] transition-all duration-200 border-b border-transparent`,
        isScrolled && "shadow-[0_10px_25px_rgba(0,0,0,0.015)] border-white/30"
      )}
    >
      <div className="max-w-[1440px] satoshi py-3 px-4 md:px-8 mx-auto w-full flex-1  gap-4 flex-wrap flex flex-col min-[300px]:flex-row items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2">
          <div className="hidden min-[400px]:block">
            <MeetroLogoAlt />
          </div>
          <div className="block min-[400px]:hidden">
            <MeetroLogoAltMobile />
          </div>
          <span className="bg-linear-to-r satoshi flex justify-center items-center from-[#BCFF5C] to-[#C0A8FF] text-[8px] font-[700] min-w-[26px] size-fit capitalize px-1 h-[14px] leading-[14px] rounded-2xl text-[#011F0F]">
            Beta
          </span>
        </Link>
        {/* State select */}
        <div className="rounded-full hidden min-[680px]:flex items-center max-h-11 justify-between bg-[#f8f8f7] border border-[#E5E7E3] py-[10px] min-w-[282px] px-[6px]">
          <div className="flex items-center">
            <IconButton
              variant="tertiary"
              icon={<Map1 variant="Bold" size={16} color="#001010" />}
              smallButton
            />
            <input
              placeholder="FCT"
              className="placeholder:font-medium border-0 outline-0 px-2 placeholder:text-[#B0B5B5]"
            />
          </div>
          <ArrowDown2 variant="Outline" size={16} color="#8A9191" />
        </div>
        {/* Nav menu */}
        <div className="flex items-center gap-4">
          <IconButton
            variant="tertiary"
            icon={<Map1 variant="Bold" size={24} color="#001010" />}
            className="min-[680px]:hidden size-9!"
          />
          <div className="relative">
            <div className="cursor-pointer">
              <IconButton
                variant="tertiary"
                icon={<Notification variant="Bold" size={24} color="#001010" />}
                onClick={() => {
                  setOpenNotifications(true);
                }}
                className={`${openNotifications ? "bg-[#E5E7E3]! pointer-events-none" : ""} size-9!`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#BCFF5C] px-1 text-[10px] font-bold text-[#001010]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <Notifications
              open={openNotifications}
              setOpen={setOpenNotifications}
            />
          </div>
          <div className="relative">
            <div className="cursor-pointer">
              <IconButton
                variant="tertiary"
                onClick={() => {
                  // Toggle profile menu
                  setOpenProfile(true);
                }}
                className={`${openProfile ? "bg-[#E5E7E3]! pointer-events-none" : ""} h-9! w-max! p-[6px]!`}
              >
                <div className="flex items-center gap-1">
                  <Avatar size="xs" src={user?.photo ? user.photo : ""} />
                  {openProfile ? (
                    <ArrowUp2 variant="Outline" size={12} color="#001010" />
                  ) : (
                    <ArrowDown2 variant="Outline" size={12} color="#001010" />
                  )}
                </div>
              </IconButton>
            </div>
            <ProfileModal open={openProfile} setOpen={setOpenProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}
