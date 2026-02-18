import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import newsService from "@/services/newsService";

export default function AdminNewsList() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingId, setLoadingId] = useState(null);
  const [searchTitle, setSearchTitle] = useState("");
  const navigate = useNavigate();

  // ==============================
  // FETCH DATA
  // ==============================
  const fetchNews = async (currentPage = page, title = searchTitle) => {
    try {
      const res = await newsService.getAllAdmin(currentPage, title);
      const payload = res.data?.data || res.data;

      setData(payload.items || []);
      setTotalPages(payload.totalPages || 1);
    } catch (error) {
      console.error("Lỗi lấy danh sách tin:", error);
    }
  };

  // Load lần đầu & khi đổi page
  useEffect(() => {
    fetchNews(page, searchTitle);
  }, [page]);

  // ==============================
  // SEARCH
  // ==============================
  const handleSearch = () => {
    setPage(1);
    fetchNews(1, searchTitle);
  };

  const handleReset = () => {
    setSearchTitle("");
    setPage(1);
    fetchNews(1, "");
  };

  // ==============================
  // DELETE
  // ==============================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;

    try {
      setLoadingId(id);
      await newsService.delete(id);
      fetchNews(page, searchTitle);
    } catch (error) {
      alert("Xóa thất bại");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl mb-1">Quản lý bài viết</h2>
        <button
          onClick={() => navigate("/admin/create-news")}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          + Thêm mới
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Nhập tiêu đề..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          className="border p-2 rounded w-72"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 transition"
        >
          Tìm kiếm
        </button>

        <button
          onClick={handleReset}
          className="border px-4 rounded hover:bg-gray-100 transition"
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Tiêu đề</th>
              <th className="text-center">Ngày tạo</th>
              <th className="text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-3 font-medium">{item.title}</td>

                <td className="text-center">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>

                <td className="text-center space-x-4">
                  <button
                    onClick={() => navigate(`/admin/news-detail/${item.slug}`)}
                    className="text-gray-600 hover:text-black transition"
                  >
                    Xem
                  </button>

                  <button
                    onClick={() => navigate(`/admin/edit-news/${item.id}`)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    Sửa
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={loadingId === item.id}
                    className={`transition ${
                      loadingId === item.id
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-red-600 hover:text-red-800"
                    }`}
                  >
                    {loadingId === item.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-6 text-gray-500">
                  Không có bài viết nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-6 gap-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="border px-4 py-1 rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span>
          Trang {page} / {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="border px-4 py-1 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
