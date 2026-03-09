import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

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

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');


  const [modal, setModal] = useState({
    type: null, // "create" | "update" | "delete" | "recipe"
    data: null,
  });


  const openModal = (type, data = null) => {
    setModal({ type, data });
  };


  const closeModal = () => {
    setModal({ type: null, data: null });
  };

  // Fetch products
  const fetchProducts = useCallback(() => {
    return productService.getAll();
  }, []);

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

  // Fetch Categories
  const fetchCategories = useCallback(() => {
    return categoryService.getAll();
  }, []);

  const { data: categoryResponse } = useFetch(fetchCategories);
  const categories = categoryResponse?.data || [];

  // Search Filter
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.filter((p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  // Helper: Get thumbnail image
  const getThumbnail = (product) => {
    if (!product.images || product.images.length === 0) {
      return '/placeholder-product.png'; // placeholder nếu không có ảnh
    }

    // Tìm ảnh có isThumbnail = 1
    const thumbnail = product.images.find((img) => img.isThumbnail === 1);
    if (thumbnail) return thumbnail.image_url;

    // Fallback: ảnh đầu tiên
    return product.images[0]?.image_url || '/placeholder-product.png';
  };

  // Helper: Format sizes
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

  return (
    <div className='p-6'>
      {/* ===== HEADER ===== */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl mb-1'>Sản phẩm</h2>
          <p className='text-sm text-muted-foreground'>
            Quản lý sản phẩm quán cà phê
          </p>
        </div>

        <Button onClick={() => openModal('create')} className='cursor-pointer'>
          <Plus className='w-4 h-4 mr-2' />
          Thêm sản phẩm
        </Button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className='mb-4'>
        <div className='relative max-w-sm'>
          <Search className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm sản phẩm...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className='bg-card rounded-xl border border-border'>
        {error && (
          <div className='px-4 py-3 text-sm text-red-600 border-b border-red-200 bg-red-50'>
            Không thể tải danh sách sản phẩm. Vui lòng thử lại.
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Kích cỡ & Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className='text-right'>Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6'>
                  Đang tải...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6'>
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filteredProducts.map((product) => {
                const category = categories.find(
                  (c) => c.id === product.category_id,
                );

                return (
                  <TableRow key={product.id}>
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
                          {product.description && (
                            <div className='text-xs text-muted-foreground line-clamp-1 max-w-[200px]'>
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant='secondary'>
                        {category?.name || 'Không có'}
                      </Badge>
                    </TableCell>

                    <TableCell>{formatSizes(product.sizes)}</TableCell>

                    <TableCell>
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

                    <TableCell className='text-right'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='cursor-pointer'
                          onClick={() => openModal('recipe', product)}
                        >
                          Thêm công thức
                        </Button>
                        <Button
                          variant='secondary'
                          size='sm'
                          className='cursor-pointer'
                          onClick={() => openModal('view-recipe', product)}
                        >
                          Xem công thức
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className={'cursor-pointer'}
                          onClick={() => openModal('update', product)}
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive cursor-pointer'
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

      {/* ===== MODALS ===== */}
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
          onSuccess={refetch}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteProduct
          product={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
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
