import { Toaster } from "./components/ui/sonner";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/common/ScrollToTop";
import { useEffect } from "react";
import receiptSettingService from "@/services/receiptSettingService";

export default function App() {
  useEffect(() => {
    const applyFavicon = (logoUrl) => {
      if (logoUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.type = 'image/png';
        link.href = logoUrl;
      }
    };

    const fetchConfig = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data) {
          if (data.logo_url) {
            localStorage.setItem("cached_store_logo", data.logo_url);
            applyFavicon(data.logo_url);
          } else {
            localStorage.removeItem("cached_store_logo");
          }
          if (data.store_name) {
            localStorage.setItem("cached_store_name", data.store_name);
          } else {
            localStorage.removeItem("cached_store_name");
          }
          // Notify components that might be interested
          window.dispatchEvent(new Event("receiptSettingsUpdated"));
        }
      } catch (e) {
        console.error("Lỗi cập nhật cấu hình ở App.jsx:", e);
      }
    };

    // Áp dụng ngay từ cache nếu có
    const cachedLogo = localStorage.getItem("cached_store_logo");
    applyFavicon(cachedLogo);

    // Fetch config từ server
    fetchConfig();

    const handleUpdate = () => {
      const newLogo = localStorage.getItem("cached_store_logo");
      applyFavicon(newLogo);
    };

    window.addEventListener("receiptSettingsUpdated", handleUpdate);
    return () => window.removeEventListener("receiptSettingsUpdated", handleUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <AppRoutes />

      <Toaster position="top-right" richColors closeButton duration={3000} visibleToasts={1} />
    </div>
  );
}
