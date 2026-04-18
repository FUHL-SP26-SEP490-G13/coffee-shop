import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, ChevronLeft, ChevronRight, Plus, Users, Key } from 'lucide-react';
import userService from '../../../services/userService';
import { Badge } from '../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import PaginationControl from '../../../components/common/PaginationControl';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [activeTab, setActiveTab] = useState('2');
  const [statusFilter, setStatusFilter] = useState('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    role_id: '2',
  });
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinDialogUser, setPinDialogUser] = useState(null);
  const [generatedPin, setGeneratedPin] = useState('');
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [isConfirmPinOpen, setIsConfirmPinOpen] = useState(false);
  const [confirmPinUser, setConfirmPinUser] = useState(null);
  const USERS_PER_PAGE = 10;

  const normalizePhoneNumber = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('84') && digits.length >= 11) {
      return `0${digits.slice(2)}`;
    }
    if (digits.length === 9) return `0${digits}`;
    return digits;
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.message || 'Không thể tải danh sách người dùng');
      }
    } catch (err) {
      setError('Lỗi kết nối đến máy chủ');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateChange = (field, value) => {
    setCreateError('');
    setCreateForm((prev) => {
      const nextForm = { ...prev, [field]: value };
      const fieldError = validateCreateField(field, value);

      setCreateFieldErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        if (fieldError) {
          nextErrors[field] = fieldError;
        } else {
          delete nextErrors[field];
        }
        return nextErrors;
      });

      return nextForm;
    });
  };

  const validateCreateField = (field, value) => {
    const normalizedValue = String(value || '').trim();

    switch (field) {
      case 'first_name':
        if (!normalizedValue) return 'Họ không được để trống';
        return '';
      case 'last_name':
        if (!normalizedValue) return 'Tên không được để trống';
        return '';
      case 'email':
        if (!normalizedValue) return 'Email không được để trống';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
          return 'Email không hợp lệ';
        }
        return '';
      case 'phone': {
        if (!normalizedValue) return 'Số điện thoại không được để trống';
        const normalizedPhone = normalizePhoneNumber(normalizedValue);
        if (!/^[0-9]{10,11}$/.test(normalizedPhone)) {
          return 'Số điện thoại phải có 10-11 chữ số';
        }
        return '';
      }
      case 'username':
        if (!normalizedValue) return 'Username không được để trống';
        return '';
      case 'role_id':
        if (!['2', '3'].includes(String(value))) return 'Vai trò không hợp lệ';
        return '';
      default:
        return '';
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    const fields = ['first_name', 'last_name', 'email', 'phone', 'username', 'role_id'];

    fields.forEach((field) => {
      const fieldError = validateCreateField(field, createForm[field]);
      if (fieldError) {
        errors[field] = fieldError;
      }
    });

    setCreateFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetCreateForm = () => {
    setCreateForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      username: '',
      role_id: '2',
    });
    setCreateFieldErrors({});
    setCreateError('');
  };

  const handleCreateStaff = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!validateCreateForm()) {
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim(),
        phone: normalizePhoneNumber(createForm.phone),
        username: createForm.username.trim(),
        role_id: parseInt(createForm.role_id, 10),
      };

      const response = await userService.createStaff(payload);
      if (response.success) {
        await fetchUsers();
        setIsCreateOpen(false);
        resetCreateForm();
      } else {
        setCreateError(response.message || 'Không thể tạo nhân viên');
      }
    } catch (err) {
      setCreateError(err.message || 'Lỗi kết nối đến máy chủ');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusToggle = (user) => {
    setSelectedUser(user);
    setPassword('');
    setPasswordError('');
    setIsPasswordOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return;
    }

    setIsTogglingStatus(true);
    setPasswordError('');

    try {
      const response = await userService.toggleUserStatus(
        selectedUser.id,
        selectedUser.isActive,
        password
      );

      if (response.success) {
        const isDeactivating = selectedUser?.isActive === 1;

        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === selectedUser.id
              ? { ...u, isActive: u.isActive === 1 ? 0 : 1 }
              : u
          )
        );

        if (isDeactivating) {
          toast.success('Đã tạm khóa người dùng thành công');
        }

        setIsPasswordOpen(false);
        setSelectedUser(null);
        setPassword('');
      } else {
        setPasswordError(response.message || 'Có lỗi xảy ra khi thay đổi trạng thái');
      }
    } catch (err) {
      setPasswordError(err.message || 'Mật khẩu không chính xác hoặc có lỗi xảy ra');
      console.error(err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleGeneratePinClick = (user) => {
    setConfirmPinUser(user);
    setIsConfirmPinOpen(true);
  };

  const handleConfirmGeneratePin = async () => {
    if (!confirmPinUser) return;
    setIsGeneratingPin(true);
    try {
      const response = await userService.generatePin(confirmPinUser.id);
      if (response.success) {
        setPinDialogUser(confirmPinUser);
        setGeneratedPin(response.data.pin_code);
        setIsConfirmPinOpen(false);
        setIsPinDialogOpen(true);
        toast.success(`Đã tạo mã PIN mới cho ${confirmPinUser.first_name} ${confirmPinUser.last_name}`);
      } else {
        toast.error(response.message || 'Lỗi tạo mã PIN');
      }
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo mã PIN');
    } finally {
      setIsGeneratingPin(false);
    }
  };

  const getRoleInfo = (roleId) => {
    switch (Number(roleId)) {
      case 1:
        return { label: 'Quản lý', className: 'bg-red-500/10 text-red-700 border-red-500/20' };
      case 2:
        return { label: 'Phục vụ', className: 'bg-blue-500/10 text-blue-700 border-blue-500/20' };
      case 3:
        return { label: 'Pha chế', className: 'bg-orange-500/10 text-orange-700 border-orange-500/20' };
      case 4:
        return { label: 'Khách hàng', className: 'bg-green-500/10 text-green-700 border-green-500/20' };
      default:
        return { label: 'Unknown', className: 'bg-gray-500/10 text-gray-700 border-gray-500/20' };
    }
  };

  // Lọc và sắp xếp người dùng
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Loại bỏ admin (role_id = 1)
    result = result.filter(user => Number(user.role_id) !== 1);

    // Lọc theo tab (role)
    result = result.filter(user => Number(user.role_id) === Number(activeTab));

    // Tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return (
          fullName.includes(query) ||
          user.username?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phone?.includes(query)
        );
      });
    }

    // Lọc theo trạng thái
    if (statusFilter === '1') {
      result = result.filter(user => user.isActive === 1);
    } else if (statusFilter === '0') {
      result = result.filter(user => user.isActive === 0);
    }

    // Sắp xếp theo tên
    result.sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();

      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB, 'vi');
      } else {
        return nameB.localeCompare(nameA, 'vi');
      }
    });

    return result;
  }, [users, searchQuery, activeTab, statusFilter, sortOrder]);

  // Tính toán dữ liệu phân trang
  const totalPages = Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  // Reset về trang 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, statusFilter, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Error: {error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Quản lý người dùng</h1>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto hover:bg-amber-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="2">Phục vụ</TabsTrigger>
          <TabsTrigger value="3">Pha chế</TabsTrigger>
          <TabsTrigger value="4">Khách hàng</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {/* Bộ lọc và tìm kiếm */}
          <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-4">
            {/* Tìm kiếm */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lọc theo trạng thái */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoạt động</SelectItem>
                <SelectItem value="0">Tạm khóa</SelectItem>
              </SelectContent>
            </Select>

            {/* Sắp xếp theo tên */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Tên A-Z</SelectItem>
                <SelectItem value="desc">Tên Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-16'>STT</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead className='w-24 text-center'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy người dùng nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const roleInfo = getRoleInfo(user.role_id);
                      const fullName = `${user.first_name} ${user.last_name}`;
                      const stt = (currentPage - 1) * USERS_PER_PAGE + index + 1;

                      return (
                        <TableRow key={user.id}>
                          <TableCell>{stt}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {user.last_name ? user.last_name[0].toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{fullName}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={roleInfo.className}
                            >
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={user.isActive === 1}
                                onCheckedChange={() => handleStatusToggle(user)}
                              />
                              {user.role_id !== 4 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleGeneratePinClick(user)}
                                  title="Cấp lại mã PIN"
                                  disabled={isGeneratingPin || user.isActive === 0}
                                >
                                  <Key className="h-4 w-4 text-blue-500" />
                                </Button>
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

          {/* Phân trang */}
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAndSortedUsers.length}
            itemsPerPage={USERS_PER_PAGE}
            itemName="người dùng"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          resetCreateForm();
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm nhân viên</DialogTitle>
            <DialogDescription>
              Mật khẩu sẽ được tạo ngẫu nhiên và gửi đến email đã nhập.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCreateStaff}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staffFirstName">Họ</Label>
                <Input
                  id="staffFirstName"
                  value={createForm.first_name}
                  onChange={(e) => handleCreateChange('first_name', e.target.value)}
                  className={createFieldErrors.first_name ? 'border-destructive' : ''}
                />
                {createFieldErrors.first_name && (
                  <p className="text-xs text-destructive">{createFieldErrors.first_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffLastName">Tên</Label>
                <Input
                  id="staffLastName"
                  value={createForm.last_name}
                  onChange={(e) => handleCreateChange('last_name', e.target.value)}
                  className={createFieldErrors.last_name ? 'border-destructive' : ''}
                />
                {createFieldErrors.last_name && (
                  <p className="text-xs text-destructive">{createFieldErrors.last_name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffEmail">Email</Label>
                <Input
                  id="staffEmail"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => handleCreateChange('email', e.target.value)}
                  className={createFieldErrors.email ? 'border-destructive' : ''}
                />
                {createFieldErrors.email && (
                  <p className="text-xs text-destructive">{createFieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffPhone">Số điện thoại</Label>
                <Input
                  id="staffPhone"
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => handleCreateChange('phone', e.target.value)}
                  className={createFieldErrors.phone ? 'border-destructive' : ''}
                />
                {createFieldErrors.phone && (
                  <p className="text-xs text-destructive">{createFieldErrors.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffUsername">Username</Label>
                <Input
                  id="staffUsername"
                  value={createForm.username}
                  onChange={(e) => handleCreateChange('username', e.target.value)}
                  className={createFieldErrors.username ? 'border-destructive' : ''}
                />
                {createFieldErrors.username && (
                  <p className="text-xs text-destructive">{createFieldErrors.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Vai trò</Label>
                <Select value={createForm.role_id} onValueChange={(value) => handleCreateChange('role_id', value)}>
                  <SelectTrigger className={createFieldErrors.role_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Phục vụ</SelectItem>
                    <SelectItem value="3">Pha chế</SelectItem>
                  </SelectContent>
                </Select>
                {createFieldErrors.role_id && (
                  <p className="text-xs text-destructive">{createFieldErrors.role_id}</p>
                )}
              </div>
            </div>

            {createError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {createError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                Hủy
              </Button>
              <Button type="submit" disabled={isCreating} className="hover:bg-amber-600 text-white">
                {isCreating ? 'Đang tạo...' : 'Tạo nhân viên'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={(open) => {
        setIsPasswordOpen(open);
        if (!open) {
          setPassword('');
          setPasswordError('');
          setSelectedUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Bạn đang thay đổi trạng thái của <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> từ{' '}
                  <strong>{selectedUser.isActive === 1 ? 'Hoạt động' : 'Tạm khóa'}</strong> sang{' '}
                  <strong>{selectedUser.isActive === 1 ? 'Tạm khóa' : 'Hoạt động'}</strong>.
                  <br />
                  Vui lòng nhập mật khẩu để xác nhận.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmStatusChange();
                  }
                }}
                className={passwordError ? 'border-destructive' : ''}
                placeholder="Nhập mật khẩu của bạn"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setIsPasswordOpen(false)}
              disabled={isTogglingStatus}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleConfirmStatusChange}
              disabled={isTogglingStatus}
            >
              {isTogglingStatus ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={(open) => {
        setIsPinDialogOpen(open);
        if (!open) {
          setGeneratedPin('');
          setPinDialogUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mã PIN Mới</DialogTitle>
            <DialogDescription>
              Đã tạo mã PIN hệ thống mới cho nhân viên <strong>{pinDialogUser?.first_name} {pinDialogUser?.last_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="bg-slate-100 dark:bg-slate-800 px-8 py-5 rounded-xl border">
              <span className="text-4xl font-mono font-bold tracking-[0.25em] text-slate-800 dark:text-slate-100 ml-3">
                {generatedPin}
              </span>
            </div>
            <p className="text-sm text-center text-muted-foreground px-4">
              Vui lòng chụp lại hoặc sao chép mã PIN này và gửi cho nhân viên. Mã PIN được bảo mật một chiều, <b className="text-red-500">sẽ không hiển thị lại ở bất kỳ đâu</b> sau khi đóng cửa sổ này.
            </p>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setIsPinDialogOpen(false)}>Ghi nhận và Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isConfirmPinOpen} onOpenChange={(open) => {
        if (!isGeneratingPin) {
          setIsConfirmPinOpen(open);
          if (!open) {
            setConfirmPinUser(null);
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận cấp lại mã PIN</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn cấp mã PIN mới cho nhân viên <strong>{confirmPinUser?.first_name} {confirmPinUser?.last_name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Việc này sẽ vô hiệu hóa mã PIN cũ của nhân viên. Hành động này không thể hoàn tác.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmPinOpen(false)}
              disabled={isGeneratingPin}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleConfirmGeneratePin}
              disabled={isGeneratingPin}
            >
              {isGeneratingPin ? 'Đang tạo...' : 'Xác nhận tạo mã'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
