import { useEffect, useState } from "react";
import newsService from "@/services/newsService";

export default function AdminNewsList() {
  const [news, setNews] = useState([]);

  const fetchNews = async () => {
    const res = await newsService.getAllAdmin();
    setNews(res.data.data);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    await newsService.delete(id);
    fetchNews();
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">Quản lý bài viết</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3">Tiêu đề</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {news.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-3">{item.title}</td>
              <td>
                {item.is_published ? "Xuất bản" : "Nháp"}
              </td>
              <td className="flex gap-3 p-3">
                <button
                  className="text-blue-600"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("edit-news", {
                        detail: item,
                      })
                    )
                  }
                >
                  Sửa
                </button>

                <button
                  className="text-red-600"
                  onClick={() => handleDelete(item.id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
