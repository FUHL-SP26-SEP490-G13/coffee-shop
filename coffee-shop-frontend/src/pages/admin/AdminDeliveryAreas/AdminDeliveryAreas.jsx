import { useEffect, useMemo, useState } from 'react';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import deliveryAreaService from '@/services/deliveryAreaService';

export default function AdminDeliveryAreas() {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [wards, setWards] = useState([]);
  const [provinceName, setProvinceName] = useState('');
  const [wardName, setWardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [wardLoading, setWardLoading] = useState(false);

  const selectedProvince = useMemo(
    () => provinces.find((item) => Number(item.id) === Number(selectedProvinceId || 0)),
    [provinces, selectedProvinceId]
  );

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const response = await deliveryAreaService.getProvinces();
      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setProvinces(list);

      if (!selectedProvinceId && list.length > 0) {
        setSelectedProvinceId(String(list[0].id));
      }
    } catch (error) {
      toast.error('Không thể tải danh sách tỉnh/thành');
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async (provinceId) => {
    if (!provinceId) {
      setWards([]);
      return;
    }

    setWardLoading(true);
    try {
      const response = await deliveryAreaService.getWardsByProvince(provinceId);
      const list = Array.isArray(response?.data?.data)
        ? response.data.data
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setWards(list);
    } catch (error) {
      setWards([]);
      toast.error('Không thể tải danh sách xã/phường');
    } finally {
      setWardLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    loadWards(selectedProvinceId);
  }, [selectedProvinceId]);

  const handleCreateProvince = async () => {
    const name = provinceName.trim();
    if (!name) {
      toast.error('Vui lòng nhập tên tỉnh/thành');
      return;
    }

    try {
      await deliveryAreaService.createProvince({ name });
      toast.success('Tạo tỉnh/thành thành công');
      setProvinceName('');
      await loadProvinces();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể tạo tỉnh/thành');
    }
  };

  const handleCreateWard = async () => {
    const name = wardName.trim();
    const provinceId = Number(selectedProvinceId || 0);

    if (!name) {
      toast.error('Vui lòng nhập tên xã/phường');
      return;
    }

    if (!provinceId) {
      toast.error('Vui lòng chọn tỉnh/thành');
      return;
    }

    try {
      await deliveryAreaService.createWard({
        name,
        province_id: provinceId,
        is_active: 1,
      });
      toast.success('Tạo xã/phường thành công');
      setWardName('');
      await loadWards(provinceId);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể tạo xã/phường');
    }
  };

  const handleToggleWard = async (ward) => {
    try {
      await deliveryAreaService.updateWard(ward.id, {
        is_active: Number(ward.is_active) === 1 ? 0 : 1,
      });
      await loadWards(selectedProvinceId);
      toast.success('Cập nhật trạng thái xã/phường thành công');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật xã/phường');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold">Quản lý tỉnh thành, xã phường</h1>
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Tạo tỉnh/thành</h2>
        <div className="flex gap-3">
          <Input
            value={provinceName}
            onChange={(event) => setProvinceName(event.target.value)}
            placeholder="Nhập tên tỉnh/thành"
          />
          <Button type="button" onClick={handleCreateProvince}>
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold">Tạo xã/phường theo tỉnh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="mb-2 block">Tỉnh/Thành</Label>
            <Select
              value={selectedProvinceId}
              onValueChange={(value) => setSelectedProvinceId(value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loading ? 'Đang tải tỉnh/thành...' : 'Chọn tỉnh/thành'}
                />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={String(province.id)}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-2 block">Tên xã/phường</Label>
            <div className="flex gap-3">
              <Input
                value={wardName}
                onChange={(event) => setWardName(event.target.value)}
                placeholder="Nhập tên xã/phường"
              />
              <Button type="button" onClick={handleCreateWard} disabled={!selectedProvinceId}>
                <Plus className="w-4 h-4 mr-1" />
                Thêm
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">
            Danh sách xã/phường {selectedProvince ? `- ${selectedProvince.name}` : ''}
          </h2>
        </div>

        {wardLoading ? (
          <div className="py-8 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải xã/phường...
          </div>
        ) : wards.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Chưa có xã/phường trong tỉnh/thành này.
          </div>
        ) : (
          <div className="space-y-2">
            {wards.map((ward) => (
              <div
                key={ward.id}
                className="flex items-center justify-between border rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium">{ward.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {ward.id}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {Number(ward.is_active) === 1 ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </span>
                  <Switch
                    checked={Number(ward.is_active) === 1}
                    onCheckedChange={() => handleToggleWard(ward)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
