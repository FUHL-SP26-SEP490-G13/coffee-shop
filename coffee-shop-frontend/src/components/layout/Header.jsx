import { useEffect, useState, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  Menu,
  X,
  Newspaper,
  LogIn,
  ChevronDown,
  Grid3X3,
  Loader2,
  Bell,
  Heart,
  MapPin,
  Moon,
  Sun,
  Coins,
  Ticket,
  LayoutList,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS } from "@/constants";
import authenticationService from "@/services/authenticationService";
import Logo from "/logo/Logo.png";
import categoryService from "@/services/categoryService";
import productService from "@/services/productService";
import notificationService from "@/services/notificationService";
import socket from "@/lib/socket";
import { getNotificationLink } from "@/utils/getNotificationLink";
import favoriteService from "@/services/favoriteService";
import loyaltyService from "@/services/loyaltyService";
import LoyaltyHistoryModal from "@/components/loyalty/LoyaltyHistoryModal";
import receiptSettingService from "@/services/receiptSettingService";

const placeholders = [
  "Xin chào, bạn cần gì hôm nay?",
  "Cà phê sữa đá",
  "Trà đào cam sả",
  "Sinh tố bơ béo ngậy",
];

const CART_KEY = "cart_items";

function Header() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const exploreDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const user = token ? jwtDecode(token) : null;

  const handleLogout = async () => {
    try {
      await authenticationService.logout();
    } finally {
      // Ensure auth is fully cleared even if service call changes later.
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (socket.connected) {
        socket.disconnect();
      }

      window.location.replace("/");
    }
  };

  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUserDropdownOpen, setMobileUserDropdownOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryProductsMap, setCategoryProductsMap] = useState({});

  const [keyword, setKeyword] = useState("");
  const [mobileKeyword, setMobileKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mobileSearchResults, setMobileSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileSearchLoading, setMobileSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recent_searches")) || [];
    } catch {
      return [];
    }
  });
  const [focusedResultIndex, setFocusedResultIndex] = useState(-1);
  const [mobileResultOpen, setMobileResultOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [cartBump, setCartBump] = useState(false);

  // Thêm hook debounce value
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  const [searchViewMode, setSearchViewMode] = useState("list");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [showCartPreview, setShowCartPreview] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const unreadCount = notifications.filter(
    (item) => Number(item.is_read) === 0
  ).length;

  const [storeLogo, setStoreLogo] = useState(() => {
    return localStorage.getItem("cached_store_logo") || Logo;
  });
  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem("cached_store_name") || "Coffee Shop";
  });

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data && data.logo_url) {
          setStoreLogo(data.logo_url);
          localStorage.setItem("cached_store_logo", data.logo_url);
        } else {
          setStoreLogo(Logo);
          localStorage.removeItem("cached_store_logo");
        }
        if (data && data.store_name) {
          setStoreName(data.store_name);
          localStorage.setItem("cached_store_name", data.store_name);
        } else {
          setStoreName("Coffee Shop");
          localStorage.removeItem("cached_store_name");
        }
      } catch (error) {
        setStoreLogo(Logo);
        localStorage.removeItem("cached_store_logo");
        setStoreName("Coffee Shop");
        localStorage.removeItem("cached_store_name");
      }
    };
    fetchLogo();

    const handleReceiptUpdate = () => {
      fetchLogo();
    };

    window.addEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    return () => {
      window.removeEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    };
  }, []);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const loadCartItems = useCallback(() => {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      const list = Array.isArray(cart) ? cart : [];

      setCartItems(list);

      const total = list.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0
      );

      setCartCount(total);
    } catch {
      setCartItems([]);
      setCartCount(0);
    }
  }, []);

  const getCartSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const basePrice =
        Number(item.basePrice) ||
        Number(item.price) ||
        Number(item.selectedPrice) ||
        Number(item.unit_price) ||
        0;

      const toppingsTotal = Array.isArray(item.toppings)
        ? item.toppings.reduce(
          (tSum, topping) =>
            tSum +
            (Number(topping.price) || 0) * (Number(topping.quantity) || 1),
          0
        )
        : 0;

      const quantity = Number(item.quantity) || 1;
      return sum + (basePrice + toppingsTotal) * quantity;
    }, 0);
  };

  const handleRemoveFromCart = (indexToRemove) => {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(cart)) return;
      const newCart = cart.filter((_, idx) => idx !== indexToRemove);
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (e) {
      console.error("Lỗi xóa sản phẩm header preview:", e);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll({ with_count: true });
      const list = Array.isArray(res?.data) ? res.data : [];
      // Lọc bỏ những danh mục không có sản phẩm (chỉ áp dụng trên thanh hiển thị)
      const validCategories = list.filter(c => c.product_count === undefined || Number(c.product_count) > 0);
      setCategories(validCategories);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!user?.id) {
      setFavoriteCount(0);
      return;
    }

    try {
      setFavoriteLoading(true);

      const res = await favoriteService.getMyFavorites({
        page: 1,
        limit: 100,
        keyword: "",
      });

      const payload = res?.data?.data || res?.data || {};
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const total = Number(payload?.total ?? items.length ?? 0);

      setFavoriteCount(total);
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
      setFavoriteCount(0);
    } finally {
      setFavoriteLoading(false);
    }
  }, [user?.id]);

  const loadLoyalty = useCallback(async () => {
    if (!user?.id) {
      setLoyaltyPoints(0);
      return;
    }

    try {
      const res = await loyaltyService.getMyLoyalty();
      const points = Number(res?.data?.total_points ?? 0);
      setLoyaltyPoints(Number.isFinite(points) ? points : 0);
    } catch (error) {
      console.error("Lỗi lấy điểm loyalty:", error);
      setLoyaltyPoints(0);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadCartItems();

    window.addEventListener("storage", loadCartItems);
    window.addEventListener("cartUpdated", loadCartItems);

    const handleCartBump = () => {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 600);
    };
    window.addEventListener("cartUpdated", handleCartBump);

    return () => {
      window.removeEventListener("storage", loadCartItems);
      window.removeEventListener("cartUpdated", loadCartItems);
      window.removeEventListener("cartUpdated", handleCartBump);
    };
  }, [loadCartItems]);

  useEffect(() => {
    if (subIndex < placeholders[index].length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + placeholders[index][subIndex]);
        setSubIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setText("");
        setSubIndex(0);
        setIndex((prev) => (prev + 1) % placeholders.length);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [subIndex, index]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }

      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setCategoryOpen(false);
      }

      if (
        exploreDropdownRef.current &&
        !exploreDropdownRef.current.contains(e.target)
      ) {
        setExploreOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setMobileResultOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const initNotifications = async () => {
      try {
        if (!socket.connected) {
          socket.connect();
        }

        socket.emit("join-user-room", user.id);
        console.log("Customer joined room:", `user-${user.id}`);

        const notificationRes = await notificationService.getMine();
        setNotifications(
          notificationRes?.data?.data || notificationRes?.data || []
        );
      } catch (error) {
        console.error("Init customer notifications error:", error);
      }
    };

    initNotifications();

    const handleNewNotification = (data) => {
      console.log("received customer notification:", data);

      setNotifications((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const existed = list.some(
          (item) => item.recipient_id === data.recipient_id
        );

        if (existed) return list;

        return [{ ...data, is_read: 0 }, ...list];
      });
    };

    socket.on("customer:notification", handleNewNotification);
    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("customer:notification", handleNewNotification);
      socket.off("notification:new", handleNewNotification);
    };
  }, [user?.id]);

  useEffect(() => {
    loadFavorites(); // Load lần đầu khi vừa vào web

    // Dựng ăng-ten để hóng sự kiện
    window.addEventListener("favoriteUpdated", loadFavorites);

    return () => {
      // Nhổ ăng-ten ra khi tắt web
      window.removeEventListener("favoriteUpdated", loadFavorites);
    };
  }, [loadFavorites]);

  useEffect(() => {
    loadLoyalty();
  }, [loadLoyalty]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (searchRef.current) {
          const input = searchRef.current.querySelector('input');
          if (input) input.focus();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const goToCategory = (category) => {
    navigate(`/${category.slug || 'products?category=' + category.id}`);
    setCategoryOpen(false);
    setMobileCategoryOpen(false);
    setMobileMenuOpen(false);
  };

  const handleCategoryHover = useCallback(async (category) => {
    setHoveredCategory(category.id);
    if (!categoryProductsMap[category.id]) {
      try {
        const res = await productService.getByCategory(category.id, { limit: 4, status: "available" });
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        setCategoryProductsMap((prev) => ({ ...prev, [category.id]: list }));
      } catch (error) {
        console.error("Lỗi lấy sản phẩm theo danh mục:", error);
      }
    }
  }, [categoryProductsMap]);

  const normalizeProducts = (res) => {
    const raw = res?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
  };

  const searchProducts = useCallback(async (value, isMobile = false) => {
    const trimmed = value.trim();

    if (!trimmed) {
      if (isMobile) {
        setMobileSearchResults([]);
        setMobileResultOpen(false);
      } else {
        setSearchResults([]);
        setSearchOpen(false);
      }
      return;
    }

    try {
      if (isMobile) {
        setMobileSearchLoading(true);
      } else {
        setSearchLoading(true);
      }

      const res = await productService.search({
        keyword: trimmed,
        limit: 5,
        status: "available",
      });

      const list = normalizeProducts(res);

      if (isMobile) {
        setMobileSearchResults(list);
        setMobileResultOpen(true);
      } else {
        setSearchResults(list);
        setSearchOpen(true);
      }
    } catch (error) {
      console.error("Lỗi tìm kiếm sản phẩm:", error);
      if (isMobile) {
        setMobileSearchResults([]);
      } else {
        setSearchResults([]);
      }
    } finally {
      if (isMobile) {
        setMobileSearchLoading(false);
      } else {
        setSearchLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(keyword, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, searchProducts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(mobileKeyword, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [mobileKeyword, searchProducts]);

  const saveRecentSearch = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedResultIndex >= 0 && keyword && searchResults.length > 0) {
        if (focusedResultIndex < searchResults.length) {
          goToProductDetail(searchResults[focusedResultIndex], false, keyword);
        } else {
          goToSearchPage(keyword);
        }
      } else if (focusedResultIndex >= 0 && !keyword && recentSearches.length > 0) {
        goToSearchPage(recentSearches[focusedResultIndex]);
      } else {
        goToSearchPage(keyword);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxIndex = keyword ? searchResults.length : recentSearches.length - 1;
      setFocusedResultIndex((prev) => Math.min(prev + 1, maxIndex));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedResultIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setFocusedResultIndex(-1);
    }
  };

  const goToSearchPage = (value, isMobile = false) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);

    if (isMobile) {
      setMobileResultOpen(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    } else {
      setSearchOpen(false);
    }
  };

  const goToProductDetail = (product, isMobile = false, searchKw = "") => {
    if (searchKw) saveRecentSearch(searchKw);
    navigate(`/${product.slug || 'products/' + product.id}`);
    if (isMobile) {
      setMobileResultOpen(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    } else {
      setSearchOpen(false);
    }
  };

  const handleReadNotification = async (item) => {
    try {
      if (Number(item.is_read) === 0 && item.recipient_id) {
        await notificationService.markAsRead(item.recipient_id);
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.recipient_id === item.recipient_id ? { ...n, is_read: 1 } : n
        )
      );

      setShowNotifications(false);

      const targetLink = getNotificationLink(item);
      navigate(targetLink);
    } catch (error) {
      console.error("Read customer notification error:", error);
    }
  };

  const handleToggleRead = async (item, e) => {
    e.stopPropagation();

    try {
      if (Number(item.is_read) === 0) {
        await notificationService.markAsRead(item.recipient_id);

        setNotifications((prev) =>
          prev.map((n) =>
            n.recipient_id === item.recipient_id
              ? { ...n, is_read: 1, read_at: new Date().toISOString() }
              : n
          )
        );
      } else {
        await notificationService.markAsUnread(item.recipient_id);

        setNotifications((prev) =>
          prev.map((n) =>
            n.recipient_id === item.recipient_id
              ? { ...n, is_read: 0, read_at: null }
              : n
          )
        );
      }
    } catch (error) {
      console.error("Toggle customer notification error:", error);
    }
  };

  const toggleAllReadStatus = async () => {
    try {
      const hasUnread = notifications.some(
        (item) => Number(item.is_read) === 0
      );

      if (hasUnread) {
        await notificationService.markAllAsRead();
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            is_read: 1,
            read_at: new Date().toISOString(),
          }))
        );
      } else {
        await notificationService.markAllAsUnread();
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            is_read: 0,
            read_at: null,
          }))
        );
      }
    } catch (error) {
      console.error("Toggle all customer notifications error:", error);
    }
  };

  const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="text-red-500 font-bold bg-gray-100 dark:bg-gray-800/50 rounded px-0.5">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const renderSearchItem = (item, isMobile = false, kw = "", isFocused = false) => {
    const itemImages = Array.isArray(item.images) ? item.images : [];
    const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];

    const image = itemImages[0]?.image_url || defaultImage;
    const minPrice =
      itemSizes.length > 0
        ? Math.min(...itemSizes.map((s) => Number(s.price)))
        : null;

    return (
      <button
        key={item.id}
        type="button"
        onMouseEnter={() => !isMobile && setFocusedResultIndex(-1)}
        onClick={() => goToProductDetail(item, isMobile, kw)}
        className={`w-full flex items-center gap-4 px-4 py-3 transition text-left border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${isFocused ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-inset ring-amber-500/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
      >
        <img
          src={image}
          alt={item.name}
          className="w-16 h-16 object-cover flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
            {highlightText(item.name, kw)}
          </p>
          <p className="text-sm font-semibold text-red-500 mt-1">
            {minPrice !== null
              ? `${minPrice.toLocaleString("vi-VN")}đ`
              : "Liên hệ"}
          </p>
        </div>
      </button>
    );
  };

  const renderSearchItemGrid = (item, isMobile = false, kw = "", isFocused = false) => {
    const itemImages = Array.isArray(item.images) ? item.images : [];
    const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];

    const image = itemImages[0]?.image_url || defaultImage;
    const minPrice =
      itemSizes.length > 0
        ? Math.min(...itemSizes.map((s) => Number(s.price)))
        : null;

    return (
      <button
        key={item.id}
        type="button"
        onMouseEnter={() => !isMobile && setFocusedResultIndex(-1)}
        onClick={() => goToProductDetail(item, isMobile, kw)}
        className={`w-full flex flex-col items-center gap-2 p-3 transition text-center border border-gray-100 dark:border-gray-800 rounded-xl ${isFocused ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
      >
        <img
          src={image}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border border-gray-100 dark:border-gray-800"
        />

        <div className="min-w-0 flex-1 mt-1 w-full flex flex-col items-center">
          <p className="text-[14px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
            {highlightText(item.name, kw)}
          </p>
          <p className="text-[13px] font-semibold text-red-500 mt-1">
            {minPrice !== null
              ? `${minPrice.toLocaleString("vi-VN")}đ`
              : "Liên hệ"}
          </p>
        </div>
      </button>
    );
  };

  return (
    <>
      <header className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="w-full px-4 lg:px-6 xl:px-8 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-3 lg:gap-0">
          <div
            className="flex-shrink-0 cursor-pointer flex items-center gap-2 sm:gap-3 lg:w-[250px]"
            onClick={() => navigate("/")}
          >
            <img
              src={storeLogo}
              onError={(e) => { e.currentTarget.src = Logo; }}
              alt={`${storeName} Logo`}
              className="h-10 sm:h-12 w-auto hover:opacity-80 transition-opacity duration-300 object-contain rounded-xl"
            />
            <h1 className="hidden sm:block text-lg lg:text-xl font-bold text-amber-900 dark:text-amber-500 whitespace-nowrap" style={{ fontFamily: 'serif' }}>
              {storeName}
            </h1>
          </div>

          <div className="hidden md:flex flex-1 w-full max-w-sm lg:max-w-2xl mr-auto ml-4 lg:ml-0 lg:pl-6 px-2 lg:px-0">
            <div className="w-full relative" ref={searchRef}>
              <div className="relative">
                <Input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setFocusedResultIndex(-1);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    if (keyword && searchResults.length > 0) setFocusedResultIndex(-1);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={text || "Tìm kiếm sản phẩm..."}
                  className="w-full rounded-full py-2 pl-4 pr-24 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:bg-white dark:bg-gray-900 dark:border-gray-800 transition"
                />

                {!keyword && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none hidden lg:flex space-x-1 items-center bg-gray-200 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 dark:text-gray-500">
                    <span>Ctrl</span><span>K</span>
                  </div>
                )}

                {keyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setFocusedResultIndex(-1);
                      const input = searchRef.current?.querySelector('input');
                      if (input) input.focus();
                    }}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => goToSearchPage(keyword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {searchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 dark:border-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  {!keyword ? (
                    recentSearches.length > 0 ? (
                      <div className="py-2">
                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-50 dark:border-gray-800">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Tìm kiếm gần đây</span>
                          <button onClick={() => setRecentSearches([])} className="text-xs text-amber-600 hover:text-amber-700">Xóa</button>
                        </div>
                        <ul className="py-1">
                          {recentSearches.map((kw, idx) => (
                            <li key={idx}>
                              <button
                                onClick={() => goToSearchPage(kw)}
                                onMouseEnter={() => setFocusedResultIndex(-1)}
                                className={`w-[calc(100%-16px)] mx-2 rounded-lg text-left px-4 py-2.5 text-sm flex items-center gap-2 transition ${focusedResultIndex === idx ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-amber-50 dark:bg-amber-900/20'}`}
                              >
                                <Search className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-700 dark:text-gray-300">{kw}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  ) : searchLoading ? (
                    <div className="flex items-center justify-center py-6 text-gray-500 dark:text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Đang tìm kiếm...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-500">
                      Không tìm thấy sản phẩm phù hợp
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[17px] font-bold text-gray-500 dark:text-gray-400">
                            Kết quả tìm kiếm cho <span className="text-red-500">{keyword}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <LayoutList
                              onClick={() => setSearchViewMode("list")}
                              className={`w-6 h-6 p-0.5 rounded-sm cursor-pointer border ${searchViewMode === 'list' ? 'text-gray-800 dark:text-gray-200 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600'}`} />
                            <Grid3X3
                              onClick={() => setSearchViewMode("grid")}
                              className={`w-6 h-6 p-0.5 rounded-sm cursor-pointer border ${searchViewMode === 'grid' ? 'text-gray-800 dark:text-gray-200 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600'}`} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">Hiển thị kết quả theo:</span>
                          <button className="bg-gray-400 text-white px-4 py-1.5 rounded-full text-[15px] font-medium hover:bg-gray-500 transition shadow-sm">Sản phẩm</button>
                        </div>
                      </div>

                      <div className="max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                        {searchViewMode === 'list' ? (
                          searchResults.map((item, idx) => renderSearchItem(item, false, keyword, idx === focusedResultIndex))
                        ) : (
                          <div className="grid grid-cols-3 gap-3 p-4">
                            {searchResults.map((item, idx) => renderSearchItemGrid(item, false, keyword, idx === focusedResultIndex))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onMouseEnter={() => setFocusedResultIndex(-1)}
                        onClick={() => goToSearchPage(keyword)}
                        className={`w-full py-4 text-[15px] text-center border-t border-gray-200 dark:border-gray-700 transition relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${focusedResultIndex === searchResults.length ? 'bg-amber-50 dark:bg-amber-900/20 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        Xem thêm sản phẩm có chứa <span className="text-red-500">{keyword}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            <div
              className="hidden lg:flex items-center relative h-full"
              ref={exploreDropdownRef}
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className={`flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl transition-all border ${exploreOpen
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800"
                  : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                  }`}
              >
                <span className="text-[13px] uppercase tracking-wide">Khám phá</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {exploreOpen && (
                <div className="absolute top-full right-0 pt-2 z-[100]">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl w-[200px] py-2">
                    <button
                      onClick={() => {
                        setExploreOpen(false);
                        navigate("/store");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-amber-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:text-amber-600"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Cửa hàng</span>
                    </button>
                    <button
                      onClick={() => {
                        setExploreOpen(false);
                        navigate("/news");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-amber-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:text-amber-600"
                    >
                      <Newspaper className="w-4 h-4" />
                      <span>Tin tức</span>
                    </button>
                    <button
                      onClick={() => {
                        setExploreOpen(false);
                        navigate("/discounts");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-amber-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:text-amber-600"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Khuyến mãi</span>
                    </button>

                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="relative p-2 rounded-full border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 flex items-center justify-center transition-colors"
              title="Bật/Tắt giao diện tối"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
            </Button>

            <div className="hidden sm:flex items-center gap-1 lg:gap-2">
              <div
                className="relative"
                onMouseEnter={() => {
                  loadCartItems();
                  setShowCartPreview(true);
                }}
                onMouseLeave={() => setShowCartPreview(false)}
              >
                <Button
                  onClick={() => navigate("/cart")}
                  size="sm"
                  className={`relative gap-1 sm:gap-2 text-xs sm:text-sm ${cartBump ? "animate-bounce ring-4 ring-amber-500/50" : "transition-all duration-300"
                    }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Giỏ hàng</span>

                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Button>

                {showCartPreview && (
                  <div className="absolute right-0 top-full pt-2 w-[360px] z-50">
                    <div className="bg-white dark:bg-gray-900 dark:border-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                      {cartItems.length > 0 && (
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Giỏ hàng của bạn</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.setItem(CART_KEY, "[]");
                              window.dispatchEvent(new Event("cartUpdated"));
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Xóa tất cả
                          </button>
                        </div>
                      )}
                      <div className="max-h-80 overflow-y-auto">
                        {cartItems.length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 dark:text-gray-500">
                            Giỏ hàng đang trống
                          </div>
                        ) : (
                          cartItems.map((item, idx) => {
                            const image =
                              item.image ||
                              item.image_url ||
                              item.thumbnail ||
                              item.product_image ||
                              defaultImage;

                            const basePrice =
                              Number(item.basePrice) ||
                              Number(item.price) ||
                              Number(item.selectedPrice) ||
                              Number(item.unit_price) ||
                              0;

                            const toppingsTotal = Array.isArray(item.toppings)
                              ? item.toppings.reduce(
                                (sum, topping) =>
                                  sum +
                                  (Number(topping.price) || 0) *
                                  (Number(topping.quantity) || 1),
                                0
                              )
                              : 0;

                            const price = basePrice + toppingsTotal;

                            const quantity = Number(item.quantity) || 1;

                            return (
                              <div
                                key={`${item.product_id || item.id}-${item.size || idx}`}
                                onClick={() =>
                                  navigate(`/products/${item.product_id || item.id}`)
                                }
                                className="group flex gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 relative pr-10"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFromCart(idx);
                                  }}
                                  className="absolute right-2 top-2 lg:opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                                  title="Xóa khỏi giỏ hàng"
                                >
                                  <X className="w-4 h-4" />
                                </button>

                                <img
                                  src={image}
                                  alt={item.name}
                                  className="w-14 h-14 rounded object-cover border"
                                />

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                                    {item.name}
                                  </p>

                                  {item.size && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      {item.size}
                                    </p>
                                  )}

                                  {Array.isArray(item.toppings) &&
                                    item.toppings.length > 0 && (
                                      <div className="mt-1 space-y-0.5">
                                        {item.toppings.map((topping) => (
                                          <p
                                            key={topping.topping_id}
                                            className="text-[11px] text-gray-500 dark:text-gray-500"
                                          >
                                            + {topping.name}
                                          </p>
                                        ))}
                                      </div>
                                    )}

                                  <p className="text-sm text-red-600 font-semibold mt-1">
                                    {price.toLocaleString("vi-VN")}đ x {quantity}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {cartItems.length > 0 && (
                        <div className="p-3 border-t bg-white dark:bg-gray-900 dark:border-gray-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            Tổng tiền tạm tính:{" "}
                            <span className="font-semibold text-red-600">
                              {getCartSubtotal().toLocaleString("vi-VN")}đ
                            </span>
                          </p>

                          <Button
                            onClick={() => {
                              setShowCartPreview(false);
                              navigate("/checkout");
                            }}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            Tiến hành thanh toán
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user && (
                <div className="relative" ref={notificationRef}>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications((prev) => !prev)}
                      className="relative p-2"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </div>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-[360px] bg-white dark:bg-gray-900 dark:border-gray-800 border rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <h3 className="font-semibold">Thông báo</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={toggleAllReadStatus}
                            className="text-sm text-primary hover:underline"
                          >
                            {notifications.some(
                              (item) => Number(item.is_read) === 0
                            )
                              ? "Đánh dấu tất cả đã đọc"
                              : "Đánh dấu tất cả chưa đọc"}
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground dark:text-gray-400">
                            Chưa có thông báo nào
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <button
                              key={
                                item.recipient_id ||
                                `${item.id}-${item.created_at}`
                              }
                              onClick={() => handleReadNotification(item)}
                              className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 ${Number(item.is_read) === 0
                                ? "bg-orange-50"
                                : "bg-white dark:bg-gray-900 dark:border-gray-800"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                                    {item.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(item.created_at).toLocaleString(
                                      "vi-VN"
                                    )}
                                  </p>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  {Number(item.is_read) === 0 && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                                  )}

                                  <button
                                    onClick={(e) => handleToggleRead(item, e)}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {Number(item.is_read) === 0
                                      ? "Đã đọc"
                                      : "Chưa đọc"}
                                  </button>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}


            </div>
            {!user && (
              <Button
                onClick={() => navigate("/login")}
                size="sm"
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Button>
            )}

            {user && (
              <div className="flex items-center gap-1 lg:gap-2">
                <div
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 sm:gap-2 text-gray-700 dark:text-gray-300 transition p-1.5 sm:p-2"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.first_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline text-sm">
                      Xin chào, {user.first_name} {user.last_name}!
                    </span>
                  </Button>

                  {open && (
                    <div className="absolute right-0 top-full pt-1 w-48 sm:w-56 z-50">
                      <div className="bg-white dark:bg-gray-900 dark:border-gray-800 shadow-xl rounded-lg sm:rounded-2xl p-1.5 sm:p-2 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 flex flex-col gap-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate("/my-orders");
                            setOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 transition text-xs sm:text-sm justify-start"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          <span>Đơn hàng</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate("/favorites");
                            setOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 transition text-xs sm:text-sm justify-start"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          <span className="flex-1 text-left">Yêu thích</span>

                          <span className="text-xs font-semibold text-red-500">
                            {favoriteLoading ? "..." : favoriteCount}
                          </span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate("/customer/profile");
                            setOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 transition text-xs sm:text-sm justify-start"
                        >
                          <User className="w-4 h-4 mr-2" />
                          <span>Hồ sơ cá nhân</span>
                        </Button>

                        <div className="mx-2 my-1 rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 text-amber-900 dark:border-amber-900/40 dark:from-amber-900/20 dark:to-orange-900/10 dark:text-amber-100">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-800/40 dark:text-amber-200">
                                <Coins className="h-4 w-4" />
                              </span>
                              <span className="text-[11px] font-medium uppercase tracking-wide text-amber-700/90 dark:text-amber-300">
                                Điểm thưởng
                              </span>
                            </div>
                            <span className="text-sm font-bold tabular-nums">
                              {Number(loyaltyPoints || 0).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false);
                              setLoyaltyModalOpen(true);
                            }}
                            className="mt-2 w-full rounded-md border border-amber-300/60 bg-white/70 px-2.5 py-1.5 text-center text-[11px] font-semibold text-amber-700 transition hover:bg-white dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200"
                          >
                            Xem biểu đồ lịch sử điểm
                          </button>
                        </div>

                        <div className="my-0.5 border-t border-gray-200 dark:border-gray-700" />

                        <button
                          onClick={() => {
                            setOpen(false);
                            setLogoutDialogOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950">
          <div className="w-full relative" ref={searchRef}>
            <Input
              type="text"
              value={mobileKeyword}
              onChange={(e) => setMobileKeyword(e.target.value)}
              onFocus={() => {
                if (mobileSearchResults.length > 0) setMobileResultOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  goToSearchPage(mobileKeyword, true);
                }
              }}
              placeholder={text || "Tìm kiếm sản phẩm..."}
              className="w-full rounded-full py-2 pl-4 pr-12 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 focus:border-amber-500 focus:bg-white dark:bg-gray-900 dark:border-gray-800 transition"
            />

            <button
              type="button"
              onClick={() => goToSearchPage(mobileKeyword, true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition duration-300"
            >
              <Search className="w-4 h-4" />
            </button>

            {mobileResultOpen && (
              <div className="mt-2 bg-white dark:bg-gray-900 dark:border-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
                {mobileSearchLoading ? (
                  <div className="flex items-center justify-center py-6 text-gray-500 dark:text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang tìm kiếm...
                  </div>
                ) : mobileSearchResults.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-500">
                    Không tìm thấy sản phẩm phù hợp
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative z-10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[15px] font-bold text-gray-500 dark:text-gray-400">
                          Kết quả tìm kiếm cho <span className="text-red-500">{mobileKeyword}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <LayoutList
                            onClick={() => setSearchViewMode("list")}
                            className={`w-5 h-5 p-0.5 rounded-sm cursor-pointer border ${searchViewMode === 'list' ? 'text-gray-800 dark:text-gray-200 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600'}`} />
                          <Grid3X3
                            onClick={() => setSearchViewMode("grid")}
                            className={`w-5 h-5 p-0.5 rounded-sm cursor-pointer border ${searchViewMode === 'grid' ? 'text-gray-800 dark:text-gray-200 border-gray-800 dark:border-gray-200 bg-gray-100 dark:bg-gray-800' : 'text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-600'}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-[14px]">Hiển thị kết quả theo:</span>
                        <button className="bg-gray-400 text-white px-3 py-1 rounded-full text-[14px] font-medium hover:bg-gray-500 transition shadow-sm">Sản phẩm</button>
                      </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                      {searchViewMode === 'list' ? (
                        mobileSearchResults.map((item) =>
                          renderSearchItem(item, true, mobileKeyword)
                        )
                      ) : (
                        <div className="grid grid-cols-2 gap-3 p-3">
                          {mobileSearchResults.map((item) => renderSearchItemGrid(item, true, mobileKeyword))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => goToSearchPage(mobileKeyword, true)}
                      className="w-full py-4 text-[15px] text-center border-t border-gray-200 dark:border-gray-700 transition relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Xem thêm sản phẩm có chứa <span className="text-red-500">{mobileKeyword}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950">
          <div className="px-3 py-2 space-y-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
              className="w-full justify-start text-gray-700 dark:text-gray-300 text-xs"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Danh mục
            </Button>

            {mobileCategoryOpen && (
              <div className="bg-white dark:bg-gray-900 dark:border-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 ml-2 mb-2 space-y-1">
                {categories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-500">
                    Không có danh mục
                  </div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => goToCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:bg-amber-900/20 group"
                    >
                      <span>{category.name}</span>
                      {category.product_count !== undefined && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full group-hover:bg-amber-200 group-hover:text-amber-700 transition-colors">
                          {category.product_count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate("/cart");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 dark:text-gray-300 text-xs"
            >
              <div className="relative mr-2">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              Giỏ hàng
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                }}
                className="w-full justify-start text-gray-700 dark:text-gray-300 text-xs"
              >
                <div className="relative mr-2">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                Thông báo
              </Button>
            )}

            {user && showNotifications && (
              <div className="bg-white dark:bg-gray-900 dark:border-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 ml-2 mb-2">
                <div className="flex items-center justify-between px-2 py-2 border-b mb-2">
                  <h3 className="font-semibold text-sm">Thông báo</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={toggleAllReadStatus}
                      className="text-xs text-primary hover:underline"
                    >
                      {notifications.some((item) => Number(item.is_read) === 0)
                        ? "Đọc tất cả"
                        : "Chưa đọc tất cả"}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground dark:text-gray-400">
                      Chưa có thông báo nào
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={
                          item.recipient_id || `${item.id}-${item.created_at}`
                        }
                        onClick={() => {
                          handleReadNotification(item);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-3 border-b rounded-md ${Number(item.is_read) === 0
                          ? "bg-orange-50"
                          : "bg-white dark:bg-gray-900 dark:border-gray-800"
                          }`}
                      >
                        <p className="font-medium text-xs">{item.title}</p>
                        <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                          {item.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(item.created_at).toLocaleString("vi-VN")}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}



            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate("/news");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 dark:text-gray-300 text-xs"
            >
              <Newspaper className="w-4 h-4 mr-2" />
              Tin tức
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate("/discounts");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 dark:text-gray-300 text-xs"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Mã khuyến mãi
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn đăng xuất?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleLogout();
              }}
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoyaltyHistoryModal
        open={loyaltyModalOpen}
        onOpenChange={setLoyaltyModalOpen}
        loyaltyPoints={loyaltyPoints}
      />
    </>
  );
}

export default Header;
