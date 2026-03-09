import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
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

import CreateCategory from './Action/CreateCategory';
import UpdateCategory from './Action/UpdateCategory';
import DeleteCategory from './Action/DeleteCategory';

export default function AdminCategories() {
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchCategories = useCallback(() => {
    return categoryService.getAll();
  }, []);

  const {
    data: response,
    loading,
    error,
    execute: refetch,
    setData,
  } = useFetch(fetchCategories);

  const categories = response?.data?.filter((c) => c.is_deleted === 0) || [];

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categories, searchQuery]);

  // Handle create success - thêm vào đầu danh sách
  const handleCreateSuccess = (newCategory) => {
    setData((prev) => {
      if (!prev?.data) {
        return {
          success: true,
          data: [newCategory],
        };
      }

      // Thêm vào đầu danh sách
      return {
        ...prev,
        data: [newCategory, ...prev.data],
      };
    });
  };

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      {/* ===== HEADER ===== */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight mb-1'>Danh mục</h2>
          <p className='text-base text-muted-foreground'>
            Quản lý các danh mục sản phẩm của bạn.
          </p>
        </div>

        <Button onClick={() => openModal('create')} className='cursor-pointer shadow-sm'>
          <Plus className='w-5 h-5 mr-2' />
          Thêm danh mục
        </Button>
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <div className='flex items-center mb-6'>
        <div className='relative w-full max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm theo tên danh mục...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 h-11 text-base shadow-sm'
          />
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className='bg-red-50/50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6'>
          Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className='bg-card rounded-xl border border-border shadow-sm overflow-hidden'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              {/* Đã set width cố định cho các cột để không bị co giãn lộn xộn */}
              <TableHead className='w-[40%] text-base font-semibold py-4'>Tên danh mục</TableHead>
              <TableHead className='w-[20%] text-base font-semibold py-4'>Mã Code</TableHead>
              <TableHead className='w-[20%] text-base font-semibold py-4'>Hình ảnh</TableHead>
              <TableHead className='w-[20%] text-base font-semibold py-4 text-right pr-6'>Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className='text-center py-12 text-muted-foreground text-base'>
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='text-center py-12 text-muted-foreground text-base'>
                  Không tìm thấy danh mục nào.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filteredCategories.map((category) => (
                <TableRow key={category.id} className='hover:bg-muted/30 transition-colors'>
                  {/* Tên danh mục */}
                  <TableCell className='py-4'>
                    <span className='text-base font-medium text-foreground'>
                      {category.name}
                    </span>
                  </TableCell>

                  <TableCell className='py-4'>
                    <Badge variant='secondary' className='text-sm px-2.5 py-1 font-mono'>
                      {category.code || 'N/A'}
                    </Badge>
                  </TableCell>

                  {/* Hình ảnh: Tăng size, thêm viền và icon placeholder nếu lỗi/không có ảnh */}
                  <TableCell className='py-4'>
                    {category.image_url ? (
                      <div className='w-16 h-16 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center'>
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className='w-full h-full object-cover'
                          loading='lazy'
                        />
                      </div>
                    ) : (
                      <div className='w-16 h-16 rounded-lg border border-dashed bg-muted/10 flex flex-col items-center justify-center text-muted-foreground'>
                        <ImageIcon className='w-6 h-6 mb-1 opacity-50' />
                        <span className='text-[10px] font-medium'>No image</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Hành động */}
                  <TableCell className='py-4 pr-6 text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-9 w-9 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors'
                        onClick={() => openModal('update', category)}
                        title='Chỉnh sửa'
                      >
                        <Edit className='w-4 h-4' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-9 w-9 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors'
                        onClick={() => openModal('delete', category)}
                        title='Xóa'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* ===== MODALS ===== */}
      {modal.type === 'create' && (
        <CreateCategory
          open={true}
          onClose={closeModal}
          onSuccess={handleCreateSuccess}
        />
      )}

      {modal.type === 'update' && (
        <UpdateCategory
          category={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteCategory
          category={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}