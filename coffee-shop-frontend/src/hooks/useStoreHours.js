import { useState, useEffect } from "react";
import receiptSettingService from "../services/receiptSettingService";

export function useStoreHours() {
  const [status, setStatus] = useState({
    isOpen: false,
    nextOpenMessage: "",
  });

  const [storeSchedule, setStoreSchedule] = useState({
    open: "07:00",
    close: "22:30",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data;
        if (data && data.open_time && data.close_time) {
          setStoreSchedule({
            open: data.open_time,
            close: data.close_time,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy giờ hoạt động:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(":");
      return parseInt(h) + parseInt(m) / 60;
    };

    const checkOpenStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour + currentMinute / 60;

      const openTime = parseTime(storeSchedule.open);
      const closeTime = parseTime(storeSchedule.close);

      let isShopOpen = false;
      let nextOpenMessage = "";

      if (currentTime >= openTime && currentTime < closeTime) {
        isShopOpen = true;
      } else {
        isShopOpen = false;
        if (currentTime < openTime) {
          nextOpenMessage = `Mở cửa hôm nay từ ${storeSchedule.open}`;
        } else {
          nextOpenMessage = `Mở cửa ngày mai từ ${storeSchedule.open}`;
        }
      }

      setStatus({ isOpen: isShopOpen, nextOpenMessage });
    };

    checkOpenStatus();
    const interval = setInterval(checkOpenStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [storeSchedule]);

  return { ...status, storeSchedule };
}
