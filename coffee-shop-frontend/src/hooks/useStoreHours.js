import { useState, useEffect } from "react";

export function useStoreHours() {
  const [status, setStatus] = useState({
    isOpen: false,
    nextOpenMessage: "",
  });

  useEffect(() => {
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(":");
      return parseInt(h) + parseInt(m) / 60;
    };

    const getDaySchedule = (dayIndex) => {
      // 0 is Sunday, 1-5 is Mon-Fri, 6 is Saturday
      if (dayIndex >= 1 && dayIndex <= 5) {
        return { open: "07:00", close: "22:30" };
      } else {
        return { open: "07:30", close: "23:00" };
      }
    };

    const checkOpenStatus = () => {
      const now = new Date();
      const day = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour + currentMinute / 60;

      const todaySchedule = getDaySchedule(day);
      const openTime = parseTime(todaySchedule.open);
      const closeTime = parseTime(todaySchedule.close);

      let isShopOpen = false;
      let nextOpenMessage = "";

      if (currentTime >= openTime && currentTime < closeTime) {
        isShopOpen = true;
      } else {
        isShopOpen = false;
        if (currentTime < openTime) {
          nextOpenMessage = `Mở cửa hôm nay từ ${todaySchedule.open}`;
        } else {
          // It's past closing time, get tomorrow's schedule
          const tomorrowDay = (day + 1) % 7;
          const tomorrowSchedule = getDaySchedule(tomorrowDay);
          nextOpenMessage = `Mở cửa ngày mai từ ${tomorrowSchedule.open}`;
        }
      }

      setStatus({ isOpen: isShopOpen, nextOpenMessage });
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return status;
}
