import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';

import productService from '../../../services/productService';
import categoryService from '../../../services/categoryService';
import useFetch from '../../../hooks/useFetch';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

import CreateProduct from './Action/CreateProduct';
import UpdateProduct from './Action/UpdateProduct';
import DeleteProduct from './Action/DeleteProduct';
import AddRecipeModal from './Action/AddRecipeModal';
import ViewRecipeModal from './Action/ViewRecipeModal';
import PaginationControl from '../../../components/common/PaginationControl';

const PAGE_SIZE = 8;

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset page to 1 simultaneously
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [modal, setModal] = useState({
    type: null,
    data: null,
  });

  const openModal = (type, data = null) => {
    setModal({ type, data });
  };

  const closeModal = () => {
    setModal({ type: null, data: null });
  };

  const fetchProducts = useCallback(() => {
    if (debouncedQuery.trim()) {
      return productService.search({
        keyword: debouncedQuery.trim(),
        page,
        limit: PAGE_SIZE,
      });
    }
    return productService.getAll({
      page,
      limit: PAGE_SIZE,
    });
  }, [page, debouncedQuery]);

  const {
    data: response,
    loading,
    error,
    execute: refetch,
  } = useFetch(fetchProducts);

  const products = useMemo(() => {
    const productList = Array.isArray(response?.data) ? response.data : [];
    return productList.filter((p) => Number(p?.is_deleted ?? 0) === 0);
  }, [response]);

  const pagination = response?.pagination || {};
  const totalPages = Number(pagination.totalPages || 1);
  const currentPage = Number(pagination.page || page);

  const fetchCategories = useCallback(() => {
    return categoryService.getAll();
  }, []);

  const { data: categoryResponse } = useFetch(fetchCategories);
  const categories = Array.isArray(categoryResponse?.data)
    ? categoryResponse.data
    : [];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = filterCategory === '' || String(p.category_id) === filterCategory;
      const matchStatus = filterStatus === '' || p.status === filterStatus;
      return matchCategory && matchStatus;
    });
  }, [products, filterCategory, filterStatus]);

  const getThumbnail = (product) => {
    if (!product.images || product.images.length === 0) {
      return '/placeholder-product.png';
    }

    const thumbnail = product.images.find(
      (img) => Number(img.isThumbnail) === 1,
    );
    if (thumbnail) return thumbnail.image_url;

    return product.images[0]?.image_url || '/placeholder-product.png';
  };

  const formatSizes = (sizes) => {
    if (!sizes || sizes.length === 0) {
      return (
        <span className='text-muted-foreground text-sm'>Chưa có size</span>
      );
    }

    return (
      <div className='text-sm space-y-1'>
        {sizes.map((size) => (
          <div key={size.id}>
            <span className='font-medium'>{size.size}:</span>{' '}
            {Number(size.price).toLocaleString('vi-VN')}đ
          </div>
        ))}
      </div>
    );
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
  };

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className="text-xl font-semibold">Sản phẩm</h2>
        </div>

        <Button onClick={() => openModal('create')} className='cursor-pointer'>
          <Plus className='w-4 h-4 mr-2' />
          Thêm sản phẩm
        </Button>
      </div>

      <div className='mb-4 flex flex-wrap items-center gap-3'>
        {/* Search */}
        <div className='relative min-w-[220px] flex-1 max-w-sm'>
          <Search className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm sản phẩm...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Filter danh mục */}
        <div className='relative'>
          <Filter className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none' />
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className='pl-9 pr-4 h-10 rounded-md border border-input bg-background text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px] cursor-pointer'
          >
            <option value=''>Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Filter trạng thái */}
        <div className='relative'>
          <Filter className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none' />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className='pl-9 pr-4 h-10 rounded-md border border-input bg-background text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px] cursor-pointer'
          >
            <option value=''>Tất cả trạng thái</option>
            <option value='available'>Đang bán</option>
            <option value='unavailable'>Ngừng bán</option>
          </select>
        </div>

        {/* Reset filters */}
        {(filterCategory || filterStatus || searchQuery) && (
          <button
            onClick={() => { setFilterCategory(''); setFilterStatus(''); setSearchQuery(''); setPage(1); }}
            className='text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors'
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className='bg-card rounded-xl border border-border'>
        {error && (
          <div className='px-4 py-3 text-sm text-red-600 border-b border-red-200 bg-red-50'>
            Không thể tải danh sách sản phẩm. Vui lòng thử lại.
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-[60px]">STT</TableHead>
              <TableHead className="min-w-[200px]">Sản phẩm</TableHead>
              <TableHead className="text-center min-w-[100px]">Mã code</TableHead>
              <TableHead className="text-center min-w-[120px]">Danh mục</TableHead>
              <TableHead className="min-w-[130px]">Kích cỡ & Giá</TableHead>
              <TableHead className="text-center min-w-[120px]">Trạng thái</TableHead>
              <TableHead className="text-center min-w-[200px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-6'>
                  Đang tải...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-6'>
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filteredProducts.map((product, index) => {
                const category = categories.find(
                  (c) => Number(c.id) === Number(product.category_id),
                );

                return (
                  <TableRow key={product.id}>
                    {/* STT */}
                    <TableCell className="text-center font-medium">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </TableCell>

                    {/* PRODUCT */}
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <img
                          src={getThumbnail(product)}
                          alt={product.name}
                          className='w-20 h-20 rounded-xl object-cover bg-secondary shadow-sm border'
                        />
                        <div>
                          <div className='text-sm font-medium'>
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* CODE */}
                    <TableCell className="text-center">
                      <Badge variant='secondary' className='font-mono'>
                        {product.code || 'N/A'}
                      </Badge>
                    </TableCell>

                    {/* CATEGORY */}
                    <TableCell className="text-center">
                      <Badge variant='secondary'>
                        {category?.name || 'Không có'}
                      </Badge>
                    </TableCell>

                    {/* SIZE */}
                    <TableCell>{formatSizes(product.sizes)}</TableCell>

                    {/* STATUS */}
                    <TableCell className="text-center">
                      <Badge
                        className={
                          product.status === 'available'
                            ? 'bg-green-500/10 text-green-700 border-green-500/20'
                            : 'bg-red-500/10 text-red-700 border-red-500/20'
                        }
                      >
                        {product.status === 'available'
                          ? 'Đang bán'
                          : 'Ngừng bán'}
                      </Badge>
                    </TableCell>

                    {/* ACTION */}
                    <TableCell>
                      <div className='flex items-center justify-center gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='cursor-pointer'
                          title="Thêm công thức"
                          onClick={() => openModal('recipe', product)}
                        >
                          Thêm CT
                        </Button>

                        <Button
                          variant='secondary'
                          size='sm'
                          className='cursor-pointer'
                          title="Xem công thức"
                          onClick={() => openModal('view-recipe', product)}
                        >
                          Xem CT
                        </Button>

                        <Button
                          variant='ghost'
                          size='sm'
                          className='cursor-pointer'
                          title="Chỉnh sửa"
                          onClick={() => openModal('update', product)}
                        >
                          <Edit className='w-4 h-4' />
                        </Button>

                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:text-red-600 cursor-pointer'
                          title="Xóa"
                          onClick={() => openModal('delete', product)}
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <PaginationControl
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={pagination.total || 0}
        itemsPerPage={PAGE_SIZE}
        itemName="sản phẩm"
      />

      {modal.type === 'create' && (
        <CreateProduct
          open={true}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            closeModal();
          }}
        />
      )}

      {modal.type === 'update' && (
        <UpdateProduct
          product={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            closeModal();
          }}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteProduct
          product={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            closeModal();
          }}
        />
      )}

      {modal.type === 'recipe' && (
        <AddRecipeModal
          product={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      )}

      {modal.type === 'view-recipe' && (
        <ViewRecipeModal
          product={modal.data}
          open={true}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
