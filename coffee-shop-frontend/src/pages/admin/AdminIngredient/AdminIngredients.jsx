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
import PaginationControl from '../../../components/common/PaginationControl';

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
          <h1 className="text-xl font-semibold mb-1">Quản lý nguyên liệu</h1>
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
              <TableHead className='w-16'>STT</TableHead>
              <TableHead>Tên nguyên liệu</TableHead>
              <TableHead>Loại đơn vị</TableHead>
              <TableHead>Đơn vị</TableHead>
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

            {!loading && filteredIngredients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6'>
                  Không có nguyên liệu nào
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              paginatedIngredients.map((ingredient, index) => (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                  </TableCell>
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
      {!loading && (
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredIngredients.length}
          itemsPerPage={ITEMS_PER_PAGE}
          itemName="nguyên liệu"
        />
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
