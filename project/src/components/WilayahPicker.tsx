import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/Button";
import { Search, X } from "lucide-react";
import { apiRequest } from "../utils/api";

export interface Wilayah {
  id: number;
  code: string;
  name: string;
  parent_code: string | null;
  level: number;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "Provinsi",
  2: "Kabupaten/Kota",
  3: "Kecamatan",
  4: "Desa/Kelurahan",
};

interface WilayahPickerProps {
  value: Wilayah[] | null;
  onChange: (selectedPath: Wilayah[] | null) => void;
  error?: string;
}

export function WilayahPicker({ value, onChange, error }: WilayahPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<string>("");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [options, setOptions] = useState<Wilayah[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<Wilayah[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWilayah = useCallback(async (level: number, parent?: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.set("level", String(level));
      if (parent) params.set("parent_code", parent);
      params.set("all", "true");

      let allData: Wilayah[] = [];
      let currentPage = 1;
      let hasNext = true;

      while (hasNext) {
        const response = await apiRequest(`/wilayah/?${params.toString()}&page=${currentPage}`);
        const results = Array.isArray(response) ? response : response.results || [];
        allData = [...allData, ...results];
        hasNext = response.next !== null;
        currentPage++;
      }
      
      setOptions(allData);
    } catch (err: any) {
      console.error("Gagal memuat wilayah", err);
      setOptions([]);
      setFetchError("Gagal memuat data wilayah. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWilayahPath = useCallback(async (path: Wilayah[] | null) => {
    if (!path || path.length === 0) {
      setSelectedName("");
      return;
    }

    const fullName = path.map((w) => w.name).join(", ");
    setSelectedName(fullName);

    if (path.length < 4) {
      const nextLevel = path.length + 1;
      const lastCode = path[path.length - 1].code;
      setCurrentLevel(nextLevel);
      setParentCode(lastCode);
    } else {
      setCurrentLevel(1);
      setParentCode(null);
    }
    console.log("📡 Data wilayah dari API:", allData.slice(0, 3));
    setBreadcrumb(path);
  }, []);

  useEffect(() => {
    if (value && value.length > 0) {
      fetchWilayahPath(value);
    } else {
      setSelectedName("");
      setCurrentLevel(1);
      setParentCode(null);
      setBreadcrumb([]);
    }
  }, [value, fetchWilayahPath]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setOptions([]);
      setFetchError(null);
      fetchWilayah(currentLevel, parentCode);
    }
  }, [currentLevel, parentCode, fetchWilayah, isOpen]);

  const handleSelect = (wilayah: Wilayah) => {
    const newBreadcrumb = [...breadcrumb, wilayah];

    if (wilayah.level < 4) {
      setCurrentLevel(wilayah.level + 1);
      setParentCode(wilayah.code);
      setBreadcrumb(newBreadcrumb);
    } else {
      setIsOpen(false);
      onChange(newBreadcrumb);
      setSelectedName(newBreadcrumb.map((w) => w.name).join(", "));
      console.log("📍 Wilayah path terpilih:", newBreadcrumb);
    }
  };

  const handleBack = () => {
    if (currentLevel <= 1) return;
    const newLevel = currentLevel - 1;
    const newBreadcrumb = breadcrumb.slice(0, -1);
    setCurrentLevel(newLevel);
    setBreadcrumb(newBreadcrumb);
    setParentCode(newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].code : null);
    if (currentLevel === 4) {
      setSelectedName("");
      onChange(null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentLevel(1);
    setParentCode(null);
    setBreadcrumb([]);
    setSelectedName("");
    onChange(null);
    setIsOpen(false);
  };

  const filteredOptions = options.filter((w) => w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.code.includes(searchTerm));

  const currentBreadcrumbName = breadcrumb.map((w) => w.name).join(" > ");

  return (
    <div className="relative">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir *</label>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={selectedName}
            onClick={() => setIsOpen(true)}
            placeholder="Pilih wilayah..."
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500" : "border-gray-300"}`}
          />
          {selectedName && (
            <button type="button" onClick={handleClear} className="absolute right-9 top-2.5 text-gray-400 hover:text-gray-600 p-0.5">
              <X className="w-4 h-4" />
            </button>
          )}
          <Search className="absolute right-3 top-2.5 text-gray-400 w-4 h-4" />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {currentBreadcrumbName && <div className="px-3 py-2 text-xs text-gray-600 border-b overflow-hidden whitespace-nowrap text-ellipsis">**Jalur Saat Ini:** {currentBreadcrumbName}</div>}

          <div className="p-3 border-b">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-700">Pilih {LEVEL_LABELS[currentLevel]}</span>
              {currentLevel > 1 && (
                <button type="button" onClick={handleBack} className="text-sm text-blue-600 hover:underline">
                  &larr; Kembali
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={`Cari ${LEVEL_LABELS[currentLevel]}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="p-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-500 text-sm">Memuat...</p>
            ) : fetchError ? (
              <p className="text-center text-red-500 text-sm">{fetchError}</p>
            ) : filteredOptions.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">Tidak ada data</p>
            ) : (
              filteredOptions.map((w) => (
                <div key={`${w.id}-${w.code}`} onClick={() => handleSelect(w)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0">
                  {w.name}
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 flex justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
