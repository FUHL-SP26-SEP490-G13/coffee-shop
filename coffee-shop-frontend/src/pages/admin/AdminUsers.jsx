import { useState, useEffect, useMemo } from 'react';
import { Loader2, Search, ChevronLeft, ChevronRight, Mars, Venus } from 'lucide-react';
import userService from '../../services/userService';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('1');
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  useEffect(() => {
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

    fetchUsers();
  }, []);

  const getGenderLabel = (gender) => {
    switch (gender) {
      case 1:
        return { icon: <Mars className="w-4 h-4" />, label: 'Nam', color: 'text-blue-600' };
      case 0:
        return { icon: <Venus className="w-4 h-4" />, label: 'Nữ', color: 'text-pink-600' };
      default:
        return { icon: null, label: 'Khác', color: 'text-gray-600' };
    }
  };

  const getRoleInfo = (roleId) => {
    switch (roleId) {
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

    // Lọc theo Role
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role_id === parseInt(roleFilter));
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
  }, [users, searchQuery, roleFilter, statusFilter, sortOrder]);

  // Tính toán dữ liệu phân trang
  const totalPages = Math.ceil(filteredAndSortedUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  // Reset về trang 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, sortOrder]);

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
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-1">Người dùng & Vai trò</h2>
        <p className="text-sm text-muted-foreground">Quản lý tài khoản khách hàng và nhân viên</p>
      </div>

      {/* Bộ lọc và tìm kiếm */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Tìm kiếm */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lọc theo Role */}
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="1">Quản lý</SelectItem>
            <SelectItem value="2">Phục vụ</SelectItem>
            <SelectItem value="3">Pha chế</SelectItem>
            <SelectItem value="4">Khách hàng</SelectItem>
          </SelectContent>
        </Select>

        {/* Lọc theo trạng thái */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Active</SelectItem>
            <SelectItem value="0">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Sắp xếp theo tên */}
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Tên A-Z</SelectItem>
            <SelectItem value="desc">Tên Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Tên đăng nhập</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Giới tính</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
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
              paginatedUsers.map((user) => {
              const roleInfo = getRoleInfo(user.role_id);
              const genderInfo = getGenderLabel(user.gender);
              const fullName = `${user.first_name} ${user.last_name}`;
              
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.last_name ? user.last_name[0].toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{fullName}</span>
                        <span className="text-xs text-muted-foreground">ID người dùng: {user.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className={`${genderInfo.color} cursor-help hover:opacity-80 transition-opacity`} title={genderInfo.label}>
                      {genderInfo.icon}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={roleInfo.className}
                    >
                      {roleInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge
                      variant="outline"
                      className={user.isActive === 1 ? 'text-green-600 border-green-200 bg-green-50' : user.isActive === 0 ? 'text-red-600 border-red-200 bg-red-50' : ''}
                    >
                      {user.isActive === 1 ? 'Active' : user.isActive === 0 ? 'Inactive' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Chỉnh sửa
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAndSortedUsers.length)} trên {filteredAndSortedUsers.length} người dùng
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-10 h-10"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
