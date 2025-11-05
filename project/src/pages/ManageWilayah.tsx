// src/pages/ManageWilayah.tsx

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { DataGrid, Column } from "../components/ui/DataGrid";
import { ArrowLeft, ArrowRight, Pencil, Trash2, Search } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

interface Wilayah {
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

export default function ManageWilayah() {
  const { user } = useAuth();
  const [wilayahData, setWilayahData] = useState<Wilayah[]>([]);
  const [parentStack, setParentStack] = useState<string[]>([]); // hanya simpan kode parent
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🔹 Hitung level berdasarkan parentStack
  const currentLevel = parentStack.length + 1;

  const canManage = user?.role?.permissions.some(
    (p) => p.codename === "can_crud_wilayah"
  );

  const fetchWilayah = async (lvl: number, parentCode?: string, page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("level", String(lvl));
      if (parentCode) params.set("parent_code", parentCode);
      params.set("page", String(page));

      const url = `/wilayah/?${params.toString()}`;
      const data = await apiRequest(url);
      setWilayahData(data.results || []);
      setTotalPages(data.count ? Math.ceil(data.count / 10) : 1);
      setCurrentPage(page);
    } catch (err) {
      console.error("Gagal ambil wilayah:", err);
      alert("Gagal memuat data wilayah");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {    
    const parentCode = parentStack.length > 0 ? parentStack[parentStack.length - 1] : undefined;
    fetchWilayah(currentLevel, parentCode, 1);
  }, [parentStack]);

  const handleNextLevel = (wilayah: Wilayah) => {
    if (wilayah.level < 4) {
      setParentStack([...parentStack, wilayah.code]);
    }
  };

  const handleBack = () => {
    if (parentStack.length === 0) return; // sudah di level 1
    const newStack = parentStack.slice(0, -1);
    setParentStack(newStack);
  
  };

  const handlePageChange = (page: number) => {
    const parentCode = parentStack.length > 0 ? parentStack[parentStack.length - 1] : undefined;
    fetchWilayah(currentLevel, parentCode, page);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return wilayahData;
    const term = searchTerm.toLowerCase();
    return wilayahData.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.code.includes(term)
    );
  }, [wilayahData, searchTerm]);

  const columns: Column<Wilayah>[] = [
    {
      key: "code",
      header: "Kode",
      width: "150px",
    },
    {
      key: "name",
      header: "Nama Wilayah",
    },
    {
      key: "actions",
      header: "Aksi",
      width: "180px",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<Pencil className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit", item);
            }}
            title="Edit"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Hapus", item);
            }}
            title="Hapus"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          />
          {item.level < 4 && (
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleNextLevel(item);
              }}
              title={`Lihat ${LEVEL_LABELS[item.level + 1]}`}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            />
          )}
        </div>
      ),
    },
  ];

  if (!canManage) {
    return (
      <Card>
        <CardBody>
          <p className="text-yellow-600">
            Anda tidak punya izin untuk mengelola wilayah.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kelola Wilayah
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Level: {LEVEL_LABELS[currentLevel]}
          </p>
        </div>        
      </div>

      {/* Breadcrumb */}
      {parentStack.length > 0 && (
        <Card>
          <CardBody>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span>Wilayah:</span>
              {parentStack.map((code, idx) => (
                <span key={code}>
                  <span className="mx-1">/</span>
                  <span className={idx === parentStack.length - 1 ? "font-medium" : ""}>
                    {code} {/* Atau ambil dari data jika punya cache */}
                  </span>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pencarian */}
      <Card>
        <CardBody className="flex justify-end ">
          {currentLevel > 1 && (
          <Button
            className="mr-auto"
            onClick={handleBack}
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4 " />}
          >
            Kembali
          </Button>
        )}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={`Cari ${LEVEL_LABELS[currentLevel]}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>

      {/* Tabel Wilayah */}
      <Card>
        <CardBody className="p-0">
          <DataGrid
            columns={columns}
            data={filteredData}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardBody>
      </Card>
    </div>
  );
}