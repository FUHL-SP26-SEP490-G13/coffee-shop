import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Edit2, Save, MapPin, Plus, Trash2, Loader2, Lock, Navigation, Home, Star, BriefcaseBusiness } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

import { toast } from 'sonner';
import authenticationService from '../../services/authenticationService';
import receiptSettingService from '../../services/receiptSettingService';
import { APP_ROUTES, STORAGE_KEYS } from '../../constants';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const getStoredValue = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const normalizePhoneInput = (value) => String(value || '').trim().replace(/\s+/g, '');

const isValidPhoneNumber = (value) => {
  const phone = normalizePhoneInput(value);

  if (phone.startsWith('+84')) {
    return /^\d{9,10}$/.test(phone.slice(3));
  }

  return /^\d{10,11}$/.test(phone);
};

export function UserProfile() {
  useDocumentTitle('Hồ sơ của tôi');
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
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [addressFieldErrors, setAddressFieldErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await authenticationService.getProfile();
        if (!response?.success) {
          throw new Error(response?.message || 'Không thể tải profile');
        }

        if (isMounted) {
          setProfile(response.data || null);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Không thể tải profile';
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

  const getProfilePhoneError = (value) => {
    const normalizedPhone = normalizePhoneInput(value);

    if (!normalizedPhone) {
      return 'Số điện thoại không được để trống';
    }

    if (!isValidPhoneNumber(normalizedPhone)) {
      return 'Số điện thoại phải có 10-11 chữ số hoặc bắt đầu bằng +84';
    }

    return '';
  };

  const getReceiverPhoneError = (value) => {
    const normalizedReceiverPhone = normalizePhoneInput(value);

    if (!normalizedReceiverPhone) {
      return '';
    }

    if (!isValidPhoneNumber(normalizedReceiverPhone)) {
      return 'Số điện thoại người nhận phải có 10-11 chữ số hoặc bắt đầu bằng +84';
    }

    return '';
  };

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

  const isGoogleLogin = useMemo(
    () => getStoredValue(STORAGE_KEYS.AUTH_PROVIDER) === 'google',
    [],
  );

  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem("cached_store_name") || "Coffee Shop";
  });

  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data && data.store_name) {
          setStoreName(data.store_name);
          localStorage.setItem("cached_store_name", data.store_name);
        }
      } catch {
        // Fallback or ignore
      }
    };
    fetchStoreName();

    const handleReceiptUpdate = () => fetchStoreName();
    window.addEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    return () => window.removeEventListener("receiptSettingsUpdated", handleReceiptUpdate);
  }, []);

  const handleSave = async () => {
    const normalizedPhone = normalizePhoneInput(profile?.phone);
    const phoneError = getProfilePhoneError(normalizedPhone);

    if (phoneError) {
      setProfileFieldErrors((prev) => ({ ...prev, phone: phoneError }));
      toast.error(phoneError);
      return;
    }

    setProfileFieldErrors((prev) => ({ ...prev, phone: '' }));

    setIsSaving(true);
    try {
      // Only send editable fields
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: normalizedPhone,
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
    setAddressFieldErrors({});
    setEditingAddressId(null);
  };

  const openCreateAddressDialog = () => {
    resetAddressForm();
    setAddressDialogOpen(true);
  };

  const validateAddressForm = () => {
    const errors = {};
    const normalizedAddress = String(addressForm.address || '').trim();
    const receiverPhoneError = getReceiverPhoneError(addressForm.receiver_phone);

    if (!normalizedAddress) {
      errors.address = 'Vui lòng nhập địa chỉ nhận hàng';
    }

    if (receiverPhoneError) {
      errors.receiver_phone = receiverPhoneError;
    }

    setAddressFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(errors.address || errors.receiver_phone);
      return false;
    }

    return true;
  };

  const handleSubmitAddress = async () => {
    if (!validateAddressForm()) return;
    const normalizedAddress = String(addressForm.address || '').trim();
    const normalizedReceiverPhone = normalizePhoneInput(addressForm.receiver_phone);

    const payload = {
      receiver_name: addressForm.receiver_name.trim() || null,
      receiver_phone: normalizedReceiverPhone || null,
      address: normalizedAddress,
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
    setAddressFieldErrors({});
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

  const getAddressTypeIconLabel = (type) => {
    if (type === 'work') return { label: 'Văn phòng', icon: <BriefcaseBusiness className="w-3.5 h-3.5" /> };
    if (type === 'other') return { label: 'Khác', icon: <Navigation className="w-3.5 h-3.5" /> };
    return { label: 'Nhà riêng', icon: <Home className="w-3.5 h-3.5" /> };
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col relative overflow-hidden">
      {/* Nền Gradient Tinh Tế */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] rounded-full bg-amber-400/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[35rem] h-[35rem] rounded-full bg-orange-400/5 blur-[100px]" />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center relative z-10 min-h-[400px]">
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
            <p className="text-muted-foreground">Đang tải hồ sơ của bạn...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-8 relative z-10 w-full animate-in fade-in duration-500">
          <div className="w-full max-w-5xl">
            <div className="grid gap-6 lg:grid-cols-12 px-2 sm:px-4 pt-4 pb-12">
              
              {/* Cột 1: Thông tin cá nhân */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <Card className="rounded-[24px] border-white/50 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg border relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                  <div className="absolute top-0 right-0 p-6 z-10">
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => {
                        setProfileFieldErrors({});
                        setIsEditing(true);
                      }} className="rounded-xl border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setProfileFieldErrors({});
                          setIsEditing(false);
                        }} disabled={isSaving} className="rounded-xl hover:bg-gray-100">
                          Hủy
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pt-6 sm:pt-6 pb-2 relative z-0">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
                      <div className="relative">
                        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white dark:border-gray-900 shadow-xl rounded-full">
                          <AvatarFallback className="text-3xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 font-bold">
                              {displayName
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {isCustomer && (
                          <div className="absolute bottom-1 right-1 w-7 h-7 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-white shadow-sm" title="Khách hàng">
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="text-center sm:text-left mb-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">{displayName || '...'}</CardTitle>
                        <p className="text-sm font-medium text-muted-foreground mt-1 capitalize flex items-center justify-center sm:justify-start gap-1">
                          {roleLabel}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-5">
                      {/* Read-only fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-gray-600 dark:text-gray-400 ml-1">Tên đăng nhập</Label>
                          <div className="relative group">
                            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="username"
                              value={profile?.username || ''}
                              disabled
                              className="pl-10 rounded-xl bg-gray-50/70 border-gray-100 dark:bg-black/20 dark:border-gray-800 text-gray-500 shadow-sm cursor-not-allowed"
                            />
                            <Lock className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-600 dark:text-gray-400 ml-1">Email</Label>
                          <div className="relative group">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              value={profile?.email || ''}
                              disabled
                              className="pl-10 rounded-xl bg-gray-50/70 border-gray-100 dark:bg-black/20 dark:border-gray-800 text-gray-500 shadow-sm cursor-not-allowed"
                            />
                            <Lock className="absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border/60 w-full" />

                      {/* Editable Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-gray-700 dark:text-gray-300 ml-1">Họ</Label>
                          <div className="relative group">
                            <User className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${isEditing ? 'text-amber-500' : 'text-gray-400'}`} />
                            <Input
                              id="first_name"
                              value={profile?.first_name || ''}
                              disabled={!isEditing}
                              className={`pl-10 rounded-xl transition-all font-medium ${isEditing ? "bg-white dark:bg-black/40 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500" : "bg-transparent border-transparent font-semibold text-gray-900 dark:text-gray-100 shadow-none"}`}
                              onChange={(e) =>
                                setProfile((prev) => ({
                                  ...prev,
                                  first_name: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-gray-700 dark:text-gray-300 ml-1">Tên</Label>
                          <div className="relative group">
                            <User className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${isEditing ? 'text-amber-500' : 'text-gray-400'}`} />
                            <Input
                              id="last_name"
                              value={profile?.last_name || ''}
                              disabled={!isEditing}
                              className={`pl-10 rounded-xl transition-all font-medium ${isEditing ? "bg-white dark:bg-black/40 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500" : "bg-transparent border-transparent font-semibold text-gray-900 dark:text-gray-100 shadow-none"}`}
                              onChange={(e) =>
                                setProfile((prev) => ({
                                  ...prev,
                                  last_name: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 ml-1">Số điện thoại</Label>
                          <div className="relative group">
                            <Phone className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${isEditing ? 'text-amber-500' : 'text-gray-400'}`} />
                            <Input
                              id="phone"
                              type="tel"
                              value={profile?.phone || ''}
                              disabled={!isEditing}
                              className={`pl-10 rounded-xl transition-all font-medium ${isEditing ? `bg-white dark:bg-black/40 ${profileFieldErrors.phone ? 'border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/40' : 'border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500'}` : "bg-transparent border-transparent font-semibold text-gray-900 dark:text-gray-100 shadow-none"}`}
                              onChange={(e) => {
                                const value = e.target.value;
                                setProfile((prev) => ({
                                  ...prev,
                                  phone: value,
                                }));

                                const phoneError = getProfilePhoneError(value);
                                setProfileFieldErrors((prev) => ({
                                  ...prev,
                                  phone: phoneError,
                                }));
                              }}
                            />
                          </div>
                          {isEditing && profileFieldErrors.phone && (
                            <p className="text-xs text-destructive ml-1">{profileFieldErrors.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phần Quản lý địa chỉ (chỉ hiện với Khách hàng) */}
                {isCustomer && (
                  <Card className="rounded-[24px] border-white/50 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg border animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle className="text-xl">Địa chỉ giao hàng</CardTitle>
                        <Button type="button" onClick={openCreateAddressDialog} disabled={isAddressSaving} className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60 font-semibold border-0 shadow-none">
                          <Plus className="w-4 h-4 mr-1.5" />
                          Thêm địa chỉ mới
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                          {isAddressLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl bg-white/50">
                               <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
                              <p className="text-sm text-muted-foreground">Đang tải danh sách địa chỉ...</p>
                            </div>
                          ) : addresses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-2xl bg-white/30 text-center">
                              <MapPin className="w-10 h-10 text-gray-300 mb-3" />
                              <p className="text-sm text-muted-foreground font-medium">Bạn chưa có địa chỉ nào.</p>
                              <p className="text-xs text-gray-400 mt-1">Hãy thêm địa chỉ để tiện lợi khi đặt hàng!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {addresses.map((item) => {
                                const typeInfo = getAddressTypeIconLabel(item.address_type);
                                return (
                                  <div key={item.id} className="group relative border border-gray-200/60 dark:border-gray-800 bg-white/80 dark:bg-black/20 rounded-2xl p-5 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm hover:shadow-md transition-all">
                                    {Number(item.is_default) === 1 && (
                                      <div className="absolute top-0 right-5 -mt-3">
                                        <span className="text-[11px] font-bold bg-amber-500 text-white px-3 py-1 rounded-full shadow-sm">
                                          Mặc định
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                                           {typeInfo.icon}
                                        </div>
                                        <div>
                                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{item.receiver_name || 'Không tên'}</p>
                                          <p className="text-xs text-muted-foreground">{item.receiver_phone || 'Thiếu SĐT'}</p>
                                        </div>
                                      </div>
                                      
                                    </div>

                                    <div className="mb-3 space-y-1">
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                        {item.address}
                                      </p>
                                      {(item.ward_name || item.province_name) && (
                                        <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 opacity-90">
                                          <MapPin className="w-3 h-3" />
                                          {[item.ward_name, item.province_name]
                                            .filter(Boolean)
                                            .join(', ')}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 rounded-lg text-xs font-semibold px-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        onClick={() => handleEditAddress(item)}
                                      >
                                        <Edit2 className="w-3 h-3 mr-1" /> Sửa
                                      </Button>
                                      
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 rounded-lg text-xs font-semibold px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        disabled={isAddressSaving}
                                        onClick={() => handleDeleteAddress(item.id)}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" /> Xóa
                                      </Button>

                                      <div className="flex-1" />

                                      {Number(item.is_default) !== 1 && (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          className="h-8 rounded-lg text-[11px] font-semibold"
                                          disabled={isAddressSaving}
                                          onClick={() => handleSetDefaultAddress(item.id)}
                                        >
                                          Đặt mặc định
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Cột 2: Cài đặt tài khoản (Bên phải) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <Card className="rounded-[24px] border-white/50 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-lg border">
                  <CardHeader>
                    <CardTitle className="text-xl">Cài đặt tài khoản</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="group flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 transition-all hover:border-amber-200 dark:hover:border-amber-900 hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Bảo mật</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isGoogleLogin ? 'Đăng nhập Google' : 'Mật khẩu & Đăng nhập'}
                            </p>
                          </div>
                        </div>
                        {!isGoogleLogin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-gray-200 shadow-sm"
                            onClick={() => navigate(APP_ROUTES.CHANGE_PASSWORD)}
                          >
                            Đổi mật khẩu
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Widget Information */}
                <div className="p-5 rounded-[24px] border border-amber-200/50 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30 text-center">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-2">Thành viên {storeName}</p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-500/70">
                    Bạn luôn có thể quản lý các thông tin cá nhân và cài đặt ứng dụng ngay tại trang này.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Địa chỉ Modal */}
      <Dialog
        open={addressDialogOpen}
        onOpenChange={(open) => {
          setAddressDialogOpen(open);
          if (!open && !isAddressSaving) {
            resetAddressForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              {editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Nhập thông tin nhận hàng để đội ngũ giao hàng có thể tiếp cận bạn nhanh nhất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="receiver_name" className="text-xs font-semibold text-gray-500 ml-1">Tên người nhận</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    id="receiver_name"
                    value={addressForm.receiver_name}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, receiver_name: e.target.value }))}
                    placeholder="VD: Anh Tùng"
                    className="pl-9 h-11 rounded-xl bg-gray-50/80 dark:bg-black/20 focus-visible:ring-amber-500/50 focus-visible:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receiver_phone" className="text-xs font-semibold text-gray-500 ml-1">Số điện thoại lấy hàng</Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  <Input
                    id="receiver_phone"
                    value={addressForm.receiver_phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddressForm((prev) => ({ ...prev, receiver_phone: value }));

                      const phoneError = getReceiverPhoneError(value);
                      setAddressFieldErrors((prev) => ({
                        ...prev,
                        receiver_phone: phoneError,
                      }));
                    }}
                    placeholder="09xx..."
                    className={`pl-9 h-11 rounded-xl bg-gray-50/80 dark:bg-black/20 ${addressFieldErrors.receiver_phone ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40' : 'focus-visible:ring-amber-500/50 focus-visible:border-amber-500'}`}
                  />
                </div>
                {addressFieldErrors.receiver_phone && (
                  <p className="text-xs text-destructive ml-1">{addressFieldErrors.receiver_phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_type" className="text-xs font-semibold text-gray-500 ml-1">Lưu địa chỉ là</Label>
              <div className="flex gap-2">
                {[
                  { value: 'home', label: 'Nhà riêng', icon: Home },
                  { value: 'work', label: 'Văn phòng', icon: BriefcaseBusiness },
                  { value: 'other', label: 'Khác', icon: Navigation }
                ].map(type => {
                  const Icon = type.icon;
                  const isActive = addressForm.address_type === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setAddressForm((prev) => ({ ...prev, address_type: type.value }))}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-2 ring-amber-500/50 outline-none' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400 hover:dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shipping_address" className="text-xs font-semibold text-gray-500 ml-1">Địa chỉ chi tiết</Label>
              <Input
                id="shipping_address"
                value={addressForm.address}
                onChange={(e) => {
                  const value = e.target.value;
                  setAddressForm((prev) => ({
                    ...prev,
                    address: value,
                  }));

                  setAddressFieldErrors((prev) => ({
                    ...prev,
                    address: value.trim() ? '' : prev.address,
                  }));
                }}
                placeholder="Số nhà, hẻm, tên đường..."
                className={`h-11 rounded-xl bg-gray-50/80 dark:bg-black/20 ${addressFieldErrors.address ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40' : 'focus-visible:ring-amber-500/50 focus-visible:border-amber-500'}`}
              />
              {addressFieldErrors.address && (
                <p className="text-xs text-destructive ml-1">{addressFieldErrors.address}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAddressDialogOpen(false);
                  resetAddressForm();
                }}
                disabled={isAddressSaving}
                className="rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Hủy bỏ
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmitAddress} 
                disabled={isAddressSaving}
                className="rounded-xl px-6 font-bold shadow-md bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              >
                {isAddressSaving
                  ? 'Đang xử lý...'
                  : editingAddressId
                    ? 'Lưu thay đổi'
                    : 'Hoàn tất thêm mới'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
