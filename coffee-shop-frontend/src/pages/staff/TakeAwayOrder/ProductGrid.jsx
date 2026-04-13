import { useState, useEffect } from 'react';
import { Coffee, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import productService from '@/services/productService';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
const PAGE_SIZE = 12;

const mapProducts = (rawProducts) =>
  rawProducts
    .map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      image_url: (p.images || []).find((img) => img.isThumbnail === 1)?.image_url || null,
      category: p.category_name || '',
      category_id: p.category_id,
      category_type: p.category_type,
      sizes: (p.sizes || [])
        .filter((s) => !s.is_deleted)
        .map((s) => ({ id: s.id, size: s.size, price: Number(s.price) })),
    }))
    .filter((p) => p.status === 'available' && p.sizes.length > 0);

/**
 * @param {{
 *   activeCategory: 'all' | number,
 *   onSelectProduct: Function,
 * }} props
 */
export function ProductGrid({ activeCategory, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset về trang 1 mỗi khi đổi category
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  // Fetch khi page hoặc category thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          status: 'available',
          is_deleted: 0,
          limit: PAGE_SIZE,
          page: currentPage,
        };
        if (activeCategory !== 'all') params.category_id = activeCategory;

        const res = await productService.getAll(params);
        const rawData = res?.data || [];
        const pagination = res?.pagination;

        setProducts(mapProducts(rawData));
        setTotalPages(pagination?.totalPages ?? 1);
      } catch (e) {
        console.error('Lỗi tải sản phẩm:', e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Tạo danh sách số trang (tối đa 5 nút)
  const pageNumbers = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2)
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  })();

  return (
    <div className='flex flex-col h-full'>

      {/* Grid */}
      <div className='flex-1 overflow-y-auto px-5 pt-3 pb-3'>
        {loading ? (
          <div className='flex items-center justify-center h-full'>
            <Loader2 size={28} className='animate-spin text-amber-400' />
          </div>
        ) : products.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-gray-300 gap-2'>
            <Coffee size={40} />
            <p className='text-sm'>Không có sản phẩm</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className='group bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 p-3.5 text-left hover:border-amber-300 hover:shadow-md dark:shadow-none transition-all active:scale-95'
              >
                <div className='w-full aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3'>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-all'>
                      <Coffee size={28} className='text-amber-400' />
                    </div>
                  )}
                </div>
                <p className='text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight'>{p.name}</p>
                <p className='text-xs text-amber-600 dark:text-amber-400 font-medium mt-1'>{fmt(p.sizes[0].price)}</p>
                <div className='mt-2 w-full py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold text-center opacity-0 group-hover:opacity-100 transition-all'>
                  Chọn
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phân trang — chỉ hiện khi có > 1 trang */}
      {!loading && totalPages > 1 && (
        <div className='shrink-0 flex items-center justify-center gap-1.5 px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'>

          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className='w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
          >
            <ChevronLeft size={15} />
          </button>

          {pageNumbers[0] > 1 && (
            <>
              <button onClick={() => goToPage(1)}
                className='w-8 h-8 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-all'>
                1
              </button>
              {pageNumbers[0] > 2 && <span className='text-gray-400 text-xs px-1'>…</span>}
            </>
          )}

          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => goToPage(n)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${n === currentPage
                  ? 'bg-amber-500 text-white border border-amber-500 shadow-sm dark:shadow-none'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50'
                }`}
            >
              {n}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className='text-gray-400 text-xs px-1'>…</span>
              )}
              <button onClick={() => goToPage(totalPages)}
                className='w-8 h-8 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-all'>
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
          >
            <ChevronRight size={15} />
          </button>

          <span className='ml-2 text-xs text-gray-400'>{currentPage}/{totalPages}</span>
        </div>
      )}
    </div>
  );
}