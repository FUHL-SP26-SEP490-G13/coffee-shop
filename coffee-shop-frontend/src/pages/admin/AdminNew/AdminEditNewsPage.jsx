import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import newsService from "@/services/newsService";
import TinyEditor from "@/components/TinyEditor";

export default function AdminEditNewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
  });

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await newsService.getById(id);
        const data = res.data?.data || res.data;

        setForm({
          title: data.title,
          summary: data.summary,
          content: data.content,
        });

        setPreview(data.thumbnail);
      } catch (error) {
        console.error("Lỗi load bài:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("summary", form.summary);
      formData.append("content", form.content);

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }

      await newsService.update(id, formData);

      // 🔥 Sau khi lưu quay về danh sách
      navigate("/admin/news-list");

    } catch (error) {
      alert("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">

      {/* Header + Nút quay lại */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa bài viết</h1>

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
        className="w-full border p-3 rounded mb-4"
      />

      {/* Thumbnail Upload */}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          setThumbnailFile(file);
          setPreview(URL.createObjectURL(file));
        }}
        className="w-full border p-3 rounded mb-4"
      />

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="w-full max-h-80 object-cover rounded mb-4"
        />
      )}

      {/* Summary */}
      <textarea
        name="summary"
        value={form.summary}
        onChange={handleChange}
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

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>

        <button
          onClick={() => navigate("/admin/news-list")}
          className="border px-6 py-2 rounded"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
