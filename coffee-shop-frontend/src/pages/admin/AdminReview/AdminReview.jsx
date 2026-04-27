import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import reviewService from "@/services/reviewService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PaginationControl from "@/components/common/PaginationControl";
import AdminReviewReplyModal from "./AdminReviewReplyModal";

const isVideoUrl = (url) =>
  typeof url === "string" &&
  (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video/upload"));

export default function AdminReviews() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [selectedReplyReview, setSelectedReplyReview] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [peekImage, setPeekImage] = useState(null);

  const abortRef = useRef(null);
  const outletContext = useOutletContext() || {};
  const notifications = outletContext.notifications || [];

  const unreadCounts = {};
  if (Array.isArray(notifications)) {
    notifications.forEach((n) => {
      if (n.type === "new_review" && Number(n.is_read) === 0 && n.entity_id) {
        unreadCounts[n.entity_id] = (unreadCounts[n.entity_id] || 0) + 1;
      }
    });
  }

  const PAGE_SIZE = 7;

  const fetchReviews = async (currentPage = page, search = keyword) => {
    try {
      setIsLoading(true);
      setError(null);

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await reviewService.getAll(
        {
          page: currentPage,
          limit: PAGE_SIZE,
          keyword: search,
        },
        controller.signal
      );

      const payload = res?.data || res;

      setData(payload.items || []);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || payload.totalCount || 0);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Lỗi lấy danh sách review:", err);
        setError("Không thể tải danh sách review");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchReviews(page, keyword);
    }, 600);

    return () => clearTimeout(timeout);
  }, [keyword, page]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${index < Number(rating)
                ? "text-amber-500 fill-current"
                : "text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  if (error && data.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchReviews(1, "")}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">Quản lý đánh giá</h2>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo sản phẩm, người dùng, bình luận hoặc số sao..."
              value={keyword}
              onChange={(e) => {
                setPage(1);
                setKeyword(e.target.value);
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="relative bg-card rounded-xl border border-border overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center w-[60px]">STT</TableHead>
                <TableHead className="min-w-[180px]">Người đánh giá</TableHead>
                <TableHead className="min-w-[180px]">Sản phẩm</TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Số sao
                </TableHead>
                <TableHead className="min-w-[260px]">Bình luận</TableHead>
                <TableHead className="text-center min-w-[140px]">
                  Trạng thái
                </TableHead>
                <TableHead className="text-center min-w-[170px]">
                  Ngày tạo
                </TableHead>
                <TableHead className="text-center min-w-[120px]">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Không có review nào
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  const stt = (page - 1) * PAGE_SIZE + index + 1;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium">
                        {stt}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{item.full_name}</div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{item.product_name}</div>
                      </TableCell>

                      <TableCell className="text-center">
                        {renderStars(item.rating)}
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[320px] whitespace-normal break-words text-sm text-gray-700">
                          {item.comment || "—"}
                          {item.images && item.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {item.images.map((img, idx) => {
                                const isVideo = isVideoUrl(img.url);
                                return (
                                  <button 
                                    key={idx} 
                                    onMouseEnter={() => !expandedImage && setPeekImage({ images: item.images, index: idx })}
                                    onMouseLeave={() => setPeekImage(null)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPeekImage(null);
                                      setExpandedImage({ images: item.images, index: idx });
                                    }}
                                    className="shrink-0 hover:opacity-100 opacity-80 transition-opacity block w-10 h-10 relative cursor-zoom-in"
                                  >
                                    {isVideo ? (
                                      <>
                                        <video src={img.url} className="w-full h-full rounded border border-gray-200 object-cover" muted playsInline />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded pointer-events-none">
                                          <div className="w-4 h-4 bg-white/80 rounded-full flex items-center justify-center">
                                            <div className="w-0 h-0 border-t-2 border-t-transparent border-l-[3px] border-l-black border-b-2 border-b-transparent ml-0.5" />
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <img src={img.url} alt="Review attachment" className="w-full h-full rounded border border-gray-200 object-cover pointer-events-none" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant={item.is_edited ? "secondary" : "outline"}
                          className="inline-flex min-w-[110px] justify-center"
                        >
                          {item.is_edited ? "Đã chỉnh sửa" : "Mới"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex text-xs flex-col items-center justify-center">
                          <span>
                            {item.updated_at || item.created_at
                              ? new Date(item.updated_at || item.created_at).toLocaleString("vi-VN")
                              : "—"}
                          </span>
                          {item.category_name && (
                            <span className="text-xs text-gray-400 mt-1">
                              Phân loại hàng: {item.category_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5 mt-1 relative">
                          <div className="relative inline-block">
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedReplyReview(item)}
                              className={
                                item.reply_comment || (item.reply_images && item.reply_images.length > 0) 
                                  ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 hover:text-amber-700 shadow-none" 
                                  : "bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-colors"
                              }
                            >
                              {item.reply_comment || (item.reply_images && item.reply_images.length > 0) ? "Đã phản hồi" : "Trả lời"}
                            </Button>
                            {unreadCounts[item.id] > 0 && (
                              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-in zoom-in">
                                {unreadCounts[item.id]}
                              </span>
                            )}
                          </div>
                          {item.replied_at && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              {new Date(item.replied_at).toLocaleString("vi-VN")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          itemName="đánh giá"
        />
      )}

      {selectedReplyReview && (
        <AdminReviewReplyModal 
          review={selectedReplyReview} 
          onClose={() => setSelectedReplyReview(null)} 
          onRefresh={() => fetchReviews(page, keyword)}
        />
      )}

      {peekImage && !expandedImage && createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {isVideoUrl(peekImage.images[peekImage.index].url) ? (
              <video src={peekImage.images[peekImage.index].url} autoPlay loop muted className="max-w-[80vw] max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/20 bg-black/10 backdrop-blur-md" />
            ) : (
              <img src={peekImage.images[peekImage.index].url} className="max-w-[80vw] max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/20 bg-black/10 backdrop-blur-md" />
            )}
          </div>
        </div>,
        document.body
      )}

      {expandedImage && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center animate-in fade-in duration-200" onClick={() => setExpandedImage(null)}>
          <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
            <X className="w-10 h-10" />
          </button>
          
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isVideoUrl(expandedImage.images[expandedImage.index].url) ? (
              <video src={expandedImage.images[expandedImage.index].url} controls autoPlay className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            ) : (
              <img src={expandedImage.images[expandedImage.index].url} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            )}
            
            {expandedImage.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedImage(prev => ({
                      ...prev,
                      index: prev.index === 0 ? prev.images.length - 1 : prev.index - 1
                    }))
                  }}
                  className="absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full shadow-lg transition"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedImage(prev => ({
                      ...prev,
                      index: prev.index === prev.images.length - 1 ? 0 : prev.index + 1
                    }))
                  }}
                  className="absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 text-white rounded-full shadow-lg transition"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
