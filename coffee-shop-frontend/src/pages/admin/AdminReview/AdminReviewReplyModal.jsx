import { useState, useEffect } from "react";
import { Loader2, X, ImagePlus, MessageSquareReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import reviewService from "@/services/reviewService";
import { toast } from "sonner";

const isVideoUrl = (url) => typeof url === "string" && (url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video/upload"));

export default function AdminReviewReplyModal({ review, onClose, onRefresh }) {
  const [comment, setComment] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [myImages, setMyImages] = useState([]);
  const [deleteImageIds, setDeleteImageIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (review) {
      setComment(review.reply_comment || "");
      if (review.reply_images && Array.isArray(review.reply_images)) {
        setExistingImages(review.reply_images);
      } else {
        setExistingImages([]);
      }
      setMyImages([]);
      setDeleteImageIds([]);
    }
  }, [review]);

  if (!review) return null;

  const handleAddPreviewFiles = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const addedCount = e.target.files.length;
    const currentTotal = myImages.length + existingImages.length;
    
    if (currentTotal + addedCount > 4) {
      toast.error("Tối đa 4 tệp (ảnh/video) được phép");
      return;
    }
    
    const newFiles = Array.from(e.target.files).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    
    setMyImages(prev => [...prev, ...newFiles]);
  };

  const handleRemoveExistingImage = (publicId) => {
    setExistingImages(prev => prev.filter(img => img.public_id !== publicId));
    setDeleteImageIds(prev => [...prev, publicId]);
  };

  const handleRemoveMyImage = (indexToRemove) => {
    setMyImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("reply_comment", comment);
      
      if (deleteImageIds.length > 0) {
        formData.append("deleteImageIds", JSON.stringify(deleteImageIds));
      }
      
      myImages.forEach(img => {
        formData.append("reply_images", img.file);
      });

      await reviewService.replyReview(review.id, formData);
      toast.success("Đã gửi phản hồi thành công");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lỗi khi phản hồi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-gray-800">
            <MessageSquareReply className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Phản hồi thẻ đánh giá</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Review Info Box */}
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg mb-6">
            <div className="flex gap-2">
              <span className="font-semibold text-gray-800">{review.full_name}</span>
              <span className="text-gray-500 text-sm">viết về sản phẩm</span>
              <span className="font-medium text-amber-700">{review.product_name}</span>
            </div>
            <div className="mt-2 text-gray-700 text-sm whitespace-pre-line border-l-2 border-amber-300 pl-3 italic">
              {review.comment || "(Không có nội dung bỉnh luận)"}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung phản hồi từ Người Bán
              </label>
              <Textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập nội dung phản hồi của bạn..."
                className="w-full min-h-[120px] resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đính kèm File (Tối đa 4 ảnh/video)
              </label>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img, idx) => {
                  const isVid = isVideoUrl(img.url);
                  return (
                    <div key={`exist-${idx}`} className="relative w-20 h-20 border rounded overflow-hidden">
                      {isVid ? (
                        <video src={img.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={img.url} className="w-full h-full object-cover" alt="attachment" />
                      )}
                      <button type="button" onClick={() => handleRemoveExistingImage(img.public_id)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 z-10 hover:bg-red-600">
                        <X className="w-4 h-4"/>
                      </button>
                    </div>
                  );
                })}
                {myImages.map((img, idx) => {
                  const isVid = img.file.type.startsWith("video/");
                  return (
                    <div key={`my-${idx}`} className="relative w-20 h-20 border rounded overflow-hidden">
                      {isVid ? (
                        <video src={img.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={img.url} className="w-full h-full object-cover" alt="attachment" />
                      )}
                      <button type="button" onClick={() => handleRemoveMyImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 z-10 hover:bg-red-600">
                        <X className="w-4 h-4"/>
                      </button>
                    </div>
                  );
                })}
                {existingImages.length + myImages.length < 4 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#ee4d2d] hover:text-[#ee4d2d] transition-colors">
                    <ImagePlus className="w-6 h-6 mb-1"/>
                    <span className="text-[10px] uppercase font-medium">Thêm File</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAddPreviewFiles} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 min-w-28 text-white">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} 
            {isSubmitting ? "Đang gửi..." : "Gửi Phản Hồi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
