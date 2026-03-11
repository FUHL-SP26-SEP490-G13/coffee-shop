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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS } from "@/constants";
import Logo from "/logo/Logo.png";
import categoryService from "@/services/categoryService";
import productService from "@/services/productService";
import notificationService from "@/services/notificationService";
import socket from "@/lib/socket";
import { getNotificationLink } from "@/utils/getNotificationLink";

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
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const user = token ? jwtDecode(token) : null;

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    navigate("/");
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
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [mobileKeyword, setMobileKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [mobileSearchResults, setMobileSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileSearchLoading, setMobileSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileResultOpen, setMobileResultOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [cartItems, setCartItems] = useState([]);
  const [showCartPreview, setShowCartPreview] = useState(false);

  const unreadCount = notifications.filter(
    (item) => Number(item.is_read) === 0
  ).length;

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
    } catch (error) {
      setCartItems([]);
      setCartCount(0);
    }
  }, []);

  const getCartSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price =
        Number(item.price) ||
        Number(item.selectedPrice) ||
        Number(item.unit_price) ||
        0;

      const quantity = Number(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryService.getAll();
      const list = Array.isArray(res?.data) ? res.data : [];
      setCategories(list);
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadCartItems();

    window.addEventListener("storage", loadCartItems);
    window.addEventListener("cartUpdated", loadCartItems);

    return () => {
      window.removeEventListener("storage", loadCartItems);
      window.removeEventListener("cartUpdated", loadCartItems);
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

  const goToCategory = (category) => {
    navigate(`/products?category=${category.id}`);
    setCategoryOpen(false);
    setMobileCategoryOpen(false);
    setMobileMenuOpen(false);
  };

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

  const goToSearchPage = (value, isMobile = false) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    navigate(`/products?keyword=${encodeURIComponent(trimmed)}`);

    if (isMobile) {
      setMobileResultOpen(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    } else {
      setSearchOpen(false);
    }
  };

  const goToProductDetail = (productId, isMobile = false) => {
    navigate(`/products/${productId}`);
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

  const renderSearchItem = (item, isMobile = false) => {
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
        onClick={() => goToProductDetail(item.id, isMobile)}
        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-amber-50 transition text-left"
      >
        <img
          src={image}
          alt={item.name}
          className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {item.name}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {item.category_name || "Danh mục"}
          </p>
          <p className="text-sm font-semibold text-amber-600 mt-1">
            {minPrice !== null
              ? `${minPrice.toLocaleString("vi-VN")}đ`
              : "Liên hệ"}
          </p>
        </div>
      </button>
    );
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-3 lg:gap-4">
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={Logo}
            alt="Coffee Shop Logo"
            className="h-10 sm:h-12 w-auto hover:opacity-80 transition-opacity duration-300"
          />
        </div>

        <div className="flex-1 mx-2 sm:mx-4 lg:mx-8 hidden md:flex">
          <div className="w-full relative" ref={searchRef}>
            <Input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  goToSearchPage(keyword);
                }
              }}
              placeholder={text || "Tìm kiếm sản phẩm..."}
              className="w-full rounded-full py-2 pl-4 pr-12 bg-gray-50 border border-gray-200 focus:border-amber-500 focus:bg-white transition"
            />

            <button
              type="button"
              onClick={() => goToSearchPage(keyword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition"
            >
              <Search className="w-4 h-4" />
            </button>

            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-6 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang tìm kiếm...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    Không tìm thấy sản phẩm phù hợp
                  </div>
                ) : (
                  <>
                    {searchResults.map((item) => renderSearchItem(item))}
                    <button
                      type="button"
                      onClick={() => goToSearchPage(keyword)}
                      className="w-full px-4 py-3 text-sm text-center text-amber-600 border-t border-gray-100 hover:bg-amber-50"
                    >
                      Xem tất cả kết quả cho "{keyword.trim()}"
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="w-5 h-5" />
          </Button>

          <div className="relative hidden lg:block" ref={categoryDropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryOpen(!categoryOpen)}
              className="flex items-center gap-2 text-sm"
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Danh mục</span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {categoryOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50">
                {categories.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Không có danh mục
                  </div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => goToCategory(category)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 hover:text-amber-700 transition text-sm"
                    >
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/news")}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hidden lg:flex"
          >
            <Newspaper className="w-4 h-4" />
            <span>Tin tức</span>
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
                className="relative gap-1 sm:gap-2 text-xs sm:text-sm"
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
                <div className="absolute right-0 mt-2 w-[360px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    {cartItems.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">
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

                        const price =
                          Number(item.price) ||
                          Number(item.selectedPrice) ||
                          Number(item.unit_price) ||
                          0;

                        const quantity = Number(item.quantity) || 1;

                        return (
                          <div
                            key={`${item.product_id || item.id}-${
                              item.size || idx
                            }`}
                            onClick={() =>
                              navigate(
                                `/products/${item.product_id || item.id}`
                              )
                            }
                            className="flex gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                          >
                            <img
                              src={image}
                              alt={item.name}
                              className="w-14 h-14 rounded object-cover border"
                            />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-2">
                                {item.name}
                              </p>

                              {item.size && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.size}
                                </p>
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
                    <div className="p-3 border-t bg-white">
                      <p className="text-sm text-gray-700 mb-3">
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
              )}
            </div>

            {user && (
              <div className="relative" ref={notificationRef}>
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

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[360px] bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
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
                        <div className="p-4 text-sm text-muted-foreground">
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
                            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
                              Number(item.is_read) === 0
                                ? "bg-orange-50"
                                : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
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
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(!open)}
                    className="gap-1 sm:gap-2 text-gray-700 transition p-1.5 sm:p-2"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.first_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline text-sm">
                      Xin chào, {user.first_name} {user.last_name}!
                    </span>
                  </Button>

                  {open && (
                    <div className="absolute right-0 mt-1 w-48 sm:w-56 bg-white shadow-xl rounded-lg sm:rounded-2xl p-1.5 sm:p-2 border border-gray-200 animate-in fade-in zoom-in-95 flex flex-col gap-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate("/my-orders");
                          setOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-gray-700 transition text-xs sm:text-sm justify-start"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        <span>Đơn hàng</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate("/customer/profile");
                          setOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-gray-700 transition text-xs sm:text-sm justify-start"
                      >
                        <User className="w-4 h-4 mr-2" />
                        <span>Hồ sơ cá nhân</span>
                      </Button>

                      <div className="my-0.5 border-t border-gray-200" />

                      <button
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2 text-xs sm:text-sm"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden hover:bg-gray-100"
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

      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-3 border-t border-gray-200 bg-gray-50">
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
              className="w-full rounded-full py-2 pl-4 pr-12 bg-gray-50 border border-gray-200 focus:border-amber-500 focus:bg-white transition"
            />

            <button
              type="button"
              onClick={() => goToSearchPage(mobileKeyword, true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition duration-300"
            >
              <Search className="w-4 h-4" />
            </button>

            {mobileResultOpen && (
              <div className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                {mobileSearchLoading ? (
                  <div className="flex items-center justify-center py-6 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang tìm kiếm...
                  </div>
                ) : mobileSearchResults.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-500">
                    Không tìm thấy sản phẩm phù hợp
                  </div>
                ) : (
                  <>
                    {mobileSearchResults.map((item) =>
                      renderSearchItem(item, true)
                    )}
                    <button
                      type="button"
                      onClick={() => goToSearchPage(mobileKeyword, true)}
                      className="w-full px-4 py-3 text-sm text-center text-amber-600 border-t border-gray-100 hover:bg-amber-50"
                    >
                      Xem tất cả kết quả cho "{mobileKeyword.trim()}"
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-3 py-2 space-y-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
              className="w-full justify-start text-gray-700 text-xs"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Danh mục
            </Button>

            {mobileCategoryOpen && (
              <div className="bg-white border border-gray-200 rounded-lg p-2 ml-2 mb-2 space-y-1">
                {categories.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    Không có danh mục
                  </div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => goToCategory(category)}
                      className="w-full text-left px-3 py-2 rounded text-xs text-gray-700 hover:bg-amber-50"
                    >
                      {category.name}
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
              className="w-full justify-start text-gray-700 text-xs"
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
                className="w-full justify-start text-gray-700 text-xs"
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
              <div className="bg-white border border-gray-200 rounded-lg p-2 ml-2 mb-2">
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
                    <div className="p-2 text-xs text-muted-foreground">
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
                        className={`w-full text-left px-3 py-3 border-b rounded-md ${
                          Number(item.is_read) === 0
                            ? "bg-orange-50"
                            : "bg-white"
                        }`}
                      >
                        <p className="font-medium text-xs">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
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

            {!user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start text-gray-700 text-xs"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
            )}

            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setMobileUserDropdownOpen(!mobileUserDropdownOpen)
                  }
                  className="w-full justify-start text-gray-700 text-xs gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.first_name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.last_name}</span>
                </Button>

                {mobileUserDropdownOpen && (
                  <div className="bg-white border border-gray-200 rounded-lg p-2 space-y-1 ml-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate("/my-orders");
                        setMobileUserDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-gray-700 text-xs"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Đơn hàng
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate("/customer/profile");
                        setMobileUserDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-gray-700 text-xs"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Hồ sơ cá nhân
                    </Button>

                    <div className="border-t border-gray-200 my-1" />

                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileUserDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2 text-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate("/news");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 text-xs"
            >
              <Newspaper className="w-4 h-4 mr-2" />
              Tin tức
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
