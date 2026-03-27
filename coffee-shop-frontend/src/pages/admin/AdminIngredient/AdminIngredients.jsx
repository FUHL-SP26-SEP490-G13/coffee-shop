import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import ingredientService from '../../../services/ingredientService';
import useFetch from '../../../hooks/useFetch';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

import CreateIngredient from './Action/CreateIngredient';
import UpdateIngredient from './Action/UpdateIngredient';
import DeleteIngredient from './Action/DeleteIngredient';

export default function AdminIngredients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const fetchIngredients = useCallback(() => {
    return ingredientService.getAll();
  }, []);

  const {
    data: response,
    loading,
    error,
    execute: refetch,
    setData,
  } = useFetch(fetchIngredients);

  const ingredients = response?.data?.filter((c) => c.is_deleted === 0) || [];

  const filteredIngredients = useMemo(() => {
    if (!Array.isArray(ingredients)) return [];

    return ingredients.filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [ingredients, searchQuery]);

  // Reset page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE);

  const paginatedIngredients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredIngredients.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredIngredients, currentPage]);

  const handleCreateSuccess = (newIngredient) => {
    setData((prev) => {
      if (!prev?.data) {
        return {
          success: true,
          data: [newIngredient],
        };
      }
      return {
        ...prev,
        data: [newIngredient, ...prev.data],
      };
    });
  };

  return (
    <div className='p-6'>
      {/* ===== HEADER ===== */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-semibold mb-1 flex items-center gap-2'>
            <Package className="w-6 h-6 text-primary" />
            Nguyên liệu
          </h2>
          <p className='text-sm text-muted-foreground'>
            Quản lý nguyên liệu pha chế
          </p>
        </div>

        <Button
          onClick={() => openModal('create')}
          className={'cursor-pointer'}
        >
          <Plus className='w-4 h-4 mr-2' />
          Thêm nguyên liệu
        </Button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className='mb-4'>
        <div className='relative max-w-sm'>
          <Search className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm nguyên liệu...'
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
              <TableHead>Tên nguyên liệu</TableHead>
              <TableHead>Loại đơn vị</TableHead>
              <TableHead>Đơn vị</TableHead>
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

            {!loading && filteredIngredients.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='text-center py-6'>
                  Không có nguyên liệu nào
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              paginatedIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <div className='font-medium'>{ingredient.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className='text-muted-foreground'>{ingredient.unit_type}</div>
                  </TableCell>
                  <TableCell>
                    <div className='text-muted-foreground'>{ingredient.unit}</div>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='ghost'
                        className={'cursor-pointer'}
                        size='sm'
                        onClick={() => openModal('update', ingredient)}
                      >
                        <Edit className='w-4 h-4' />
                      </Button>

                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive cursor-pointer'
                        onClick={() => openModal('delete', ingredient)}
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
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} đến{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredIngredients.length)} trong tổng số{' '}
            {filteredIngredients.length} nguyên liệu
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <div className="text-sm font-medium">
              Trang {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* ===== MODALS ===== */}
      {modal.type === 'create' && (
        <CreateIngredient
          open={true}
          onClose={closeModal}
          onSuccess={handleCreateSuccess}
        />
      )}

      {modal.type === 'update' && (
        <UpdateIngredient
          ingredient={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteIngredient
          ingredient={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
