import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import newsService from "@/services/newsService";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export default function NewsListPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const limit = 6;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await newsService.getAll({ page, limit });
      setData(res.data);   // chú ý .data
      setLoading(false);
    };

    fetchData();
  }, [page]);

  const newsList = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <Header />

      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-4xl font-bold mb-12">Tất cả tin tức</h1>

        {loading && (
          <p className="text-center text-gray-500 mb-6">
            Đang tải dữ liệu...
          </p>
        )}

        <div className="space-y-10">
          {newsList.map((item) => (
            <div key={item.id} className="border-b pb-6">
              <h2 className="text-2xl font-semibold mb-2">
                {item.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {item.summary}
              </p>
              <Link
                to={`/news/${item.slug}`}
                className="text-[#b71c1c] hover:underline"
              >
                Đọc tiếp →
              </Link>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-12 gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              ←
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setPage(index + 1)}
                className={`px-4 py-2 border rounded ${
                  page === index + 1
                    ? "bg-[#b71c1c] text-white"
                    : "bg-white"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
