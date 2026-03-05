import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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

  // ✅ Handle create success - thêm vào đầu danh sách
  const handleCreateSuccess = (newCategory) => {
    setData((prev) => {
      if (!prev?.data) {
        return { 
          success: true,
          data: [newCategory] 
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
    <div className='p-6'>
      {/* ===== HEADER ===== */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-semibold mb-1'>Danh mục</h2>
          <p className='text-sm text-muted-foreground'>
            Quản lý danh mục sản phẩm
          </p>
        </div>

        <Button onClick={() => openModal('create')} className={'cursor-pointer'}> 
          <Plus className='w-4 h-4 mr-2' />
          Thêm danh mục
        </Button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className='mb-4'>
        <div className='relative max-w-sm'>
          <Search className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm danh mục...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {/* ===== ERROR ===== */}
      {error && (
        <div className='bg-red-50 text-red-600 px-4 py-3 rounded-md mb-4'>
          Có lỗi xảy ra khi tải dữ liệu
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className='bg-card rounded-xl border border-border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Hình ảnh</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className='text-right'>Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className='text-center py-6'>
                  Đang tải...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='text-center py-6'>
                  Không có danh mục nào
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className='font-medium'>{category.name}</div>
                </TableCell>

                <TableCell>
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className='w-12 h-12 object-cover rounded-md'
                    />
                  ) : (
                    <span className='text-muted-foreground text-sm'>
                      Không có ảnh
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      category.is_deleted === 0
                        ? 'bg-green-500/10 text-green-700 border-green-500/20'
                        : 'bg-red-500/10 text-red-700 border-red-500/20'
                    }
                  >
                    {category.is_deleted === 0 ? 'Hoạt động' : 'Đã xóa'}
                  </Badge>
                </TableCell>

                <TableCell className='text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <Button
                      variant='ghost'
                      className={'cursor-pointer'}
                      size='sm'
                      onClick={() => openModal('update', category) }
                    >
                      <Edit className='w-4 h-4' />
                    </Button>

                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-destructive hover:text-destructive cursor-pointer'
                      onClick={() => openModal('delete', category)}
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