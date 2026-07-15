// src/components/layout-components/EventTimerNav.jsx (or wherever your components live)
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router";

// You can export this one too if you want to use it independently elsewhere
export const DigitalTime = ({ time, unit }) => {
  return (
    <div className="digital-numbers flex justify-center items-center">
      <h6 className="text-white min-w-6 sm:min-w-8 font-normal text-sm leading-8 sm:text-xl">
        {time}
      </h6>
      <span className="text-[#55695E] font-normal text-[10px] leading-8 sm:text-sm capitalize">
        {unit}
      </span>
    </div>
  );
};

// Export the main nav component as default
const EventTimerNav = ({ targetDate, onClick }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const location = useLocation();
  const pathname = useMemo(() => location.pathname, [location.pathname]);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft(); // initialize immediately
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const day = String(timeLeft.days).padStart(2, "0");
  const hour = String(timeLeft.hours).padStart(2, "0");
  const minute = String(timeLeft.minutes).padStart(2, "0");
  const second = String(timeLeft.seconds).padStart(2, "0");

  return (
    <nav className="bg-[#011F0F] w-full px-4 sm:px-8 py-3 flex items-center gap-4 flex-shrink-0">
      {pathname.startsWith("/events/") ? (
        <Link to="/home">
          <img src="/logosmall.svg" alt="Logo" className="w-[30px]" />
        </Link>
      ) : (
        <img src="/logosmall.svg" alt="Logo" className="w-[30px]" />
      )}

      <div className="w-full flex justify-end gap-x-4 items-center flex-wrap">
        <span className="text-xs sm:text-lg font-normal paytone text-[#55695E]">
          {targetDate && new Date(targetDate) > new Date()
            ? "Starts In"
            : "Started"}
        </span>
        <div className="flex">
          <DigitalTime time={day} unit="d" />
          <h6 className="text-white leading-8 sm:text-xl digital-numbers">:</h6>
          <DigitalTime time={hour} unit="h" />
          <h6 className="text-white leading-8 font-normal sm:text-xl digital-numbers">
            :
          </h6>
          <DigitalTime time={minute} unit="m" />
          <h6 className="text-white leading-8 font-normal sm:text-xl digital-numbers ">
            :
          </h6>
          <DigitalTime time={second} unit="s" />
        </div>
      </div>
    </nav>
  );
};

export default EventTimerNav;
