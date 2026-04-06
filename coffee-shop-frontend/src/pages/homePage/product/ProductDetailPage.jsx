import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Heart,
  Star,
  ImagePlus,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  User,
  CheckCircle2
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartSuccessModal from "@/components/common/CartSuccessModal";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import toppingService from "@/services/toppingService";
import { cartService } from "@/services/cartService";
import useFetch from "@/hooks/useFetch";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import favoriteService from "@/services/favoriteService";
import flashSaleService from "@/services/flashSaleService";
import { STORAGE_KEYS } from "@/constants";
import reviewService from "@/services/reviewService";
import { Textarea } from "@/components/ui/textarea";
import { useStoreHours } from "@/hooks/useStoreHours";
import { toast } from "sonner";

export default function ProductDetailPage({ productIdOverride, productData }) {
  const { id } = useParams();
  const productId = productIdOverride || id;
  const navigate = useNavigate();
  const { isOpen: isStoreOpen, nextOpenMessage } = useStoreHours();

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [showToppings, setShowToppings] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedFavoriteMap, setRelatedFavoriteMap] = useState({});

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);


  const [reviewFilter, setReviewFilter] = useState('all');

  const filteredReviews = useMemo(() => {
    let result = reviews;
    if (reviewFilter !== 'all') {
      if (reviewFilter === 'has_comment') {
        result = result.filter(r => r.comment && r.comment.trim() !== '');
      } else if (reviewFilter === 'has_image') {
        result = result.filter(r => r.images && r.images.length > 0);
      } else {
        result = result.filter(r => Number(r.rating) === Number(reviewFilter));
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

  const [activeSale, setActiveSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const [addedCartItem, setAddedCartItem] = useState(null);

  useEffect(() => {
    flashSaleService.getCurrentActive()
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
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setActiveSale(null);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [activeSale]);

  const fetchProduct = useCallback(() => {
    return productService.getById(productId);
  }, [productId]);

  const { data, loading, setData } = useFetch(fetchProduct);

  // Clear stale data when product changes
  useEffect(() => {
    if (productId) {
      setData(null);
    }
  }, [productId, setData]);

  // Use productData from props as initial/fallback data, or fetched data
  const product = data?.data || productData || null;
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
    document.title = product?.name ? `${product.name} | ${shopName}` : `Chi tiết sản phẩm | ${shopName}`;
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
        setToppings(list);
      } catch (error) {
        console.error("Lỗi lấy danh sách topping:", error);
        setToppings([]);
      }
    };

    fetchToppings();
  }, []);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!product?.id || !isLoggedIn) {
        setIsFavorite(false);
        return;
      }

      try {
        const res = await favoriteService.checkFavorite(product.id);
        setIsFavorite(Boolean(res?.data?.isFavorite));
      } catch (error) {
        console.error("Lỗi kiểm tra yêu thích:", error);
        setIsFavorite(false);
      }
    };

    fetchFavoriteStatus();
  }, [product?.id, isLoggedIn]);

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
      } catch (error) {
        console.error("Lỗi lấy đánh giá của bạn:", error);
        setCanReview(false);
        setMyRating(0);
        setMyComment("");
        setExistingImages([]);
        setMyImages([]);
        setDeleteImageIds([]);
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
      alert("Bạn chỉ có thể đánh giá sản phẩm đã mua");
      return;
    }

    if (!myRating || myRating < 1 || myRating > 5) {
      alert("Vui lòng chọn số sao từ 1 đến 5");
      return;
    }

    if (myImages.length > 3) {
      alert("Bạn chỉ có thể tải lên tối đa 3 ảnh");
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

      // Nếu có ảnh mới lên, tự động xóa tất cả ảnh cũ (do form giờ đã ẩn ảnh cũ)
      if (myImages.length > 0) {
        existingImages.forEach(img => {
          formData.append("deleteImageIds", img.public_id);
        });
      } else {
        deleteImageIds.forEach((id) => {
          formData.append("deleteImageIds", id);
        });
      }

      const res = await reviewService.createOrUpdate(formData);

      alert(res?.data?.message || res?.message || "Gửi đánh giá thành công");

      const reviewRes = await reviewService.getByProductId(product.id);
      const reviewResult = reviewRes?.data?.data || reviewRes?.data || {};

      setReviews(Array.isArray(reviewResult?.items) ? reviewResult.items : []);
      setAverageRating(Number(reviewResult?.averageRating) || 0);

      const myRes = await reviewService.getMyReview(product.id);
      const myResult = myRes?.data || {};
      setExistingImages(myResult?.review?.images || []);
      setMyImages([]);
      setDeleteImageIds([]);

    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      alert(error?.response?.data?.message || error?.message || "Không thể gửi đánh giá");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddPreviewImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (myImages.length + files.length > 3) {
      alert("Bạn chỉ được tải lên tối đa 3 ảnh.");
      return;
    }

    const newPreviewImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setMyImages(prev => [...prev, ...newPreviewImages]);
    e.target.value = null;
  };

  const handleRemoveExistingImage = (publicId) => {
    setDeleteImageIds(prev => [...prev, publicId]);
    setExistingImages(prev => prev.filter(img => img.public_id !== publicId));
  };

  const handleRemoveMyImage = (index) => {
    setMyImages(prev => prev.filter((_, i) => i !== index));
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
    return activeSale && product?.id && activeSale.product_ids?.includes(product.id);
  }, [activeSale, product]);

  const flashSaleDiscount = isFlashSale ? (activeSale?.discount_percent || 0) : 0;

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

  const handleToggleFavorite = async () => {
    if (!product?.id) return;

    if (!isLoggedIn) {
      alert("Bạn phải đăng nhập để thêm sản phẩm yêu thích");
      return;
    }

    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      const res = await favoriteService.toggleFavorite(product.id, previousState);

      if (res?.data?.isFavorite !== undefined) {
        setIsFavorite(Boolean(res.data.isFavorite));
      }

      window.dispatchEvent(new Event("favoriteUpdated")); //phát tín hiệu iu thích
    } catch (error) {
      console.error("Lỗi cập nhật yêu thích:", error);
      setIsFavorite(previousState);
    }
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
    cartService.addItem(cartItem);
    notifyCartSuccess(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const buyNow = () => {
    if (!product || !selectedSizeObj) {
      toast.error("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    cartService.addItem(cartItem);
    navigate("/checkout");
  };

  useEffect(() => {
    if (!isLoggedIn || relatedProducts.length === 0) return;
    const fetchRelatedFavorites = async () => {
      const newMap = { ...relatedFavoriteMap };
      await Promise.all(relatedProducts.map(async (p) => {
        try {
          if (newMap[p.id] === undefined) {
             const res = await favoriteService.checkFavorite(p.id);
             newMap[p.id] = Boolean(res?.data?.isFavorite);
          }
        } catch(e) {}
      }));
      setRelatedFavoriteMap(newMap);
    };
    fetchRelatedFavorites();
  }, [relatedProducts, isLoggedIn]);

  const handleToggleRelatedFavorite = async (e, relatedId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Bạn phải đăng nhập để thêm sản phẩm yêu thích");
      return;
    }

    const currentFav = Boolean(relatedFavoriteMap[relatedId]);
    setRelatedFavoriteMap((prev) => ({ ...prev, [relatedId]: !currentFav }));

    try {
      if (currentFav) {
        await favoriteService.removeFavorite(relatedId);
      } else {
        await favoriteService.addFavorite(relatedId);
      }
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      setRelatedFavoriteMap((prev) => ({ ...prev, [relatedId]: currentFav }));
    }
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

    const itemImages = Array.isArray(relatedProduct.images) ? relatedProduct.images : [];
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

    cartService.addItem(cartItem);
    notifyCartSuccess(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
  };


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">
          Không tìm thấy sản phẩm
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 relative">
      <Header />

      <div className="w-full mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-2 flex items-center flex-wrap gap-2 font-medium">
          {/* Nút 1: Lấy cố định chữ "Trang chủ" */}
          <span className="cursor-pointer hover:text-amber-600 transition-colors" onClick={() => navigate("/")}>Trang chủ</span>
          {/* Nút 2: Nếu có thông tin danh mục, sẽ in ra "/" và "Tên Danh Mục" (VD: Nước ngọt) */}
          {(productData || product)?.category_name && (
            <>
              <span className="text-gray-400">/</span>
              <span
                className="cursor-pointer hover:text-amber-600 transition-colors"
                onClick={() => navigate(`/${(productData || product).category_slug}`)}
              >
                {(productData || product).category_name}
              </span>
            </>
          )}
          {/* Nút 3: Nếu có thông tin tên sản phẩm, sẽ in ra "/" và "Tên Sản Phẩm" in đậm (VD: Bò húc) */}
          {(productData || product)?.name && (
            <>
              <span className="text-gray-400">/</span>
              <span className="text-amber-600 font-bold">{(productData || product).name}</span>
            </>
          )}
        </div>
      </div>



      <section className="w-full px-4 sm:px-6 lg:px-8 py-14">


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
                  src={displayImages[activeImageIndex]?.image_url || defaultImage}
                  alt={product?.name || 'Sản phẩm'}
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                />

                {/* Left/Right arrows if more than 1 image */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
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
                          ? 'border-[1.5px] border-[#A0522D]'
                          : 'border border-gray-200 opacity-60 hover:opacity-100'}`}
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

              <div className="flex gap-2 shrink-0">

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition ${isFavorite
                    ? "bg-red-50 border-red-500 text-red-500 hover:bg-white hover:text-gray-500 hover:border-gray-300"
                    : "bg-white dark:bg-gray-900 border-gray-300 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                  title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                </button>
              </div>
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
                              onClick={() => toggleTopping({ id: item.topping_id })}
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
                    <h5 className="font-bold text-red-600 dark:text-red-400 text-sm mb-1 uppercase tracking-wider">Flash sale</h5>
                    <p className="text-xs text-red-500/80 dark:text-red-300">Sản phẩm sẽ tự động trở về giá gốc khi hết thời gian</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2.5 rounded-xl shadow-sm border border-red-100 dark:border-red-900/40 shrink-0">
                  <Clock className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex items-center gap-1 text-[15px] font-bold text-red-600 dark:text-red-400">
                    <div className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <span>:</span>
                    <div className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <span>:</span>
                    <div className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-900/30 rounded">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8 p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng tiền tạm tính</p>

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
                        ? (Number(selectedSizeObj?.price || 0) * (1 - flashSaleDiscount / 100)).toLocaleString("vi-VN")
                        : Number(selectedSizeObj?.price || 0).toLocaleString("vi-VN")
                      }đ
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
                <span className="font-medium text-sm">Cửa hàng hiện đang đóng cửa. {nextOpenMessage}. Xin quý khách thông cảm</span>
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
                <span className="text-3xl">{averageRating > 0 ? averageRating : '5.0'}</span>
                <span className="text-base text-gray-500 font-normal"> trên 5</span>
              </div>
              <div className="flex text-[#ee4d2d] gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 flex-1">
              <button onClick={() => setReviewFilter('all')} className={reviewFilter === 'all' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>Tất Cả</button>
              <button onClick={() => setReviewFilter('5')} className={reviewFilter === '5' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>5 Sao ({reviews.filter(r => Number(r.rating) === 5).length})</button>
              <button onClick={() => setReviewFilter('4')} className={reviewFilter === '4' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>4 Sao ({reviews.filter(r => Number(r.rating) === 4).length})</button>
              <button onClick={() => setReviewFilter('3')} className={reviewFilter === '3' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>3 Sao ({reviews.filter(r => Number(r.rating) === 3).length})</button>
              <button onClick={() => setReviewFilter('2')} className={reviewFilter === '2' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>2 Sao ({reviews.filter(r => Number(r.rating) === 2).length})</button>
              <button onClick={() => setReviewFilter('1')} className={reviewFilter === '1' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>1 Sao ({reviews.filter(r => Number(r.rating) === 1).length})</button>
              <button onClick={() => setReviewFilter('has_comment')} className={reviewFilter === 'has_comment' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>Có Bình Luận ({reviews.filter(r => r.comment && r.comment.trim() !== '').length})</button>
              <button onClick={() => setReviewFilter('has_image')} className={reviewFilter === 'has_image' ? "px-4 py-1.5 border border-[#ee4d2d] text-[#ee4d2d] bg-white text-sm cursor-pointer dark:bg-gray-900 dark:border-red-500 dark:text-red-400" : "px-4 py-1.5 border border-transparent bg-white text-gray-800 hover:border-[#ee4d2d] hover:text-[#ee4d2d] text-sm cursor-pointer shadow-sm dark:bg-gray-800 dark:text-gray-200"}>Có Hình Ảnh ({reviews.filter(r => r.images && r.images.length > 0).length})</button>
            </div>
          </div>

          <div className="px-4">
            {reviewLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Đang tải đánh giá...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-10 text-gray-500">Không tìm thấy đánh giá nào</div>
            ) : (
              <div className="flex flex-col max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredReviews.map((item) => (
                  <div key={item.id} className="flex gap-4 py-6 border-b border-gray-100 dark:border-gray-800 last:border-0 pl-1 pr-1">
                    <div className="w-10 h-10 shrink-0 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 w-full max-w-full overflow-hidden">
                      <div className="text-[13px] text-gray-800 dark:text-gray-200 mb-1 font-medium">{item.full_name}</div>
                      <div className="flex gap-0.5 text-[#ee4d2d] mb-1.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`w-3.5 h-3.5 ${index < Number(item.rating) ? "fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <div className="text-gray-400 text-xs mb-3 flex items-center gap-1.5">
                        <span>{new Date(item.created_at || Date.now()).toLocaleString('vi-VN')}</span>
                      </div>

                      {item.comment && (
                        <div className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-line leading-relaxed max-w-full break-words">{item.comment}</div>
                      )}

                      {item.images && item.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.images.map((img, idx) => (
                            <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block w-[72px] h-[72px] bg-gray-50 border border-gray-100 overflow-hidden cursor-zoom-in group">
                              <img src={img.url} alt="Review img" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            </a>
                          ))}
                        </div>
                      )}


                    </div>
                  </div>
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
              <p className="text-sm text-gray-500">
                Bạn chỉ có thể đánh giá sản phẩm đã mua và đã hoàn tất đơn hàng.
              </p>
            ) : (
              <div className="bg-[#fafafa] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Chất lượng sản phẩm:</span>
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
                  {existingImages.map((img, idx) => (
                    <div key={`existing-${idx}`} className="relative w-[72px] h-[72px] shrink-0 border border-gray-200 shadow-sm">
                      <img src={img.url} className="w-full h-full object-cover" alt="Review existing" />
                      <button type="button" onClick={() => handleRemoveExistingImage(img.public_id)} className="absolute top-0 right-0 bg-[#ee4d2d] text-white p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {myImages.map((img, idx) => (
                    <div key={idx} className="relative w-[72px] h-[72px] shrink-0 border border-gray-200 shadow-sm">
                      <img src={img.url} className="w-full h-full object-cover" alt="Review preview" />
                      <button type="button" onClick={() => handleRemoveMyImage(idx)} className="absolute top-0 right-0 bg-[#ee4d2d] text-white p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {myImages.length < 3 && (
                    <label className="w-[72px] h-[72px] shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-[#ee4d2d] text-[#ee4d2d] cursor-pointer hover:bg-orange-50 transition bg-white">
                      <ImagePlus className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase font-medium">Thêm Hình</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddPreviewImages} />
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
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang gửi...</>
                    ) : (
                      "Hoàn Thành"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
            <div className="text-gray-500 dark:text-gray-400 py-6">
              Không có sản phẩm liên quan
            </div>
          ) : (
            <div className="relative group/related">
              <Swiper
                modules={[Navigation, Autoplay]}
                navigation={{
                   nextEl: ".related-swiper-next",
                   prevEl: ".related-swiper-prev",
                }}
                autoplay={{ delay: 5000 }}
                spaceBetween={24}
                slidesPerView={1}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                }}
                className="pb-4"
              >
                {relatedProducts.slice(0, 10).map((item) => {
                  const itemImages = Array.isArray(item.images) ? item.images : [];
                  const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                  const itemImage = itemImages[0]?.image_url || defaultImage;

                  const validPrices = itemSizes
                    .map((s) => Number(s.price))
                    .filter((p) => Number.isFinite(p) && p > 0);

                  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
                  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
                  const hasMultiplePrices = minPrice !== null && maxPrice !== null && maxPrice > minPrice;

                  let priceText = "Liên hệ";
                  if (minPrice !== null) {
                    priceText = `${minPrice.toLocaleString("vi-VN")}đ`;
                    if (hasMultiplePrices) {
                      priceText = `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
                    }
                  }

                  const relatedSale = activeSale && activeSale.product_ids?.includes(item.id) ? activeSale : null;
                  const finalSalePrice = relatedSale && minPrice !== null ? Math.round(minPrice * (1 - relatedSale.discount_percent / 100)) : null;

                  return (
                    <SwiperSlide key={item.id} className="h-auto">
                      <div className="group h-full pb-4 px-2 pt-2">
                        <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                          <div className="relative">
                            {relatedSale && (
                              <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                                <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                  <Zap className="w-3 h-3 fill-white" /> Giảm {relatedSale.discount_percent}%
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleToggleRelatedFavorite(e, item.id)}
                              className={`absolute right-0 top-0 z-10 flex items-center justify-center transition-all ${Boolean(relatedFavoriteMap[item.id])
                                ? "text-red-500 drop-shadow-sm"
                                : "text-[#DCD5CD] hover:text-red-400 dark:text-gray-600"
                                }`}
                              title={Boolean(relatedFavoriteMap[item.id]) ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                            >
                              <Heart className={`h-5 w-5 ${Boolean(relatedFavoriteMap[item.id]) ? "fill-current" : ""}`} strokeWidth={1.5} />
                            </button>

                            <div onClick={() => navigate(`/${item.slug || 'products/' + item.id}`)} className="block mt-6 mb-2 cursor-pointer">
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

                            <div onClick={() => navigate(`/${item.slug || 'products/' + item.id}`)} className="cursor-pointer">
                              <h3 className="line-clamp-2 text-base font-bold text-[#4A3219] dark:text-gray-100 transition hover:text-[#8B5A2B] min-h-[44px] mb-1.5" style={{ fontFamily: 'serif' }}>
                                {item.name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-1.5 mb-5 h-[20px]">
                              <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                {Number(item.rating) > 0 ? Number(item.rating).toFixed(1) : "Chưa có đánh giá"}
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
                              <button
                                onClick={(e) => handleRelatedFastAdd(e, item)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isStoreOpen 
                                  ? "bg-[#D62828] text-white hover:bg-[#B91D1D] hover:scale-105 shadow-md"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                                title={isStoreOpen ? "Thêm vào giỏ" : "Cửa hàng đóng cửa"}
                              >
                                <Plus fill="none" className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              <button className="related-swiper-prev absolute left-0 top-[40%] -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md text-amber-600 flex items-center justify-center opacity-0 group-hover/related:opacity-100 hover:bg-amber-50 transition !hidden md:!flex">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="related-swiper-next absolute right-0 top-[40%] -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md text-amber-600 flex items-center justify-center opacity-0 group-hover/related:opacity-100 hover:bg-amber-50 transition !hidden md:!flex">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Cửa sổ Modal Thêm vào giỏ hàng thành công */}
      <CartSuccessModal addedCartItem={addedCartItem} onClose={() => setAddedCartItem(null)} />
    </div>
  );
}
