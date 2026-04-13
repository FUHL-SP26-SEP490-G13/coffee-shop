import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
  ImagePlus,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  User,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import CartSuccessModal from "@/pages/homePage/order/CartSuccessModal";
import QuickViewModal from "@/pages/homePage/product/QuickViewModal";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import toppingService from "@/services/toppingService";
import { useCartStore } from "@/store/useCartStore";
import useFetch from "@/hooks/useFetch";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import flashSaleService from "@/services/flashSaleService";
import { STORAGE_KEYS } from "@/constants";
import reviewService from "@/services/reviewService";
import { Textarea } from "@/components/ui/textarea";
import { useStoreHours } from "@/hooks/useStoreHours";
import { toast } from "sonner";
import { slugCache } from "@/pages/common/GenericSlugResolver";
import { getCurrentUser } from "@/utils/auth";

// Module-level cache: tồn tại xuyên suốt session, không bị xóa khi component unmount
const productDetailCache = {};

const ReviewItem = ({ item, currentUserId, categoryName }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [expandedReplyIndex, setExpandedReplyIndex] = useState(null);

  const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes("video/upload");
  };

  return (
    <div className="flex gap-4 py-6 border-b border-gray-100 dark:border-gray-800 last:border-0 pl-1 pr-1">
      <div className="w-10 h-10 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
        <User className="w-6 h-6 text-gray-400" />
      </div>
      <div className="flex-1 w-full max-w-full overflow-hidden">
        <div className="text-[13px] text-gray-800 dark:text-gray-200 mb-1 font-medium">
          {currentUserId && item.user_id === currentUserId ? "Tôi" : item.full_name}
        </div>
        <div className="flex gap-0.5 text-[#ee4d2d] mb-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className={`w-3.5 h-3.5 ${index < Number(item.rating) ? "fill-current" : "text-gray-300"
                }`}
            />
          ))}
        </div>
        <div className="text-gray-400 text-xs mb-3 flex items-center gap-1.5 flex-wrap">
          <span>
            {new Date(item.updated_at || item.created_at || Date.now()).toLocaleString("vi-VN")}
          </span>
          {categoryName && (
            <>
              <span className="text-gray-300 mx-0.5">|</span>
              <span>Phân loại hàng: {categoryName}</span>
            </>
          )}
          {item.updated_at &&
            item.created_at &&
            item.updated_at !== item.created_at && (
              <span className="text-gray-500 italic text-[11px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                (Đã chỉnh sửa)
              </span>
            )}
        </div>

        {item.comment && (
          <div className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-line leading-relaxed max-w-full break-words">
            {item.comment}
          </div>
        )}

        {item.images && item.images.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {item.images.map((img, idx) => {
                const videoMode = isVideo(img.url);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setExpandedIndex(expandedIndex === idx ? null : idx)
                    }
                    className={`relative block w-[72px] h-[72px] bg-gray-50 overflow-hidden cursor-zoom-in group ${expandedIndex === idx
                      ? "border-2 border-[#ee4d2d]"
                      : "border border-gray-100"
                      }`}
                  >
                    {videoMode ? (
                      <>
                        <video
                          src={img.url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                        />
                        <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 flex items-center px-1">
                          <span className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent mx-1" />
                          <span className="text-[10px] text-white font-medium">
                            Video
                          </span>
                        </div>
                      </>
                    ) : (
                      <img
                        src={img.url}
                        alt="Review img"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {expandedIndex !== null && (
              <div className="relative w-full max-w-[400px] mb-4 bg-black flex items-center justify-center border border-gray-200 dark:border-gray-800 overflow-hidden group/large">
                {isVideo(item.images[expandedIndex].url) ? (
                  <video
                    src={item.images[expandedIndex].url}
                    controls
                    autoPlay
                    className="w-full max-h-[400px] object-contain"
                  />
                ) : (
                  <img
                    src={item.images[expandedIndex].url}
                    alt="Expanded review"
                    className="w-full max-h-[400px] object-contain"
                  />
                )}
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setExpandedIndex((prev) =>
                          prev === 0 ? item.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-white text-gray-800 rounded-full shadow-sm transition opacity-0 group-hover/large:opacity-100"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setExpandedIndex((prev) =>
                          prev === item.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-white text-gray-800 rounded-full shadow-sm transition opacity-0 group-hover/large:opacity-100"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {(item.reply_comment || (item.reply_images && item.reply_images.length > 0)) && (
          <div className="mt-4 bg-[#fcfcfc] dark:bg-gray-900 border-l-[3px] border-[#ee4d2d] p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200 text-[13px]">Phản hồi của Người Bán</span>
              {item.replied_at && (
                <span className="text-gray-400 text-[11px] font-medium">
                  vào lúc {new Date(item.replied_at).toLocaleString("vi-VN")}
                </span>
              )}
            </div>
            {item.reply_comment && (
              <div className="text-gray-600 dark:text-gray-400 text-[13px] whitespace-pre-line mb-2 leading-relaxed">
                {item.reply_comment}
              </div>
            )}
            {item.reply_images && item.reply_images.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {item.reply_images.map((img, idx) => {
                    const videoMode = isVideo(img.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setExpandedReplyIndex(expandedReplyIndex === idx ? null : idx)
                        }
                        className={`relative block w-[60px] h-[60px] bg-gray-50 overflow-hidden cursor-zoom-in group ${expandedReplyIndex === idx
                          ? "border-2 border-[#ee4d2d]"
                          : "border border-gray-200 hover:border-gray-400 transition-colors"
                          }`}
                      >
                        {videoMode ? (
                          <>
                            <video src={img.url} className="w-full h-full object-cover pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                              <span className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5 shadow-sm" />
                            </div>
                          </>
                        ) : (
                          <img src={img.url} className="w-full h-full object-cover pointer-events-none group-hover:scale-110 transition-transform duration-300" alt="reply img" />
                        )}
                      </button>
                    )
                  })}
                </div>
                {expandedReplyIndex !== null && (
                  <div className="relative w-full max-w-[400px] mt-3 bg-black flex items-center justify-center border border-gray-200 dark:border-gray-800 overflow-hidden group/large">
                    {isVideo(item.reply_images[expandedReplyIndex].url) ? (
                      <video
                        src={item.reply_images[expandedReplyIndex].url}
                        controls
                        autoPlay
                        className="w-full max-h-[400px] object-contain"
                      />
                    ) : (
                      <img
                        src={item.reply_images[expandedReplyIndex].url}
                        alt="Expanded reply"
                        className="w-full max-h-[400px] object-contain"
                      />
                    )}
                    {item.reply_images.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setExpandedReplyIndex((prev) =>
                              prev === 0 ? item.reply_images.length - 1 : prev - 1
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-white text-gray-800 rounded-full shadow-sm transition opacity-0 group-hover/large:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setExpandedReplyIndex((prev) =>
                              prev === item.reply_images.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-white text-gray-800 rounded-full shadow-sm transition opacity-0 group-hover/large:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProductDetailPage({ productIdOverride, initialProductData }) {
  const { id } = useParams();
  const productId = productIdOverride || id;
  const navigate = useNavigate();
  const { isOpen: isStoreOpen, nextOpenMessage } = useStoreHours();
  const { addItem } = useCartStore();

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;

  const currentUserId = useMemo(() => {
    const user = getCurrentUser();
    return user?.id || null;
  }, [token]);

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [showToppings, setShowToppings] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const [reviewFilter, setReviewFilter] = useState("all");

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (reviewFilter !== "all") {
      if (reviewFilter === "has_comment") {
        result = result.filter((r) => r.comment && r.comment.trim() !== "");
      } else if (reviewFilter === "has_image") {
        result = result.filter((r) => r.images && r.images.length > 0);
      } else {
        result = result.filter(
          (r) => Number(r.rating) === Number(reviewFilter)
        );
      }
    }
    return result;
  }, [reviews, reviewFilter]);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [myImages, setMyImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deleteImageIds, setDeleteImageIds] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);

  const [activeSale, setActiveSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [addedCartItem, setAddedCartItem] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    flashSaleService
      .getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!activeSale) return;

    const calculateTimeLeft = () => {
      const difference = new Date(activeSale.end_time) - new Date();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setActiveSale(null);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [activeSale]);

  const [productData, setProductData] = useState(() => {
    const initData = initialProductData || productDetailCache[productId] || null;
    if (initData && productId) {
      productDetailCache[productId] = initData;
    }
    return initData;
  });
  const [productLoading, setProductLoading] = useState(!productData);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        if (!productDetailCache[productId]) {
          setProductLoading(true);
        }
        const res = await productService.getById(productId);
        // Cache kết quả
        productDetailCache[productId] = res;
        if (res?.data?.slug && !slugCache[res.data.slug]) {
          slugCache[res.data.slug] = { data: res.data, type: "product" };
        }
        setProductData(res);
      } catch (error) {
        console.error("Lỗi lấy thông tin sản phẩm:", error);
        setProductData(null);
      } finally {
        setProductLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Giao diện SPA: Stale-while-revalidate mượt mà thay vì sập Skeleton cho Product Details
  const [prevProductId, setPrevProductId] = useState(productId);
  if (productId !== prevProductId) {
    setPrevProductId(productId);
    if (!productDetailCache[productId]) {
      setProductLoading(true);
      // KHÔNG XÓA productData! Giữ nguyên giao diện cũ để làm mờ (Stale-while-revalidate).
    } else {
      setProductData(productDetailCache[productId]);
      setProductLoading(false);
    }
  }

  // Use productData from props as initial/fallback data, or fetched data
  const product = productData?.data || productData || null;
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const images = Array.isArray(product?.images) ? product.images : [];
  const description = (product?.description || "").trim();
  const hasRichDescription = /<[^>]+>/.test(description);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const displayImages =
    images.length > 0 ? images : [{ image_url: defaultImage }];

  useEffect(() => {
    const shopName = localStorage.getItem("cached_store_name") || "Coffee Shop";
    document.title = product?.name
      ? `${product.name} | ${shopName}`
      : `Chi tiết sản phẩm | ${shopName}`;
  }, [product?.name]);

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0].size);
    }
  }, [sizes, selectedSize]);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setSelectedSize(null);
    setSelectedToppings([]);
    setShowToppings(false);
  }, [productId]);

  useEffect(() => {
    const fetchToppings = async () => {
      try {
        const res = await toppingService.getAll();
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];
        const activeToppings = list.filter(
          (t) => !t.is_deleted || t.is_deleted === 0 || t.is_deleted === "0"
        );
        setToppings(activeToppings);
      } catch (error) {
        console.error("Lỗi lấy danh sách topping:", error);
        setToppings([]);
      }
    };

    fetchToppings();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id) return;

      try {
        setReviewLoading(true);
        const res = await reviewService.getByProductId(product.id);
        const result = res?.data || {};

        setReviews(Array.isArray(result?.items) ? result.items : []);
        setAverageRating(Number(result?.averageRating) || 0);
      } catch (error) {
        console.error("Lỗi lấy đánh giá sản phẩm:", error);
        setReviews([]);
        setAverageRating(0);
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviews();
  }, [product?.id]);

  useEffect(() => {
    const fetchMyReview = async () => {
      if (!product?.id || !isLoggedIn) {
        setCanReview(false);
        setMyRating(0);
        setMyComment("");
        return;
      }

      try {
        const res = await reviewService.getMyReview(product.id);
        const result = res?.data || {};

        setCanReview(Boolean(result?.canReview));
        setMyRating(Number(result?.review?.rating) || 0);
        setMyComment(result?.review?.comment || "");
        setExistingImages(result?.review?.images || []);
        setMyImages([]);
        setDeleteImageIds([]);
        const userHasReviewed = result?.review != null;
        setHasReviewed(userHasReviewed);
        setIsEditingReview(!userHasReviewed);
      } catch (error) {
        console.error("Lỗi lấy đánh giá của bạn:", error);
        setCanReview(false);
        setMyRating(0);
        setMyComment("");
        setExistingImages([]);
        setMyImages([]);
        setDeleteImageIds([]);
        setHasReviewed(false);
        setIsEditingReview(true);
      }
    };

    fetchMyReview();
  }, [product?.id, isLoggedIn]);

  const handleSubmitReview = async () => {
    if (!product?.id) return;

    if (!isLoggedIn) {
      return;
    }

    if (!canReview) {
      toast.error("Bạn chỉ có thể đánh giá sản phẩm đã mua");
      return;
    }

    if (!myRating || myRating < 1 || myRating > 5) {
      toast.error("Vui lòng chọn số sao từ 1 đến 5");
      return;
    }

    if (myImages.length + existingImages.length > 4) {
      toast.error("Bạn chỉ có thể lưu tối đa 4 tệp (ảnh và video)");
      return;
    }

    try {
      setReviewSubmitting(true);

      const formData = new FormData();
      formData.append("product_id", product.id);
      formData.append("rating", myRating);
      formData.append("comment", myComment);

      myImages.forEach((img) => {
        formData.append("images", img.file);
      });

      deleteImageIds.forEach((id) => {
        formData.append("deleteImageIds", id);
      });

      const res = await reviewService.createOrUpdate(formData);

      toast.success(
        res?.data?.message || res?.message || "Gửi đánh giá thành công"
      );

      const reviewRes = await reviewService.getByProductId(product.id);
      const reviewResult = reviewRes?.data?.data || reviewRes?.data || {};

      setReviews(Array.isArray(reviewResult?.items) ? reviewResult.items : []);
      setAverageRating(Number(reviewResult?.averageRating) || 0);

      const myRes = await reviewService.getMyReview(product.id);
      const myResult = myRes?.data || {};
      setExistingImages(myResult?.review?.images || []);
      setMyImages([]);
      setDeleteImageIds([]);
      setHasReviewed(true);
      setIsEditingReview(false);
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Không thể gửi đánh giá"
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddPreviewFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const isVideoUrl = (url) =>
      typeof url === "string" &&
      (url.match(/\.(mp4|webm|ogg)$/i) || url.includes("video/upload"));

    let currentImagesCount =
      myImages.filter((img) => !img.file.type.startsWith("video/")).length +
      existingImages.filter((img) => !isVideoUrl(img.url)).length;

    let currentVideosCount =
      myImages.filter((img) => img.file.type.startsWith("video/")).length +
      existingImages.filter((img) => isVideoUrl(img.url)).length;

    const validFiles = [];

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        if (currentVideosCount >= 1) {
          toast.warning("Bạn chỉ được tải lên tối đa 1 video.");
          continue;
        }
        currentVideosCount++;
        validFiles.push(file);
      } else {
        if (currentImagesCount >= 3) {
          toast.warning("Bạn chỉ được tải lên tối đa 3 ảnh.");
          continue;
        }
        currentImagesCount++;
        validFiles.push(file);
      }
    }

    if (!validFiles.length) {
      e.target.value = null;
      return;
    }

    const newPreviewFiles = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setMyImages((prev) => [...prev, ...newPreviewFiles]);
    e.target.value = null;
  };

  const handleRemoveExistingImage = (publicId) => {
    setDeleteImageIds((prev) => [...prev, publicId]);
    setExistingImages((prev) =>
      prev.filter((img) => img.public_id !== publicId)
    );
  };

  const handleRemoveMyImage = (index) => {
    setMyImages((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedSizeObj = useMemo(() => {
    return sizes.find((s) => s.size === selectedSize) || null;
  }, [sizes, selectedSize]);

  const selectedToppingsTotal = useMemo(() => {
    return selectedToppings.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [selectedToppings]);

  const isFlashSale = useMemo(() => {
    return (
      activeSale && product?.id && activeSale.product_ids?.includes(product.id)
    );
  }, [activeSale, product]);

  const flashSaleDiscount = isFlashSale ? activeSale?.discount_percent || 0 : 0;

  const displayPrice = useMemo(() => {
    let basePrice = Number(selectedSizeObj?.price) || 0;
    if (isFlashSale) {
      basePrice = Math.round(basePrice * (1 - flashSaleDiscount / 100));
    }
    return basePrice + selectedToppingsTotal;
  }, [selectedSizeObj, selectedToppingsTotal, isFlashSale, flashSaleDiscount]);

  const originalDisplayPrice = useMemo(() => {
    if (!isFlashSale) return null;
    const basePrice = Number(selectedSizeObj?.price) || 0;
    return basePrice + selectedToppingsTotal;
  }, [selectedSizeObj, selectedToppingsTotal, isFlashSale]);

  const fetchRelatedProducts = useCallback(() => {
    if (!product?.category_id) {
      return Promise.resolve({ data: [] });
    }

    return productService.getByCategory(product.category_id, {
      status: "available",
    });
  }, [product?.category_id]);

  const { data: relatedData, loading: relatedLoading } =
    useFetch(fetchRelatedProducts);

  const relatedProducts = useMemo(() => {
    const list = Array.isArray(relatedData?.data) ? relatedData.data : [];
    list.forEach(p => {
      if (p.slug && !slugCache[p.slug]) {
        slugCache[p.slug] = { data: p, type: "product" };
      }
    });
    return list.filter((item) => String(item.id) !== String(product?.id));
  }, [relatedData, product?.id]);

  const isToppingSelected = (toppingId) => {
    return selectedToppings.some(
      (item) => Number(item.topping_id) === Number(toppingId)
    );
  };

  const getSelectedTopping = (toppingId) => {
    return (
      selectedToppings.find(
        (item) => Number(item.topping_id) === Number(toppingId)
      ) || null
    );
  };

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some(
        (item) => Number(item.topping_id) === Number(topping.id)
      );

      if (exists) {
        return prev.filter(
          (item) => Number(item.topping_id) !== Number(topping.id)
        );
      }

      return [
        ...prev,
        {
          topping_id: Number(topping.id),
          name: topping.name,
          price: Number(topping.price) || 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateToppingQuantity = (toppingId, nextQuantity) => {
    setSelectedToppings((prev) =>
      prev.map((item) =>
        Number(item.topping_id) === Number(toppingId)
          ? {
            ...item,
            quantity: Math.max(1, Number(nextQuantity) || 1),
          }
          : item
      )
    );
  };

  const buildCartItem = () => {
    if (!product || !selectedSizeObj) return null;

    let basePriceNum = Number(selectedSizeObj.price);
    if (isFlashSale) {
      basePriceNum = Math.round(basePriceNum * (1 - flashSaleDiscount / 100));
    }

    return {
      id: product.id,
      product_id: product.id,
      productId: product.id,
      productSizeId: selectedSizeObj.id,
      product_size_id: selectedSizeObj.id,
      name: product.name,
      image: displayImages[0]?.image_url || defaultImage,
      size: selectedSizeObj.size,
      price: basePriceNum,
      basePrice: basePriceNum,
      quantity: Math.max(1, Number(quantity) || 1),
      toppings: selectedToppings.map((item) => ({
        topping_id: Number(item.topping_id),
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
    };
  };

  const notifyCartSuccess = (cartItem) => {
    setAddedCartItem(cartItem);
  };

  const addToCart = () => {
    if (!product || !selectedSizeObj) {
      toast.error("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    addItem(cartItem);
    notifyCartSuccess(cartItem);
  };

  const buyNow = () => {
    if (!product || !selectedSizeObj) {
      toast.error("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    addItem(cartItem);
    navigate("/checkout");
  };

  const handleRelatedFastAdd = (e, relatedProduct) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isStoreOpen) {
      toast.error("Cửa hàng hiện đang đóng cửa");
      return;
    }

    if (!relatedProduct.sizes || relatedProduct.sizes.length === 0) {
      toast.error("Sản phẩm không có size");
      return;
    }

    let cartSize = relatedProduct.sizes.find(
      (size) => String(size?.size).trim().toUpperCase() === "S"
    );

    if (!cartSize || Number(cartSize?.price) <= 0) {
      const validSizes = relatedProduct.sizes
        .filter((size) => Number(size?.price) > 0)
        .sort((a, b) => Number(a.price) - Number(b.price));
      cartSize = validSizes[0] || relatedProduct.sizes[0];
    }

    let price = Number(cartSize.price);
    if (activeSale && activeSale.product_ids?.includes(relatedProduct.id)) {
      price = Math.round(price * (1 - activeSale.discount_percent / 100));
    }

    const itemImages = Array.isArray(relatedProduct.images)
      ? relatedProduct.images
      : [];
    const thumbnail = itemImages[0]?.image_url || defaultImage;

    const cartItem = {
      productSizeId: cartSize.id,
      id: relatedProduct.id,
      product_id: relatedProduct.id,
      name: relatedProduct.name,
      image: thumbnail,
      size: cartSize.size,
      basePrice: price,
      price: price,
      quantity: 1,
      toppings: [],
    };

    addItem(cartItem);
    notifyCartSuccess(cartItem);
  };

  const renderBreadcrumbs = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-h-[50px]">
      <div className="text-base md:text-lg text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-2 font-medium">
        <span
          className="cursor-pointer hover:text-amber-600 transition-colors"
          onClick={() => navigate("/")}
        >
          Trang chủ
        </span>
        {product?.category_name && (
          <>
            <span className="text-gray-400">/</span>
            <span
              className="cursor-pointer hover:text-amber-600 transition-colors"
              onClick={() =>
                navigate(`/${product.category_slug}`)
              }
            >
              {product.category_name}
            </span>
          </>
        )}
        {product?.name && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-amber-600 font-bold">
              {product.name}
            </span>
          </>
        )}
      </div>
    </div>
  );

  if (productLoading && !product) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 relative">
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
          {renderBreadcrumbs()}
          <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mt-4">
            <div className="flex flex-col gap-6">
              <div className="w-full max-w-[480px] lg:max-w-[540px] mx-auto aspect-square flex items-center justify-center relative bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2 animate-pulse" />
              <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-6 animate-pulse" />
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded mb-3 animate-pulse" />
              <div className="flex gap-3 mb-8">
                <div className="h-10 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                <div className="h-10 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
                <div className="h-10 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
              </div>
              <div className="h-14 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8 animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 relative">
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
          {renderBreadcrumbs()}
          <div className="flex-1 flex items-center justify-center min-h-[50vh] text-gray-600 dark:text-gray-400">
            Không tìm thấy sản phẩm
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 relative">
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-10 md:pb-16 mb-5 ${productLoading && product ? 'opacity-50 pointer-events-none transition-opacity duration-300' : 'transition-opacity duration-300'}`}>
        {renderBreadcrumbs()}

        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 relative">
              {isFlashSale && (
                <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
                  ⚡ Flash Sale Giảm {flashSaleDiscount}%
                </div>
              )}
              {/* Main Image */}
              <div className="w-full max-w-[480px] lg:max-w-[540px] mx-auto aspect-square flex items-center justify-center relative group bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden p-2">
                <img
                  src={
                    displayImages[activeImageIndex]?.image_url || defaultImage
                  }
                  alt={product?.name || "Sản phẩm"}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                />

                {/* Left/Right arrows if more than 1 image */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === 0 ? displayImages.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveImageIndex((prev) =>
                          prev === displayImages.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {displayImages.length > 1 && (
                <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                  {displayImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-white transition-all
                        ${activeImageIndex === index
                          ? "border-[1.5px] border-[#A0522D]"
                          : "border border-gray-200 opacity-60 hover:opacity-100"
                        }`}
                    >
                      <img
                        src={img.image_url || defaultImage}
                        alt={`Thumbnail ${index}`}
                        className="w-full h-full object-cover p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  {product.category_name || "Danh mục"}
                </p>
                <h5 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h5>
              </div>

              <div className="flex gap-2 shrink-0"></div>
            </div>

            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Chọn size
                </p>

                <div className="flex gap-3 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size.size)}
                      className={`px-4 py-2 rounded-full border font-medium ${selectedSize === size.size
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300"
                        }`}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {toppings.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  Topping
                </p>

                <button
                  type="button"
                  onClick={() => setShowToppings((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-2xl border border-gray-300 bg-white dark:bg-gray-900 px-4 py-3 hover:border-amber-500 transition"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Muốn gọi thêm
                    {selectedToppings.length > 0
                      ? ` (${selectedToppings.length} loại đã chọn)`
                      : ""}
                  </span>

                  {showToppings ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                {showToppings && (
                  <div className="mt-4 max-h-[320px] overflow-y-auto pr-2 space-y-3">
                    {toppings.map((topping) => {
                      const checked = isToppingSelected(topping.id);
                      const selectedTopping = getSelectedTopping(topping.id);

                      return (
                        <div
                          key={topping.id}
                          className="border border-gray-200  rounded-2xl p-4 bg-white dark:bg-gray-900"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTopping(topping)}
                                className="w-4 h-4 shrink-0"
                              />

                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
                                  {topping.name}
                                </p>
                                <p className="text-sm text-amber-600 font-semibold">
                                  +
                                  {Number(topping.price).toLocaleString(
                                    "vi-VN"
                                  )}
                                  đ
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedToppings.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 p-4 text-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        Topping đã chọn ({selectedToppings.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedToppings([])}
                        className="text-red-500 hover:text-red-600 hover:underline font-medium px-2 py-0.5 rounded transition"
                      >
                        Xóa tất cả
                      </button>
                    </div>

                    <div className="space-y-1 text-gray-600 dark:text-gray-400 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedToppings.map((item) => (
                        <div
                          key={item.topping_id}
                          className="flex items-center justify-between gap-3 py-1.5 group border-b border-amber-100/50 last:border-0"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() =>
                                toggleTopping({ id: item.topping_id })
                              }
                              className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 dark:bg-gray-800 p-0.5 rounded shadow-sm border border-gray-200 dark:border-gray-700 transition"
                              title="Xóa topping này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span className="font-medium text-amber-600 shrink-0">
                            +{Number(item.price).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isFlashSale && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm shrink-0">
                    <Zap className="w-5 h-5 text-red-600 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-bold text-red-600 dark:text-red-400 text-sm mb-1 uppercase tracking-wider">
                      Flash sale
                    </h5>
                    <p className="text-xs text-red-500/80 dark:text-red-300">
                      Sản phẩm sẽ tự động trở về giá gốc khi hết thời gian
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-sm border border-red-100 dark:border-red-900/40 shrink-0">
                  <Clock className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex items-center gap-1 text-[15px] font-bold text-red-600 dark:text-red-400">
                    <div className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </div>
                    <span>:</span>
                    <div className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </div>
                    <span>:</span>
                    <div className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tổng tiền tạm tính
              </p>

              <div className="flex flex-col">
                {isFlashSale && originalDisplayPrice ? (
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-semibold text-red-600">
                      {selectedSizeObj
                        ? `${displayPrice.toLocaleString("vi-VN")}đ`
                        : "Liên hệ"}
                    </p>
                    <span className="text-sm line-through text-gray-400 font-medium">
                      {originalDisplayPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ) : (
                  <p className="text-xl font-semibold text-amber-600">
                    {selectedSizeObj
                      ? `${displayPrice.toLocaleString("vi-VN")}đ`
                      : "Liên hệ"}
                  </p>
                )}
              </div>

              {selectedToppings.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Giá size {selectedSizeObj?.size || ""}:</span>
                    <span className="font-medium">
                      {isFlashSale
                        ? (
                          Number(selectedSizeObj?.price || 0) *
                          (1 - flashSaleDiscount / 100)
                        ).toLocaleString("vi-VN")
                        : Number(selectedSizeObj?.price || 0).toLocaleString(
                          "vi-VN"
                        )}
                      đ
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 border rounded"
              >
                -
              </button>

              <span className="text-lg font-semibold">{quantity}</span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 border rounded"
              >
                +
              </button>
            </div>

            {!isStoreOpen && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                <span className="font-medium text-sm">
                  Cửa hàng hiện đang đóng cửa. {nextOpenMessage}. Xin quý khách
                  thông cảm
                </span>
              </div>
            )}

            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={addToCart}
                disabled={!isStoreOpen}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-base disabled:bg-gray-400 disabled:opacity-100"
              >
                <Plus className="w-5 h-5 mr-2" />
                {isStoreOpen ? "Thêm vào giỏ hàng" : "Đóng cửa"}
              </Button>

              <Button
                onClick={buyNow}
                disabled={!isStoreOpen}
                variant="outline"
                className="px-8 py-6 text-base border-amber-600 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/40 dark:hover:text-amber-500 disabled:border-gray-400 disabled:text-gray-500 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
              >
                Mua ngay
              </Button>
            </div>
          </div>
        </div>

        {/* TRẢI RỘNG 100% NHƯ SHOPEE: DESCRIPTION */}
        <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl uppercase flex items-center h-[60px] font-medium text-gray-900 dark:text-gray-100 mb-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4">
            Mô tả sản phẩm
          </h3>
          <div className="px-4">
            {description ? (
              hasRichDescription ? (
                <div
                  className="product-rich-content text-gray-700 dark:text-gray-300 leading-8"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-8 whitespace-pre-line">
                  {description}
                </p>
              )
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Chưa có mô tả cho sản phẩm này.
              </p>
            )}
          </div>
        </div>

        {/* TRẢI RỘNG 100% NHƯ SHOPEE: REVIEWS */}
        <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-[1.125rem] font-medium text-gray-900 dark:text-gray-100 mb-4 px-4 uppercase">
            Đánh giá sản phẩm
          </h3>

          <div className="bg-[#fffbf8] dark:bg-orange-950/20 border border-[#f9ede5] dark:border-orange-900/40 p-6 flex flex-col md:flex-row items-start md:items-center gap-8 mb-8 mx-4">
            <div className="flex flex-col items-center shrink-0 min-w-[150px]">
              <div className="text-[#ee4d2d] mb-2 font-semibold">
                <span className="text-3xl">
                  {averageRating > 0 ? averageRating : "5.0"}
                </span>
                <span className="text-base text-gray-500 font-normal">
                  {" "}
                  trên 5
                </span>
              </div>
              <div className="flex text-[#ee4d2d] gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 flex-1">
              <button
                onClick={() => setReviewFilter("all")}
                className={
                  reviewFilter === "all"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                Tất Cả
              </button>
              <button
                onClick={() => setReviewFilter("5")}
                className={
                  reviewFilter === "5"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                5 Sao ({reviews.filter((r) => Number(r.rating) === 5).length})
              </button>
              <button
                onClick={() => setReviewFilter("4")}
                className={
                  reviewFilter === "4"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                4 Sao ({reviews.filter((r) => Number(r.rating) === 4).length})
              </button>
              <button
                onClick={() => setReviewFilter("3")}
                className={
                  reviewFilter === "3"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                3 Sao ({reviews.filter((r) => Number(r.rating) === 3).length})
              </button>
              <button
                onClick={() => setReviewFilter("2")}
                className={
                  reviewFilter === "2"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                2 Sao ({reviews.filter((r) => Number(r.rating) === 2).length})
              </button>
              <button
                onClick={() => setReviewFilter("1")}
                className={
                  reviewFilter === "1"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                1 Sao ({reviews.filter((r) => Number(r.rating) === 1).length})
              </button>
              <button
                onClick={() => setReviewFilter("has_comment")}
                className={
                  reviewFilter === "has_comment"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                Có Bình Luận (
                {
                  reviews.filter((r) => r.comment && r.comment.trim() !== "")
                    .length
                }
                )
              </button>
              <button
                onClick={() => setReviewFilter("has_image")}
                className={
                  reviewFilter === "has_image"
                    ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400"
                    : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"
                }
              >
                Có Hình Ảnh (
                {reviews.filter((r) => r.images && r.images.length > 0).length})
              </button>
            </div>
          </div>

          <div className="px-4">
            {reviewLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Đang tải đánh giá...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-sm text-center text-gray-500">
                Không tìm thấy đánh giá nào
              </div>
            ) : (
              <div className="flex flex-col max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredReviews.map((item) => (
                  <ReviewItem key={item.id} item={item} currentUserId={currentUserId} categoryName={product?.category_name} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 mb-10 mx-4 border-t border-gray-100 dark:border-gray-800 pt-8">
            <h4 className="text-base text-gray-900 dark:text-gray-100 mb-6 font-medium">
              VIẾT ĐÁNH GIÁ CỦA BẠN
            </h4>

            {!isLoggedIn ? (
              <p className="text-sm text-gray-500">
                Vui lòng đăng nhập để đánh giá sản phẩm.
              </p>
            ) : !canReview ? (
              <p className="text-sm text-center text-gray-500">
                Bạn chỉ có thể đánh giá sản phẩm đã mua và đã hoàn tất đơn hàng
              </p>
            ) : hasReviewed && !isEditingReview ? (
              <div className="bg-[#fafafa] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                  Bạn đã đánh giá sản phẩm này
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Cảm ơn bạn đã chia sẻ trải nghiệm với mọi người
                </p>
                <Button
                  onClick={() => setIsEditingReview(true)}
                  variant="outline"
                  className="border-[#ee4d2d] text-[#ee4d2d] bg-transparent hover:bg-[#ee4d2d] hover:text-white transition-colors"
                >
                  Chỉnh Sửa Đánh Giá
                </Button>
              </div>
            ) : (
              <div className="bg-[#fafafa] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Chất lượng sản phẩm:
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starValue = index + 1;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setMyRating(starValue)}
                          className="transition cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 ${starValue <= myRating
                              ? "text-[#ee4d2d] fill-current"
                              : "text-gray-300"
                              }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  rows={4}
                  placeholder="Hãy chia sẻ nhận xét cho sản phẩm này nhé!"
                  className="w-full text-sm mb-4 border-gray-200 focus:border-[#ee4d2d] focus:ring-[#ee4d2d]"
                />

                <div className="flex flex-wrap gap-3 mb-6">
                  {existingImages.map((img, idx) => {
                    const isVid =
                      img.url?.match(/\.(mp4|webm|ogg)$/i) ||
                      img.url?.includes("video/upload");
                    return (
                      <div
                        key={`existing-${idx}`}
                        className="relative w-[72px] h-[72px] shrink-0 border border-gray-200 shadow-sm bg-black overflow-hidden"
                      >
                        {isVid ? (
                          <video
                            src={img.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={img.url}
                            className="w-full h-full object-cover"
                            alt="Review existing"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveExistingImage(img.public_id)
                          }
                          className="absolute top-0 right-0 bg-[#ee4d2d] text-white p-0.5 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {myImages.map((img, idx) => {
                    const isVid = img.file.type.startsWith("video/");
                    return (
                      <div
                        key={idx}
                        className="relative w-[72px] h-[72px] shrink-0 border border-gray-200 shadow-sm bg-black overflow-hidden"
                      >
                        {isVid ? (
                          <video
                            src={img.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={img.url}
                            className="w-full h-full object-cover"
                            alt="Review preview"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMyImage(idx)}
                          className="absolute top-0 right-0 bg-[#ee4d2d] text-white p-0.5 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {myImages.length + existingImages.length < 4 && (
                    <label className="w-[72px] h-[72px] shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#ee4d2d] text-[#ee4d2d] cursor-pointer hover:bg-orange-50 transition bg-white">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase font-medium">
                        Thêm Hình
                      </span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleAddPreviewFiles}
                      />
                    </label>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting}
                    className="bg-[#ee4d2d] hover:bg-[#d03d1e] text-white min-w-[140px] border-0"
                  >
                    {reviewSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang
                        gửi...
                      </>
                    ) : hasReviewed ? (
                      "Cập Nhật"
                    ) : (
                      "Hoàn Thành"
                    )}
                  </Button>
                  {hasReviewed && (
                    <Button
                      onClick={() => setIsEditingReview(false)}
                      variant="ghost"
                      className="ml-3 text-gray-500 hover:text-gray-700"
                    >
                      Hủy thao tác
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-14">
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Sản phẩm liên quan
            </h3>

            <Button
              variant="ghost"
              onClick={() => navigate("/products")}
              className="text-amber-600"
            >
              Xem tất cả
            </Button>
          </div>

          {relatedLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : relatedProducts.length === 0 ? (
            <div className="text-sm text-center text-gray-500">
              Không có sản phẩm liên quan
            </div>
          ) : (
            <div className="relative group/related">
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 5000 }}
                pagination={{ clickable: true, dynamicBullets: true }}
                spaceBetween={24}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                }}
                className="pb-10"
              >
                {relatedProducts.slice(0, 10).map((item) => {
                  const itemImages = Array.isArray(item.images)
                    ? item.images
                    : [];
                  const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                  const itemImage = itemImages[0]?.image_url || defaultImage;

                  const validPrices = itemSizes
                    .map((s) => Number(s.price))
                    .filter((p) => Number.isFinite(p) && p > 0);

                  const minPrice =
                    validPrices.length > 0 ? Math.min(...validPrices) : null;
                  const maxPrice =
                    validPrices.length > 0 ? Math.max(...validPrices) : null;
                  const hasMultiplePrices =
                    minPrice !== null &&
                    maxPrice !== null &&
                    maxPrice > minPrice;

                  let priceText = "Liên hệ";
                  if (minPrice !== null) {
                    priceText = `${minPrice.toLocaleString("vi-VN")}đ`;
                    if (hasMultiplePrices) {
                      priceText = `${minPrice.toLocaleString(
                        "vi-VN"
                      )}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
                    }
                  }

                  const relatedSale =
                    activeSale && activeSale.product_ids?.includes(item.id)
                      ? activeSale
                      : null;
                  const finalSalePrice =
                    relatedSale && minPrice !== null
                      ? Math.round(
                        minPrice * (1 - relatedSale.discount_percent / 100)
                      )
                      : null;

                  return (
                    <SwiperSlide key={item.id} className="h-auto">
                      <div className="group h-full pb-4 px-2 pt-2">
                        <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                          <div className="relative">
                            {relatedSale && (
                              <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                                <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                  <Zap className="w-3 h-3 fill-white" /> Giảm{" "}
                                  {relatedSale.discount_percent}%
                                </span>
                              </div>
                            )}

                            <div
                              onClick={() =>
                                navigate(
                                  `/${item.slug || "products/" + item.id}`
                                )
                              }
                              className="block mt-6 mb-2 cursor-pointer"
                            >
                              <div className="relative h-48 w-full flex items-center justify-center">
                                <img
                                  src={itemImage}
                                  alt={item.name}
                                  className="h-[95%] w-[95%] object-contain transition duration-500 group-hover:scale-[1.1] mix-blend-multiply dark:mix-blend-normal drop-shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.src = defaultImage;
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col flex-grow mt-2">
                            <p className="text-[11px] font-medium text-gray-400 uppercase mb-1">
                              {item.category_name || "Thức uống"}
                            </p>

                            <div
                              onClick={() =>
                                navigate(
                                  `/${item.slug || "products/" + item.id}`
                                )
                              }
                              className="cursor-pointer"
                            >
                              <h3
                                className="line-clamp-2 text-base font-bold text-[#4A3219] dark:text-gray-100 transition hover:text-[#8B5A2B] min-h-[44px] mb-1.5"
                                style={{ fontFamily: "serif" }}
                              >
                                {item.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 mb-5 h-[20px]">
                              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                {Number(item.rating) > 0
                                  ? Number(item.rating).toFixed(1)
                                  : "Chưa có đánh giá"}
                              </span>
                            </div>

                            <div className="mt-auto flex items-end justify-between z-10 relative pointer-events-auto">
                              <div className="flex flex-col">
                                {relatedSale && finalSalePrice ? (
                                  <>
                                    <span className="text-[#a8a8a8] text-xs line-through font-medium">
                                      {minPrice.toLocaleString("vi-VN")}đ
                                    </span>
                                    <span className="text-[#D62828] font-bold text-lg leading-none mt-1">
                                      {finalSalePrice.toLocaleString("vi-VN")}đ
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[#8B5A2B] font-bold text-lg leading-none mt-1">
                                    {priceText}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setQuickViewProduct(item);
                                  }}
                                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-500"
                                  title="Xem nhanh"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-eye"
                                  >
                                    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>
                                {isStoreOpen ? (
                                  <button
                                    onClick={(e) =>
                                      handleRelatedFastAdd(e, item)
                                    }
                                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-[#8B5A2B] hover:bg-[#69421c] text-white"
                                    title="Thêm vào giỏ"
                                  >
                                    <ShoppingCart className="w-[15px] h-[15px] xl:ml-[-1px]" />
                                  </button>
                                ) : (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center justify-center text-[11px] font-bold text-rose-600 bg-rose-50 px-2 h-8 rounded-md border border-rose-100 whitespace-nowrap shadow-sm cursor-not-allowed"
                                    title={nextOpenMessage}
                                  >
                                    Đóng cửa
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
          )}
        </div>
      </section>

      {/* Cửa sổ Modal Thêm vào giỏ hàng thành công */}
      <CartSuccessModal
        addedCartItem={addedCartItem}
        onClose={() => setAddedCartItem(null)}
      />
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        activeSale={activeSale}
        isStoreOpen={isStoreOpen}
        nextOpenMessage={nextOpenMessage}
        notifySuccess={(item) => setAddedCartItem(item)}
      />
    </div>
  );
}
