import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Edit2, Save, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
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

  const genderLabel = useMemo(() => {
    if (!profile) return '';
    const gender = profile.gender;
    if (gender === 1) return 'Nam';
    if (gender === 0) return 'Nữ';
    return 'Khác';
  }, [profile]);

  const toUtc7DateString = (value) => {
    if (!value) return '';
    const raw = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return raw.split('T')[0];
    }
    const utcTime = parsed.getTime() + parsed.getTimezoneOffset() * 60 * 1000;
    const utc7Time = utcTime + 7 * 60 * 60 * 1000;
    return new Date(utc7Time).toISOString().slice(0, 10);
  };

  const toDateInputValue = (value) => toUtc7DateString(value);
  const toDateDisplayValue = (value) => toUtc7DateString(value) || '-';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send editable fields
      const updateData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        gender: profile.gender,
        dob: profile.dob,
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

  return (
    <div className="min-h-screen bg-background">
      {isCustomer && <Header />}

      <div className="p-8">
        <div className="max-w-2x">
          <h1 className="text-3xl font-semibold mb-6">Thông tin của tôi</h1>

          <Card className="mb-6">
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

              {/* Email - Read only */}
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

              {/* Phone - Read only */}
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={profile?.phone || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* First Name - Editable */}
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

              {/* Last Name - Editable */}
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

              {/* Gender - Editable */}
              <div>
                <Label htmlFor="gender">Giới tính</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Select
                      value={profile?.gender?.toString() || ''}
                      onValueChange={(value) =>
                        setProfile((prev) => ({
                          ...prev,
                          gender: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nam</SelectItem>
                        <SelectItem value="0">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>{genderLabel || '-'}</span>
                  )}
                </div>
              </div>

              {/* Date of Birth - Editable */}
              <div>
                <Label htmlFor="dob">Ngày sinh</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="dob"
                      type="date"
                      value={toDateInputValue(profile?.dob)}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          dob: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span>{toDateDisplayValue(profile?.dob)}</span>
                  )}
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

          <Card>
            <CardHeader>
              <CardTitle>Cài đặt tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
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
                </div>
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
        </div>
      </div>
      {isCustomer && <Footer />}
    </div>
  );
}
