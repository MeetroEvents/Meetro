import MeetroLogoAlt from "@/assets/icons/MeetroLogoAlt";
import MeetroLogoAltMobile from "@/assets/icons/MeetroLogoAltMobile";
import Notifications from "../event-dashboard/Notifications";
import ProfileModal from "../event-dashboard/ProfileModal";
import Avatar from "../layout-components/Avatar";
import IconButton from "../layout-components/Buttons/IconButton";
import TagButton from "../layout-components/Buttons/TagButton";
import { useManageEventData } from "@/layouts/ManageEventLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  ArrowDown2,
  ArrowLeft2,
  ArrowUp2,
  Map1,
  MoneyArchive,
  Notification,
} from "iconsax-reactjs";
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { twMerge } from "tailwind-merge";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useNotifications } from "@/hooks/useNotifications";

function ManageEventHeader() {
  // Notifications state
  const [openNotifications, setOpenNotifications] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Get current tab from URL search params
  const tab = searchParams.get("tab") || "overview";
  const { user } = useAuthStore();
  const { event: activeEvent, loading: isLoading } = useManageEventData();
  const { unreadCount } = useNotificationStore();

  useNotifications();

  // Determine if we should show the bottom nav based on URL path
  const showNav =
    !location.pathname.includes("edit-event") &&
    !location.pathname.includes("withdraw");

  // Handle tab change by updating URL search params
  const handleTabChange = value => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("tab", value);
    setSearchParams(newSearchParams);
  };

  // Profile modal state
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full bg-[#FFFFFE]">
      {/* Top */}
      <div className="max-w-[1440px] satoshi py-3 px-4 md:px-8 mx-auto w-full flex-1  gap-4 flex-wrap flex flex-col min-[300px]:flex-row items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link className="hidden min-[400px]:block" to="/home">
            <MeetroLogoAlt />
          </Link>
          <div className="block min-[400px]:hidden">
            <MeetroLogoAltMobile />
          </div>
          <span className="bg-linear-to-r satoshi flex justify-center items-center from-[#BCFF5C] to-[#C0A8FF] text-[8px] font-[700] min-w-[26px] size-fit capitalize px-1 h-[14px] leading-[14px] rounded-2xl text-[#011F0F]">
            Beta
          </span>
        </div>
        {/* State select */}
        <div className="rounded-full hidden min-[680px]:flex items-center max-h-11 justify-between bg-[#FFFFFE] border border-[#E5E7E3] py-[10px] min-w-[282px] px-[6px]">
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
                  <Avatar size="xs" src={`${user?.photo ? user.photo : ""}`} />
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
      {/* Bottom */}
      <div className="max-w-[982px] w-full gap-6 flex-col mx-auto flex p-4">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <TagButton
            leftImg={<ArrowLeft2 />}
            text="Back"
            size="lg"
            className="min-w-0 h-8 hidden sm:inline-flex"
            onClick={() => navigate(-1)}
          />
          <IconButton
            variant="tertiary"
            icon={<ArrowLeft2 size={16} />}
            className="size-8 sm:hidden"
            onClick={() => navigate(-1)}
          />
          {/* Event title */}
          {isLoading ? (
            <div className="flex-1 flex justify-center">
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <h3 className="flex-1 text-center overflow-hidden overflow-ellipsis whitespace-nowrap font-bold satoshi text-base text-[#8A9191]">
              {activeEvent?.title || "Event not found"}
            </h3>
          )}
          {/* Event page button */}
          <Link
            to={!isLoading && activeEvent ? `/events/${activeEvent.slug}` : "#"}
            className={isLoading ? "pointer-events-none" : ""}
            state={{ from: location.pathname }}
          >
            <TagButton
              rightImg={<MoneyArchive variant="Bold" />}
              text="Event Page"
              size="lg"
              className="min-w-0 h-8"
            />
          </Link>
        </div>
        {/* Manage event tabs */}
        {showNav && (
          <div className="flex justify-center">
            <div className="border border-[#F9F9F9]  p-[2px] bg-[#E5E7E3] rounded-full inline-flex items-center">
              <TagButton
                text="Overview"
                size="md"
                className={twMerge(
                  "satoshi min-w-auto px-3",
                  tab === "overview"
                    ? "hover:bg-white bg-white text-[#011F0F]"
                    : "bg-transparent text-[#B0B5B5] border-transparent"
                )}
                onClick={() => handleTabChange("overview")}
              />
              <TagButton
                text="Guests"
                size="md"
                className={twMerge(
                  "satoshi min-w-auto px-3",
                  tab === "guests"
                    ? "hover:bg-white bg-white text-[#011F0F]"
                    : "bg-transparent text-[#B0B5B5] border-transparent"
                )}
                onClick={() => handleTabChange("guests")}
              />
              {activeEvent?.chipInDetails && (
                <TagButton
                  text="Payouts"
                  size="md"
                  className={twMerge(
                    "satoshi min-w-auto px-3",
                    tab === "payouts"
                      ? "hover:bg-white bg-white text-[#011F0F]"
                      : "bg-transparent text-[#B0B5B5] border-transparent"
                  )}
                  onClick={() => handleTabChange("payouts")}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageEventHeader;
