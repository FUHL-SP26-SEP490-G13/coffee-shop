import React, { useState, useEffect } from 'react';
import { Loader2, Edit, X } from 'lucide-react';
import attendanceService from '../../../services/attendanceService';
import userService from '../../../services/userService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import PaginationControl from '../../../components/common/PaginationControl';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';

const CHECKOUT_GRACE_MINUTES = 30;

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';

  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const parts = timeStr.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN');
};

const getStatusInfo = (status) => {
  switch (status) {
    case 'present':
      return {
        label: 'Đúng giờ',
        color: 'bg-green-500/10 text-green-700 border-green-500/20',
      };
    case 'late':
      return {
        label: 'Đi muộn',
        color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
      };
    case 'absent':
      return {
        label: 'Vắng mặt',
        color: 'bg-red-500/10 text-red-700 border-red-500/20',
      };
    default:
      return {
        label: status || 'N/A',
        color: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
      };
  }
};

const buildShiftEnd = (shiftDateStr, startTime, endTime) => {
  const shiftEnd = new Date(shiftDateStr);

  const normalizedStart = String(startTime).slice(0, 5);
  const normalizedEnd = String(endTime).slice(0, 5);

  const [endHour, endMinute] = normalizedEnd.split(':').map(Number);
  shiftEnd.setHours(endHour, endMinute, 0, 0);

  // Ca qua đêm: ví dụ 23:00 -> 03:00
  if (normalizedEnd <= normalizedStart) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  return shiftEnd;
};

const shouldShowMissingCheckout = (record) => {
  try {
    if (!record?.check_in || record?.check_out) {
      return false;
    }

    if (!record?.shift_date || !record?.start_time || !record?.end_time) {
      return false;
    }

    const shiftEnd = buildShiftEnd(
      record.shift_date,
      record.start_time,
      record.end_time
    );

    const shiftEndWithGrace = new Date(
      shiftEnd.getTime() + CHECKOUT_GRACE_MINUTES * 60 * 1000
    );

    return new Date() > shiftEndWithGrace;
  } catch (error) {
    return false;
  }
};

export default function AdminAttendance() {
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const USERS_PER_PAGE = 8;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setUserFilter('all');
  };

  const applyQuickDate = (type) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];

    if (type === 'today') {
      setStartDate(fmt(today));
      setEndDate(fmt(today));
    } else if (type === '7days') {
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      setStartDate(fmt(from));
      setEndDate(fmt(today));
    } else if (type === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmt(from));
      setEndDate(fmt(today));
    }
  };

  const hasActiveFilters =
    startDate || endDate || statusFilter !== 'all' || userFilter !== 'all';

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userService.getAllUsers();
        if (res.success) {
          setUsers(
            res.data.filter(
              (u) => u.role_id !== 1 && u.role_id !== 4 && u.role_id !== 5
            )
          );
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách nhân viên:', err);
      }
    };

    fetchUsers();
  }, []);

  const fetchAttendances = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page: currentPage,
        limit: USERS_PER_PAGE,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (userFilter !== 'all') params.userId = userFilter;

      const res = await attendanceService.getAll(params);

      if (res.success) {
        setAttendances(res.data?.data || []);
        setTotalPages(res.data?.pagination?.totalPages || 1);
        setTotalItems(res.data?.pagination?.total || 0);
      } else {
        setError(res.message || 'Không thể lấy dữ liệu điểm danh');
      }
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi kết nối với máy chủ');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [currentPage, startDate, endDate, statusFilter, userFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter, userFilter]);

  const handleEditNote = (record) => {
    setSelectedRecord(record);
    setNoteContent(record.note || '');
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedRecord) return;

    setIsUpdating(true);
    try {
      const res = await attendanceService.updateAttendance(
        selectedRecord.id,
        noteContent
      );

      if (res.success) {
        toast.success('Cập nhật ghi chú thành công');
        setIsNoteDialogOpen(false);

        setAttendances((prev) =>
          prev.map((a) =>
            a.id === selectedRecord.id ? { ...a, note: noteContent } : a
          )
        );
      } else {
        toast.error(res.message || 'Lỗi cập nhật ghi chú');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật ghi chú');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && attendances.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center p-6 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Điểm danh nhân viên</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi, quản lý lịch sử ra vào ca của nhân viên.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">
            Nhanh:
          </span>

          {[
            { label: 'Hôm nay', key: 'today' },
            { label: '7 ngày qua', key: '7days' },
            { label: 'Tháng này', key: 'month' },
          ].map(({ label, key }) => (
            <button
              key={key}
              onClick={() => applyQuickDate(key)}
              className="px-3 py-1 text-xs rounded-full border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors font-medium"
            >
              {label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 px-3 py-1 text-xs rounded-full border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 transition-colors font-medium"
            >
              <X className="w-3 h-3" /> Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-[145px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-[145px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Trạng thái
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[145px] h-9">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="present">Đúng giờ</SelectItem>
                <SelectItem value="late">Đi muộn</SelectItem>
                <SelectItem value="absent">Vắng mặt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Nhân viên
            </label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[190px] h-9">
                <SelectValue placeholder="Nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.first_name} {u.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center text-red-500">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Ngày</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Ca làm việc</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="w-[80px] text-center">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {attendances.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy bản ghi điểm danh nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendances.map((record) => {
                    const statusInfo = getStatusInfo(record.status);
                    const isMissingCheckout = shouldShowMissingCheckout(record);

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.shift_date)}
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-primary">
                            {record.first_name} {record.last_name}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {record.shift_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(record.start_time)} -{' '}
                              {formatTime(record.end_time)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                          {record.check_in ? formatTime(record.check_in) : '--:--'}
                        </TableCell>

                        <TableCell className="font-medium">
                          {record.check_out ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatTime(record.check_out)}
                            </span>
                          ) : isMissingCheckout ? (
                            <span className="text-red-500 font-bold">
                              Missing Checkout
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              --:--
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>

                        <TableCell
                          className="max-w-[150px] truncate"
                          title={record.note}
                        >
                          {record.note || '-'}
                        </TableCell>

                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditNote(record)}
                            title="Chỉnh sửa ghi chú"
                          >
                            <Edit className="w-4 h-4 text-blue-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!isLoading && attendances.length > 0 && (
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={USERS_PER_PAGE}
          itemName="bản ghi"
        />
      )}

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ghi chú điểm danh</DialogTitle>
            <DialogDescription>
              Thêm hoặc chỉnh sửa ghi chú cho bản ghi điểm danh này.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {selectedRecord && (
              <div className="mb-4 bg-muted/50 p-3 rounded-lg text-sm">
                <p>
                  <strong>Nhân viên:</strong> {selectedRecord.first_name}{' '}
                  {selectedRecord.last_name}
                </p>
                <p>
                  <strong>Ngày:</strong> {formatDate(selectedRecord.shift_date)}
                </p>
                <p>
                  <strong>Ca:</strong> {selectedRecord.shift_name} (
                  {formatTime(selectedRecord.start_time)} -{' '}
                  {formatTime(selectedRecord.end_time)})
                </p>
                <p>
                  <strong>Check-in:</strong>{' '}
                  {selectedRecord.check_in
                    ? formatTime(selectedRecord.check_in)
                    : 'Trống'}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="note">Nội dung ghi chú</Label>
              <Input
                id="note"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ví dụ: Đi muộn do kẹt xe..."
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNoteDialogOpen(false)}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveNote} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}