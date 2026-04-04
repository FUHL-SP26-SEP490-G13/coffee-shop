import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Edit2, Save, MapPin, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { toast } from 'sonner';
import authenticationService from '../../services/authenticationService';
import { APP_ROUTES } from '../../constants';

export function UserProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    receiver_name: '',
    receiver_phone: '',
    address: '',
    address_type: 'home',
  });
  const [editingAddressId, setEditingAddressId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await authenticationService.getProfile();
        if (!response?.success) {
          throw new Error(response?.message || 'Khong the tai profile');
        }

        if (isMounted) {
          setProfile(response.data || null);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Khong the tai profile';
        if (isMounted) {
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!profile) return '';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || profile.username || profile.email || '';
  }, [profile]);

  const roleLabel = useMemo(() => {
    if (!profile) return '';
    return profile.role_name || profile.role || 'staff';
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send editable fields
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      };

      const response = await authenticationService.updateProfile(updateData);
      
      if (!response?.success) {
        throw new Error(response?.message || 'Không thể cập nhật profile');
      }

      setProfile((prev) => ({
        ...prev,
        ...response.data,
      }));
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể cập nhật profile';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isCustomer = profile?.role_id === 4;

  const getApiErrorMessage = (error, fallbackMessage) => {
    const validationErrors = error?.response?.data?.errors;

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      return validationErrors.map((item) => item?.message).filter(Boolean).join('\n');
    }

    return error?.response?.data?.message || error?.message || fallbackMessage;
  };

  const loadAddresses = useCallback(async () => {
    if (!isCustomer || !profile?.id) {
      setAddresses([]);
      return;
    }

    setIsAddressLoading(true);
    try {
      const response = await authenticationService.getMyAddresses();
      if (!response?.success) {
        throw new Error(response?.message || 'Không thể tải danh sách địa chỉ');
      }

      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách địa chỉ'));
    } finally {
      setIsAddressLoading(false);
    }
  }, [isCustomer, profile?.id]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const resetAddressForm = () => {
    setAddressForm({
      receiver_name: '',
      receiver_phone: '',
      address: '',
      address_type: 'home',
    });
    setEditingAddressId(null);
  };

  const openCreateAddressDialog = () => {
    resetAddressForm();
    setAddressDialogOpen(true);
  };

  const validateAddressForm = () => {
    if (!addressForm.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ nhận hàng');
      return false;
    }

    return true;
  };

  const handleSubmitAddress = async () => {
    if (!validateAddressForm()) return;

    const payload = {
      receiver_name: addressForm.receiver_name.trim() || null,
      receiver_phone: addressForm.receiver_phone.trim() || null,
      address: addressForm.address.trim(),
      address_type: addressForm.address_type,
    };

    setIsAddressSaving(true);
    try {
      if (editingAddressId) {
        const response = await authenticationService.updateAddress(editingAddressId, payload);

        if (!response?.success) {
          throw new Error(response?.message || 'Không thể cập nhật địa chỉ');
        }

        toast.success('Đã cập nhật địa chỉ');
      } else {
        const response = await authenticationService.createAddress(payload);

        if (!response?.success) {
          throw new Error(response?.message || 'Không thể thêm địa chỉ');
        }

        toast.success('Đã thêm địa chỉ mới');
      }

      resetAddressForm();
      setAddressDialogOpen(false);
      await loadAddresses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu địa chỉ'));
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleEditAddress = (item) => {
    setEditingAddressId(item.id);
    setAddressForm({
      receiver_name: item.receiver_name || '',
      receiver_phone: item.receiver_phone || '',
      address: item.address || '',
      address_type: item.address_type || 'home',
    });
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    setIsAddressSaving(true);
    try {
      const response = await authenticationService.deleteAddress(id);

      if (!response?.success) {
        throw new Error(response?.message || 'Không thể xóa địa chỉ');
      }

      if (editingAddressId === id) {
        resetAddressForm();
      }

      toast.success('Đã xóa địa chỉ');
      await loadAddresses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa địa chỉ'));
    } finally {
      setIsAddressSaving(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    setIsAddressSaving(true);
    try {
      const response = await authenticationService.setDefaultAddress(id);

      if (!response?.success) {
        throw new Error(response?.message || 'Không thể đặt địa chỉ mặc định');
      }

      toast.success('Đã đặt làm địa chỉ mặc định');
      await loadAddresses();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể đặt địa chỉ mặc định'));
    } finally {
      setIsAddressSaving(false);
    }
  };

  const getAddressTypeLabel = (type) => {
    if (type === 'work') return 'Văn phòng';
    if (type === 'other') return 'Khác';
    return 'Nhà riêng';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isCustomer && <Header />}

      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thông tin cá nhân</CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-2xl">
                      {displayName
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-xl font-semibold">{displayName || '...'}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {roleLabel}
                    </p>
                </div>
              </div>

              <div className="space-y-4">
              {/* Username - Read only */}
              <div>
                <Label htmlFor="username">Tên đăng nhập</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={profile?.username || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Email - Read only - Full width */}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Phone - Editable */}
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={profile?.phone || ''}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span>{profile?.phone || '-'}</span>
                  )}
                </div>
              </div>

              {/* First Name & Last Name - Same row - Editable */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">Họ</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        id="first_name"
                        value={profile?.first_name || ''}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            first_name: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <span>{profile?.first_name || '-'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="last_name">Tên</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {isEditing ? (
                      <Input
                        id="last_name"
                        value={profile?.last_name || ''}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            last_name: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <span>{profile?.last_name || '-'}</span>
                    )}
                  </div>
                </div>
              </div>

            {isLoading && (
              <div className="mt-4 text-sm text-muted-foreground">
                Đang tải thông tin...
              </div>
            )}
            </div>
          </CardContent>
        </Card>

            <Card className="h-fit">
            <CardHeader>
              <CardTitle>Cài đặt tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Vai trò</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {roleLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Mã người dùng</p>
                    <p className="text-sm text-muted-foreground">{profile?.id || '-'}</p>
                  </div>
                </div> */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Đổi mật khẩu</p>
                    <p className="text-sm text-muted-foreground">Cập nhật mật khẩu của bạn</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(APP_ROUTES.CHANGE_PASSWORD)}
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isCustomer && (
            <Card className="h-fit lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Quản lý địa chỉ</CardTitle>
                  <Button type="button" onClick={openCreateAddressDialog} disabled={isAddressSaving}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm địa chỉ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                    {isAddressLoading ? (
                      <div className="text-sm text-muted-foreground border rounded-lg p-4">
                        Đang tải danh sách địa chỉ...
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="text-sm text-muted-foreground border rounded-lg p-4">
                        Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ để đặt hàng nhanh hơn.
                      </div>
                    ) : (
                      addresses.map((item) => (
                        <div key={item.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <p className="font-medium text-sm">{item.receiver_name || 'Địa chỉ giao hàng'}</p>
                              {Number(item.is_default) === 1 && (
                                <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getAddressTypeLabel(item.address_type)}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground">{item.receiver_phone || '-'}</p>
                          <p className="text-sm">{item.address}</p>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {Number(item.is_default) !== 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isAddressSaving}
                                onClick={() => handleSetDefaultAddress(item.id)}
                              >
                                Đặt mặc định
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isAddressSaving}
                              onClick={() => handleEditAddress(item)}
                            >
                              Sửa
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isAddressSaving}
                              onClick={() => handleDeleteAddress(item.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
      {isCustomer && <Footer />}

      <Dialog
        open={addressDialogOpen}
        onOpenChange={(open) => {
          setAddressDialogOpen(open);
          if (!open && !isAddressSaving) {
            resetAddressForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin nhận hàng để lưu vào danh sách địa chỉ của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="receiver_name" className="mb-2">Tên người nhận</Label>
              <Input
                id="receiver_name"
                value={addressForm.receiver_name}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    receiver_name: e.target.value,
                  }))
                }
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <Label htmlFor="receiver_phone" className="mb-2">Số điện thoại nhận hàng</Label>
              <Input
                id="receiver_phone"
                value={addressForm.receiver_phone}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    receiver_phone: e.target.value,
                  }))
                }
                placeholder="09xxxxxxxx"
              />
            </div>

            <div>
              <Label htmlFor="address_type" className="mb-2">Loại địa chỉ</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                <Button
                  type="button"
                  variant={addressForm.address_type === 'home' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setAddressForm((prev) => ({ ...prev, address_type: 'home' }))
                  }
                >
                  Nhà riêng
                </Button>
                <Button
                  type="button"
                  variant={addressForm.address_type === 'work' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setAddressForm((prev) => ({ ...prev, address_type: 'work' }))
                  }
                >
                  Văn phòng
                </Button>
                <Button
                  type="button"
                  variant={addressForm.address_type === 'other' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setAddressForm((prev) => ({ ...prev, address_type: 'other' }))
                  }
                >
                  Khác
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="shipping_address" className="mb-2">Địa chỉ nhận hàng</Label>
              <Input
                id="shipping_address"
                value={addressForm.address}
                onChange={(e) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddressDialogOpen(false);
                  resetAddressForm();
                }}
                disabled={isAddressSaving}
              >
                Hủy
              </Button>
              <Button type="button" onClick={handleSubmitAddress} disabled={isAddressSaving}>
                {isAddressSaving
                  ? 'Đang lưu...'
                  : editingAddressId
                    ? 'Cập nhật địa chỉ'
                    : 'Thêm địa chỉ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
