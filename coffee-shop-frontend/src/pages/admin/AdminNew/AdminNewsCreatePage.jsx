import { useState } from "react";
import { useNavigate } from "react-router-dom";
import newsService from "@/services/newsService";
import TinyEditor from "@/components/TinyEditor";

export default function AdminNewsCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    thumbnail: "",
    summary: "",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.title || !form.content) {
        alert("Vui lòng nhập tiêu đề và nội dung");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("summary", form.summary);
      formData.append("content", form.content);
      formData.append("thumbnail", form.thumbnail);

      await newsService.create(formData);

      // 🔥 Sau khi tạo xong quay lại list
      navigate("/admin/news-list");

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tạo bài viết mới</h1>

        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-black transition"
        >
          ← Quay lại
        </button>
      </div>

      {/* Title */}
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Tiêu đề"
        className="w-full border p-3 rounded mb-4"
      />

      {/* Thumbnail */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          setForm((prev) => ({
            ...prev,
            thumbnail: file,
          }));

          setPreview(URL.createObjectURL(file));
        }}
        className="w-full border p-3 rounded mb-4"
      />

      {preview && (
        <div className="mb-4">
          <p className="text-sm mb-2">Xem trước thumbnail:</p>
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-80 object-cover rounded-lg border"
          />
        </div>
      )}

      {/* Summary */}
      <textarea
        name="summary"
        value={form.summary}
        onChange={handleChange}
        placeholder="Tóm tắt"
        rows={3}
        className="w-full border p-3 rounded mb-4"
      />

      <TinyEditor
        value={form.content}
        onChange={(value) =>
          setForm((prev) => ({
            ...prev,
            content: value,
          }))
        }
      />

      <div className="flex gap-4 items-center mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Đang đăng..." : "Đăng bài"}
        </button>
      </div>
    </div>
  );
}
