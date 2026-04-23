import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import PaginationControl from '../../components/common/PaginationControl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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
      return { label: 'Đúng giờ', color: 'bg-green-500/10 text-green-700 border-green-500/20' };
    case 'late':
      return { label: 'Đi muộn', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
    case 'absent':
      return { label: 'Vắng mặt', color: 'bg-red-500/10 text-red-700 border-red-500/20' };
    default:
      return { label: status || 'N/A', color: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
  }
};

const buildShiftEnd = (shiftDateStr, startTime, endTime) => {
  const shiftEnd = new Date(shiftDateStr);

  const normalizedStart = String(startTime).slice(0, 5);
  const normalizedEnd = String(endTime).slice(0, 5);

  const [endHour, endMinute] = normalizedEnd.split(':').map(Number);
  shiftEnd.setHours(endHour, endMinute, 0, 0);

  // Ca qua đêm, ví dụ 23:00 -> 03:00
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

export default function PersonalAttendanceList() {
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(8);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
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

  const hasActiveFilters = startDate || endDate || statusFilter !== 'all';

  const fetchAttendances = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await attendanceService.getMyAttendance(params);
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
  }, [currentPage, startDate, endDate, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter]);

  if (isLoading && attendances.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center p-6 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Lịch sử điểm danh</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xem lại lịch sử điểm danh các ca làm việc của bạn.
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
            <label className="text-xs font-medium text-muted-foreground">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-[145px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-[145px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Trạng thái</label>
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
        </div>
      </div>

      {error ? (
        <div className="p-6 text-center text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hidden md:table-row">
                  <TableHead className="w-[120px]">Ngày</TableHead>
                  <TableHead className="w-[160px]">Ca làm việc</TableHead>
                  <TableHead>Giờ quy định</TableHead>
                  <TableHead>Giờ Check-in</TableHead>
                  <TableHead>Giờ Check-out</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {attendances.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Không có bản ghi điểm danh nào trong khoảng thời gian này.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendances.map((record) => {
                    const statusInfo = getStatusInfo(record.status);
                    const isMissingCheckout = shouldShowMissingCheckout(record);

                    return (
                      <TableRow key={record.id} className="group hover:bg-muted/50">
                        <TableCell className="font-medium hidden md:table-cell">
                          {formatDate(record.shift_date)}
                        </TableCell>

                        <TableCell className="hidden md:table-cell font-semibold text-primary">
                          {record.shift_name}
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatTime(record.start_time)} - {formatTime(record.end_time)}
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          {record.check_in ? (
                            <div className="flex items-center gap-1.5 font-medium">
                              {formatTime(record.check_in)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Chưa check-in</span>
                          )}
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          {record.check_out ? (
                            <div className="flex items-center gap-1.5 font-medium">
                              {formatTime(record.check_out)}
                            </div>
                          ) : isMissingCheckout ? (
                            <span className="text-red-500 font-bold">Missing Check-out</span>
                          ) : (
                            <span className="text-muted-foreground italic">Chưa check-out</span>
                          )}
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>

                        <TableCell
                          className="hidden md:table-cell max-w-[200px] truncate"
                          title={record.note}
                        >
                          {record.note || '-'}
                        </TableCell>

                        <TableCell className="md:hidden block p-4">
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex justify-between items-center w-full">
                              <div>
                                <span className="font-bold text-lg text-primary">
                                  {record.shift_name}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({formatDate(record.shift_date)})
                                </span>
                              </div>

                              <Badge variant="outline" className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                            </div>

                            <div className="flex justify-between text-sm bg-muted/30 p-2.5 rounded-lg border border-border/50">
                              <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                                  Giờ quy định
                                </span>
                                <span>
                                  {formatTime(record.start_time)} - {formatTime(record.end_time)}
                                </span>
                              </div>

                              <div className="flex flex-col items-center border-l border-r border-border/50 px-4">
                                <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                                  Check-in
                                </span>
                                <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                                  {record.check_in ? formatTime(record.check_in) : '--:--'}
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                                  Check-out
                                </span>
                                <div className="flex items-center gap-1 font-medium">
                                  {record.check_out ? (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      {formatTime(record.check_out)}
                                    </span>
                                  ) : isMissingCheckout ? (
                                    <span className="text-red-500 font-bold">
                                      Missing Checkout
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">--:--</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {record.note && (
                              <div className="text-sm border-t border-border/50 pt-2 text-muted-foreground italic">
                                <span className="font-medium not-italic text-foreground mr-1">
                                  Ghi chú:
                                </span>
                                {record.note}
                              </div>
                            )}
                          </div>
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
          itemsPerPage={itemsPerPage}
          itemName="bản ghi"
        />
      )}
    </div>
  );
}