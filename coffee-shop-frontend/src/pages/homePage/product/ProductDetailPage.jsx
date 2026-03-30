import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Heart,
  Star,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiAssistantWidget from "@/components/layout/AiAssistantWidget";
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

export default function ProductDetailPage() {
  const { id } = useParams();
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
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [activeSale, setActiveSale] = useState(null);

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => {});
  }, []);

  const fetchProduct = useCallback(() => {
    return productService.getById(id);
  }, [id]);

  const { data, loading } = useFetch(fetchProduct);

  const product = data?.data || null;
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const images = Array.isArray(product?.images) ? product.images : [];
  const description = (product?.description || "").trim();
  const hasRichDescription = /<[^>]+>/.test(description);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const displayImages =
    images.length > 0 ? images : [{ image_url: defaultImage }];

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0].size);
    }
  }, [sizes, selectedSize]);

  useEffect(() => {
    setQuantity(1);
    setSelectedSize(null);
    setSelectedToppings([]);
    setShowToppings(false);
  }, [id]);

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
      } catch (error) {
        console.error("Lỗi lấy đánh giá của bạn:", error);
        setCanReview(false);
        setMyRating(0);
        setMyComment("");
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

    try {
      setReviewSubmitting(true);

      const res = await reviewService.createOrUpdate({
        product_id: product.id,
        rating: myRating,
        comment: myComment,
      });

      alert(res?.data?.message || "Gửi đánh giá thành công");

      const reviewRes = await reviewService.getByProductId(product.id);
      const reviewResult = reviewRes?.data?.data || {};

      setReviews(Array.isArray(reviewResult?.items) ? reviewResult.items : []);
      setAverageRating(Number(reviewResult?.averageRating) || 0);
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      alert(error?.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setReviewSubmitting(false);
    }
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

    try {
      setFavoriteLoading(true);

      const res = await favoriteService.toggleFavorite(product.id, isFavorite);

      setIsFavorite(Boolean(res?.data?.isFavorite));

      alert(
        res?.message ||
          (!isFavorite
            ? "Đã thêm sản phẩm vào yêu thích"
            : "Đã bỏ sản phẩm khỏi yêu thích")
      );
    } catch (error) {
      console.error("Lỗi cập nhật yêu thích:", error);
      alert(error?.message || "Không thể cập nhật yêu thích");
    } finally {
      setFavoriteLoading(false);
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

  const addToCart = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    cartService.addItem(cartItem);
    alert("Đã thêm vào giỏ hàng");
  };

  const buyNow = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    cartService.addItem(cartItem);
    navigate("/checkout");
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            ← Quay lại
          </Button>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop
              className="rounded-2xl overflow-hidden border border-gray-200  shadow-sm relative"
            >
              {isFlashSale && (
                <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
                  ⚡ Flash Sale Giảm {flashSaleDiscount}%
                </div>
              )}
              {displayImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="h-[420px] bg-gray-100 dark:bg-gray-800">
                    <img
                      src={img.image_url || defaultImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Mô tả sản phẩm
              </h3>

              {description ? (
                hasRichDescription ? (
                  <div
                    className="product-rich-content text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 leading-8 whitespace-pre-line">
                    {description}
                  </p>
                )
              ) : (
                <p className="text-gray-600 dark:text-gray-400 leading-8">
                  Thưởng thức hương vị đặc biệt của chúng tôi
                </p>
              )}
            </div>
            <div className="mt-6 bg-gray-50 dark:bg-gray-950 border border-gray-200  rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Đánh giá
                </h3>

                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {averageRating > 0 ? averageRating : "--"}
                  </span>
                </div>
              </div>

              {reviewLoading ? (
                <div className="flex items-center justify-center py-6 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Đang tải đánh giá...
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có đánh giá nào</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                  {reviews.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-900 border border-gray-200  rounded-xl px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
                            {item.full_name}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString(
                                  "vi-VN"
                                )
                              : ""}
                            {item.is_edited ? " • Đã chỉnh sửa" : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 shrink-0">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`w-4 h-4 ${
                                index < Number(item.rating)
                                  ? "fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {item.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-6 break-words">
                          {item.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 ">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Đánh giá của bạn
                </h4>

                {!isLoggedIn ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vui lòng đăng nhập để đánh giá sản phẩm.
                  </p>
                ) : !canReview ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bạn chỉ có thể đánh giá sản phẩm đã mua và đã hoàn tất đơn
                    hàng.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const starValue = index + 1;

                        return (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setMyRating(starValue)}
                            className="transition"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                starValue <= myRating
                                  ? "text-amber-500 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <Textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      rows={4}
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                      className="w-full rounded-xl text-sm"
                    />

                    <div className="mt-3">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={reviewSubmitting}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {reviewSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          "Gửi đánh giá"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  {product.category_name || "Danh mục"}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {product.name}
                </h1>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Sản phẩm ${product.name} rất ngon, hãy vào cà phê mua ngay bạn nhé`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
                  }}
                  className="w-12 h-12 rounded-full border flex items-center justify-center transition bg-white dark:bg-gray-900 border-gray-300 text-blue-600 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  title="Chia sẻ lên Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Sản phẩm ${product.name} rất ngon, hãy vào cà phê mua ngay bạn nhé`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
                  }}
                  className="w-12 h-12 rounded-full border flex items-center justify-center transition bg-white dark:bg-gray-900 border-gray-300 text-gray-800 dark:text-gray-200 hover:border-black hover:text-black hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-800"
                  title="Chia sẻ lên X (Twitter)"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition ${
                    isFavorite
                      ? "bg-red-50 border-red-500 text-red-500"
                      : "bg-white dark:bg-gray-900 border-gray-300 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                  title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                  {favoriteLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                  )}
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
                      className={`px-4 py-2 rounded-full border font-medium ${
                        selectedSize === size.size
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
                  <div className="mt-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 p-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Topping đã chọn
                    </p>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedToppings.map((item) => (
                        <div
                          key={item.topping_id}
                          className="flex items-center justify-between gap-3"
                        >
                          <span>{item.name}</span>
                          <span className="font-medium text-amber-600">
                            +{Number(item.price).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-8 p-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng tiền tạm tính</p>
              
              <div className="flex flex-col">
                {isFlashSale && originalDisplayPrice ? (
                  <div className="flex items-center gap-3">
                    <p className="text-4xl font-bold text-red-600">
                      {selectedSizeObj
                        ? `${displayPrice.toLocaleString("vi-VN")}đ`
                        : "Liên hệ"}
                    </p>
                    <span className="text-xl line-through text-gray-400 font-medium">
                      {originalDisplayPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-amber-600">
                    {selectedSizeObj
                      ? `${displayPrice.toLocaleString("vi-VN")}đ`
                      : "Liên hệ"}
                  </p>
                )}
              </div>

              {selectedToppings.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200  text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span>Giá size {selectedSizeObj?.size || ""}:</span>
                    <span className="font-medium">
                      {isFlashSale 
                        ? (Number(selectedSizeObj?.price || 0) * (1 - flashSaleDiscount/100)).toLocaleString("vi-VN")
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
                <span className="font-medium text-sm">Cửa hàng hiện đang đóng cửa. {nextOpenMessage}. Bạn không thể đặt hàng lúc này.</span>
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
                className="px-8 py-6 text-base border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:border-gray-400 disabled:text-gray-500 disabled:hover:bg-transparent"
              >
                Mua ngay
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Sản phẩm liên quan
            </h2>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((item) => {
                const itemImages = Array.isArray(item.images)
                  ? item.images
                  : [];
                const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                const itemImage = itemImages[0]?.image_url || defaultImage;

                const minPrice =
                  itemSizes.length > 0
                    ? Math.min(...itemSizes.map((s) => Number(s.price)))
                    : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/products/${item.id}`)}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200  overflow-hidden cursor-pointer hover:shadow-lg transition"
                  >
                    <div className="h-56 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {item.category_name || "Danh mục"}
                      </p>

                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[48px]">
                        {item.name}
                      </h3>

                      <p className="text-amber-600 font-bold text-lg mt-3">
                        {minPrice !== null
                          ? `${minPrice.toLocaleString("vi-VN")}đ`
                          : "Liên hệ"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <AiAssistantWidget />
    </div>
  );
}
