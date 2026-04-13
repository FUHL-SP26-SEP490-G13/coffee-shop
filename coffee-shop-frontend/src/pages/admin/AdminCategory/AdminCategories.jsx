import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCategories = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, validCurrentPage, itemsPerPage]);

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
    <div className='p-6'>
      {/* ===== HEADER ===== */}

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className="text-xl font-semibold">Danh mục</h2>
        </div>

        <Button
          onClick={() => openModal('create')}
          className={'cursor-pointer'}
        >
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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
              <TableHead className="text-center w-[60px]">STT</TableHead>
              <TableHead className="min-w-[180px]">Tên danh mục</TableHead>
              <TableHead className="text-center min-w-[120px]">Mã Code</TableHead>
              <TableHead className="text-center min-w-[120px]">Loại</TableHead>
              <TableHead className="text-center min-w-[120px]">Hình ảnh</TableHead>
              <TableHead className="text-center min-w-[140px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-6'>
                  Đang tải...
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-6'>
                  Không có danh mục nào
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              paginatedCategories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell className="text-center font-medium">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>

                  <TableCell>
                    <div className='font-medium'>{category.name}</div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className='font-medium'>{category.code}</div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant={category.type ? 'secondary' : 'outline'}>{category.type || 'N/A'}</Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className='w-12 h-12 object-cover rounded-md mx-auto'
                      />
                    ) : (
                      <span className='text-muted-foreground text-sm'>
                        Không có ảnh
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className='flex items-center justify-center gap-1'>
                      <Button
                        variant='ghost'
                        className={'cursor-pointer'}
                        size='sm'
                        title="Chỉnh sửa"
                        onClick={() => openModal('update', category)}
                      >
                        <Edit className='w-4 h-4' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-red-600 cursor-pointer'
                        title="Xóa"
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

      {/* ===== PAGINATION ===== */}
      {!loading && filteredCategories.length > 0 && (
        <div className='flex items-center justify-between mt-4 px-2'>
          <p className='text-sm text-muted-foreground'>
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
            {Math.min(currentPage * itemsPerPage, filteredCategories.length)} trong số{' '}
            {filteredCategories.length} danh mục
          </p>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className='cursor-pointer'
            >
              <ChevronLeft className='w-4 h-4 mr-1' /> Trước
            </Button>

            <div className='text-sm font-medium'>
              Trang {currentPage} / {totalPages}
            </div>

            <Button
              variant='outline'
              size='sm'
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className='cursor-pointer'
            >
              Sau <ChevronRight className='w-4 h-4 ml-1' />
            </Button>
          </div>
        </div>
      )}

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
