import React, { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor/RichTextEditor";
import newsletterService from "@/services/newsletterService";

function BroadcastEmailModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      return toast.error("Vui lòng điền Tiêu đề thư");
    }
    if (!content.trim() || content === "<p><br></p>") {
      return toast.error("Vui lòng soạn Nội dung email");
    }

    try {
      setIsSending(true);
      const res = await newsletterService.broadcast({
        subject,
        content,
      });
      toast.success(res.message);
      onClose();
      // Reset form
      setSubject("");
      setContent("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lỗi khi thiết lập chiến dịch");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-md font-semibold text-gray-800">
              Gửi chiến dịch Email (Broadcast)
            </h2>
            <p className="text-sm text-gray-500">
              Thư sẽ được gửi tới tất cả người dùng đang "Đang nhận tin".
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề thư (Subject) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Giảm giá ngày hội cà phê 2026..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung thiết kế <span className="text-red-500">*</span>
              </label>
              <div className="bg-white border text-black border-gray-300 rounded-lg overflow-hidden">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Soạn nội dung cực cháy để gửi khách hàng..."
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-4 rounded-lg">
              <strong>Lưu ý: </strong>
              Nội dung của bạn sẽ được gói bên trong Template thư bản quyền có sẵn Logo và CSS của cửa hàng.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-5 py-2.5 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lên lịch gửi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gửi toàn bộ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BroadcastEmailModal;
