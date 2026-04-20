import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, ChevronDown, Check, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import vietmapService from "@/services/vietmapService";

function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find((opt) => opt.code.toString() === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-accent/50 transition-colors ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800" : "cursor-pointer"
          }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate text-[13px]">{selectedOption ? selectedOption.name : placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full min-w-[200px] overflow-hidden rounded-md border bg-white dark:bg-gray-900 shadow-md animate-in fade-in-80 zoom-in-95">
          <div className="p-2 border-b dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
              <input
                type="text"
                className="flex h-9 w-full rounded-md bg-gray-100 dark:bg-gray-800 pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-amber-500"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-sm text-gray-500">
                Không tìm thấy.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.code}
                  className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-[13px] outline-none hover:bg-amber-50 dark:hover:bg-gray-800 ${value === opt.code.toString() ? "bg-amber-50 dark:bg-gray-800 text-amber-700 dark:text-amber-500 font-medium" : "text-gray-700 dark:text-gray-300"
                    }`}
                  onClick={() => {
                    onChange(opt.code.toString());
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  <span className="truncate">{opt.name}</span>
                  {value === opt.code.toString() && (
                    <Check className="absolute right-2 h-4 w-4 text-amber-600 dark:text-amber-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VietmapAddressAutocomplete({
  initialAddress = "",
  onAddressSelect,
  error,
}) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [searchTerm, setSearchTerm] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(null); // Lưu trữ tạm tọa độ GPS
  const [isLocating, setIsLocating] = useState(false); // Trạng thái đang quét GPS

  const [pinnedAddress, setPinnedAddress] = useState("");

  const wrapperRef = useRef(null);
  const isSelectingRef = useRef(false);

  // Fetch provinces
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/v2/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Error fetching provinces:", err));
  }, []);

  // Fetch wards when province changes via depth=2 (v2 API omits districts)
  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://provinces.open-api.vn/api/v2/p/${selectedProvince}?depth=2`)
        .then((res) => res.json())
        .then((data) => {
          setWards(data.wards || []);
        })
        .catch((err) => console.error("Error fetching wards:", err));
    } else {
      setWards([]);
    }
  }, [selectedProvince]);

  // Debounce Autocomplete
  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const handler = setTimeout(async () => {
      // Chỉ tìm nếu >= 3 ký tự
      if (searchTerm.trim().length >= 3) {
        setIsLoadingSuggestions(true);
        try {
          // Xây dựng chuỗi tìm kiếm ưu tiên Tỉnh/Phường đã chọn
          const pName = provinces.find((p) => p.code == selectedProvince)?.name || "";
          const wName = wards.find((w) => w.code == selectedWard)?.name || "";

          // Thêm filter hành chính vào query ngữ cảnh để Vietmap đoán chuẩn hơn
          let contextQuery = searchTerm;
          if (wName) contextQuery += `, ${wName}`;
          if (pName) contextQuery += `, ${pName}`;

          const res = await vietmapService.autocomplete(contextQuery, null, 1);
          if (res?.data && Array.isArray(res.data)) {
            setSuggestions(res.data);
            setIsDropdownOpen(true);
          } else {
            setSuggestions([]);
          }
        } catch (error) {
          console.error("Lỗi tìm địa chỉ:", error);
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, selectedProvince, selectedWard]);

  const handleSelectSuggestion = async (suggestion) => {
    const shortName = suggestion.name || suggestion.address;

    // Ngăn chặn useEffect gọi lại API tự động
    isSelectingRef.current = true;

    // Giao diện chỉ hiện tên ngắn
    setSearchTerm(shortName);
    setIsDropdownOpen(false);

    // Gộp luôn cả tên xã huyện tỉnh để lưu xuống Database (đảm bảo Ship đủ thông tin)
    const pName = provinces.find((p) => p.code == selectedProvince)?.name || "";
    const wName = wards.find((w) => w.code == selectedWard)?.name || "";

    let dbAddress = shortName;
    if (wName) dbAddress += `, ${wName}`;
    if (pName) dbAddress += `, ${pName}`;

    try {
      if (suggestion.ref_id) {
        // Lấy toạ độ Place Detail
        const placeDetail = await vietmapService.getPlaceDetail(suggestion.ref_id);
        const lat = placeDetail?.data?.lat;
        const lng = placeDetail?.data?.lng;

        if (lat && lng) {
          setMapCenter({ lat, lng });
        }

        setPinnedAddress(dbAddress);

        onAddressSelect({
          address: dbAddress,
          latitude: lat,
          longitude: lng,
        });

        console.log("Selected address:", dbAddress);
        console.log("Selected latitude:", lat);
        console.log("Selected longitude:", lng);

      } else {
        setMapCenter(null);
        setPinnedAddress("");
        onAddressSelect({
          address: dbAddress,
          latitude: null,
          longitude: null,
        });
      }
    } catch (error) {
      console.error("Could not fetch place detail:", error);
      onAddressSelect({
        address: dbAddress,
        latitude: null,
        longitude: null,
      });
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full space-y-4" ref={wrapperRef}>
      <label className="text-sm font-medium block">Địa chỉ giao hàng *</label>

      {/* Hành chính Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        <SearchableSelect
          options={provinces}
          value={selectedProvince}
          onChange={(val) => {
            setSelectedProvince(val);
            setSelectedWard("");
          }}
          placeholder="Chọn Tỉnh / Thành phố"
        />

        <SearchableSelect
          options={wards}
          value={selectedWard}
          onChange={(val) => setSelectedWard(val)}
          placeholder="Chọn Phường / Xã"
          disabled={!selectedProvince}
        />
      </div>

      {/* Autocomplete Input */}
      <div className="relative mt-2">
        <div className="relative">
          <Input
            value={searchTerm}
            disabled={!selectedProvince || !selectedWard}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // CHÚ Ý: Không gọi onAddressSelect ở đây nữa. Gửi null để Validate báo lỗi nếu họ không bấm Map/GPS
              onAddressSelect({
                address: e.target.value,
                latitude: null,
                longitude: null,
              });
            }}
            onFocus={() => {
              if (suggestions.length > 0) setIsDropdownOpen(true);
            }}
            placeholder={
              !selectedProvince || !selectedWard
                ? "Vui lòng chọn Tỉnh và Phường trước..."
                : "Nhập tên đường, toà nhà, số nhà..."
            }
            className="pl-10 pr-20 h-10 disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-gray-800 placeholder:text-sm text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(isLoadingSuggestions || isLocating) && (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            )}

            <button
              type="button"
              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Lấy vị trí hiện tại (GPS)"
              disabled={isLocating}
              onClick={(e) => {
                e.stopPropagation();
                if (navigator.geolocation) {
                  setIsLocating(true);
                  navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapCenter({ lat: latitude, lng: longitude });

                    try {
                      const reverseRes = await vietmapService.reverse(latitude, longitude);
                      const reverseData = reverseRes?.data || [];

                      let dbAddress = "Vị trí của bạn (từ GPS)";
                      if (reverseData.length > 0) {
                        // Lấy dòng hiển thị đầy đủ nhất từ Vietmap Reverse API
                        dbAddress = reverseData[0].display || reverseData[0].address || reverseData[0].name || dbAddress;
                      }

                      setSearchTerm(dbAddress);

                      setPinnedAddress(dbAddress);

                      onAddressSelect({
                        address: dbAddress,
                        latitude,
                        longitude,
                      });
                    } catch (err) {
                      console.error("Lỗi lấy địa chỉ từ toạ độ:", err);

                      // Fallback tĩnh
                      const pName = provinces.find((p) => p.code == selectedProvince)?.name || "";
                      const wName = wards.find((w) => w.code == selectedWard)?.name || "";
                      let fallbackAddress = searchTerm || "Vị trí của bạn (từ GPS)";
                      if (wName && !fallbackAddress.includes(wName)) fallbackAddress += `, ${wName}`;
                      if (pName && !fallbackAddress.includes(pName)) fallbackAddress += `, ${pName}`;

                      setSearchTerm(fallbackAddress);
                      setPinnedAddress(fallbackAddress);

                      onAddressSelect({
                        address: fallbackAddress,
                        latitude,
                        longitude,
                      });
                    } finally {
                      setIsLocating(false);
                    }
                  }, (error) => {
                    console.error("Lỗi GPS:", error);
                    alert("Không thể lấy định vị hoặc bạn đã từ chối quyền truy cập vị trí.");
                    setIsLocating(false);
                  }, { timeout: 10000 });
                } else {
                  alert("Trình duyệt không hỗ trợ dịch vụ định vị.");
                }
              }}
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border rounded-xl shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex flex-col p-3 hover:bg-amber-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-0"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                    {suggestion.name || suggestion.address}
                  </p>
                </div>
                {suggestion.address && suggestion.name !== suggestion.address && (
                  <p className="text-xs text-gray-500 pl-6 line-clamp-1 mt-0.5">
                    {suggestion.address}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
