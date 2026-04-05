
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import toppingService from '../../../services/toppingService';
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
import PaginationControl from '../../../components/common/PaginationControl';
import CreateTopping from './Action/CreateTopping';
import UpdateTopping from './Action/UpdateTopping';
import DeleteTopping from './Action/DeleteTopping';

export default function AdminToppings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });

  const openModal = (type, data = null) => setModal({ type, data });
  const closeModal = () => setModal({ type: null, data: null });

  // Fetch toppings
  const fetchToppings = useCallback(() => {
    return toppingService.getAll();
  }, []);

  const {
    data: response,
    loading,
    error,
    execute: refetch,
  } = useFetch(fetchToppings);

  const toppings = response?.data?.filter((t) => t.is_deleted === 0) || [];

  // Search Filter
  const filteredToppings = useMemo(() => {
    if (!Array.isArray(toppings)) return [];
    return toppings.filter((t) =>
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [toppings, searchQuery]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(filteredToppings.length / PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredToppings.length, totalPages, currentPage]);

  const currentToppings = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredToppings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredToppings, currentPage]);

  return (
    <div className='p-6'>
      {/* ===== HEADER ===== */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className="text-xl font-semibold">Topping</h2>
        </div>
        <Button onClick={() => openModal('create')} className='cursor-pointer'>
          <Plus className='w-4 h-4 mr-2' />
          Thêm topping
        </Button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className='mb-4'>
        <div className='relative max-w-sm'>
          <Search className='absolute left-3 top-2.5 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Tìm kiếm topping...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className='bg-card rounded-xl border border-border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-16'>STT</TableHead>
              <TableHead>Tên topping</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className='text-right'>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6'>Đang tải...</TableCell>
              </TableRow>
            )}
            {!loading && filteredToppings.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-6'>Không có topping nào</TableCell>
              </TableRow>
            )}
            {!loading && currentToppings.map((topping, idx) => (
              <TableRow key={topping.id}>
                <TableCell>{(currentPage - 1) * PAGE_SIZE + idx + 1}</TableCell>
                <TableCell>{topping.name}</TableCell>
                <TableCell>{Number(topping.price).toLocaleString('vi-VN')}đ</TableCell>
                <TableCell>
                  <span className={topping.is_active ? 'text-green-600' : 'text-red-600'}>
                    {topping.is_active ? 'Hoạt động' : 'Ẩn'}
                  </span>
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <Button variant='ghost' size='sm' className='cursor-pointer' onClick={() => openModal('update', topping)}>
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button variant='ghost' size='sm' className='text-destructive cursor-pointer' onClick={() => openModal('delete', topping)}>
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControl
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredToppings.length}
        itemsPerPage={PAGE_SIZE}
        itemName="topping"
      />

      {/* ===== MODALS ===== */}
      {modal.type === 'create' && (
        <CreateTopping
          open={true}
          onClose={closeModal}
          onSuccess={() => {
            refetch();
            closeModal();
          }}
        />
      )}

      {modal.type === 'update' && (
        <UpdateTopping
          topping={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteTopping
          topping={modal.data}
          open={true}
          onClose={closeModal}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
