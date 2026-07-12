import { useDisableScroll } from "@/hooks/useDisableScroll";
import { I24Support, Logout, Setting4, User } from "iconsax-reactjs";
import { useEffect, useState, useRef } from "react";
import { Link, NavLink } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { authApi } from "@/services/authApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { twMerge } from "tailwind-merge";
import { eventsApi } from "@/services/eventsApi";
import CloseIcon from "@/assets/icons/CloseIcon";
import TextButton from "../layout-components/Buttons/TextButtons";
import Avatar from "../layout-components/Avatar";

export default function ProfileModal({ open, setOpen }) {
  // IsMobile
  const [isMobile, setIsMobile] = useState(false);

  // User details
  const { user, setUser, setAccessToken, setRefreshToken } = useAuthStore();

  // Fetch user events count
  const { data: userEventsCount, isLoading: isUserEventsCountLoading } =
    useQuery({
      queryKey: ["userEventsCount"],
      queryFn: eventsApi.getUserEventsCount,
      onError: error => {
        console.log(
          "Error fetching user events count:",
          error?.response?.data?.message || error.message
        );
      },
    });

  const { mutate: logoutMutate, isPending: loading } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setOpen(false);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem("auth-storage");
    },
    onError: error => {
      console.log(
        "Logout error:",
        error?.response?.data?.message || error.message
      );
    },
  });

  // Handle logout
  const handleLogout = () => logoutMutate();
  // Ref for the profile modal container
  const profileModalRef = useRef(null);

  // Disable scroll hook
  useDisableScroll(open && isMobile);

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
        profileModalRef.current &&
        !profileModalRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  return (
    <div
      ref={profileModalRef}
      className={twMerge(
        "satoshi w-full z-20 md:z-auto h-full md:h-auto bg-[#f0f0f0] fixed top-0 left-0 md:top-[calc(100%+13px)] md:left-auto md:right-0 md:absolute md:rounded-[24px] overflow-hidden shadow-[0_4px_24px_0_rgba(0,0,0,0.25)] md:min-w-[272px] flex flex-col md:p-1",
        open ? "flex pointer-events-auto" : "hidden pointer-events-none"
      )}
    >
      {/* Top */}
      <div className="py-3 px-6 md:p-2 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <Avatar size="xl" src={user?.photo ? user.photo : ""} />
          <button
            onClick={() => setOpen(false)}
            className="md:hidden cursor-pointer"
          >
            <CloseIcon className="md:hidden" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-[18px] leading-[12px] paytone">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm font-medium text-[#8A9191]">{user.email}</p>
        </div>
      </div>
      {/* Bottom */}
      <div className="bg-white flex-1 flex flex-col justify-between md:rounded-[20px] md:shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] px-6 pt-3 pb-7 md:p-2">
        <div className="flex flex-col">
          <div className="flex flex-col gap-y-4">
            <div className="flex py-3 justify-center border rounded-[16px] border-[#F0F0F0]">
              <div className="text-center flex-1 flex flex-col">
                <span className="paytone text-[#001010] text-base">
                  {isUserEventsCountLoading ? (
                    <div className="h-4 w-8 bg-gray-300 animate-pulse rounded mx-auto"></div>
                  ) : (
                    userEventsCount?.created || 0
                  )}
                </span>
                <span className="text-[12px] leading-[18px] font-bold text-[#8A9191]">
                  Hosted
                </span>
              </div>
              <div className="min-h-full w-[1px] bg-[#F0F0F0]"></div>
              <div className="text-center flex-1 flex flex-col">
                <span className="paytone text-[#001010] text-base">
                  {isUserEventsCountLoading ? (
                    <div className="h-4 w-8 bg-gray-300 animate-pulse rounded mx-auto"></div>
                  ) : (
                    userEventsCount?.attended || 0
                  )}
                </span>
                <span className="text-[12px] leading-[18px] font-bold text-[#8A9191]">
                  Attended
                </span>
              </div>
            </div>
            {/* Profile navigation */}
            <ul className="flex flex-col border-b border-b-[#E2E2E2]">
              <li>
                <NavLink
                  onClick={() => setOpen(false)}
                  to="/profile"
                  className={({ isActive }) =>
                    `flex items-center gap-x-1 px-1 py-3 md:py-2 rounded-[8px] transition-colors hover:bg-[#F0F0F0] ${
                      isActive ? "bg-[#F0F0F0]" : ""
                    }`
                  }
                >
                  <User
                    className="size-5 md:size-4"
                    color="#077D8A"
                    variant="Bold"
                  />
                  <span className="text-sm font-bold md:font-medium md:text-[12px] leading-[18px]">
                    My Profile
                  </span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-x-1 px-1 py-3 md:py-2 rounded-[8px] transition-colors hover:bg-[#F0F0F0] ${
                      isActive ? "bg-[#F0F0F0]" : ""
                    }`
                  }
                >
                  <Setting4
                    color="#866AD2"
                    variant="Bold"
                    className="size-5 md:size-4"
                  />
                  <span className="text-sm font-bold md:font-medium md:text-[12px] leading-[18px]">
                    Settings
                  </span>
                </NavLink>
              </li>
              <li>
                <button
                  to="/contact"
                  onClick={() => {
                    setOpen(false);
                    // Open email client in new tab with pre-filled email address
                    window.open("mailto:tech@meetrolive.com", "_blank");
                  }}
                  className={`flex w-full items-center gap-x-1 px-1 py-3 md:py-2 rounded-[8px] transition-colors hover:bg-[#F0F0F0] 
                    }`}
                >
                  <I24Support
                    size="32"
                    color="#218FFD"
                    variant="Bold"
                    className="size-5 md:size-4"
                  />
                  <span className="text-sm font-bold md:font-medium md:text-[12px] leading-[18px]">
                    Contact us
                  </span>
                </button>
              </li>
            </ul>
          </div>
          {/* Log out */}
          <button
            disabled={loading}
            onClick={handleLogout}
            className="flex gap-x-1 cursor-pointer items-center px-1 py-3 md:py-2 rounded-[8px] transition-colors hover:bg-[#F0F0F0]"
          >
            <Logout
              className="size-5 md:size-4"
              color="#DB2863"
              variant="Bold"
            />
            <span className="text-sm text-[#DB2863] font-bold md:font-medium md:text-[12px] leading-[18px]">
              Sign Out
            </span>
          </button>
        </div>
        {/* Create event button */}
        <Link to="/create-event" onClick={() => setOpen(false)}>
          <TextButton
            text="Create Event"
            className="w-full h-[50px] md:hidden"
          />
        </Link>
      </div>
    </div>
  );
}
