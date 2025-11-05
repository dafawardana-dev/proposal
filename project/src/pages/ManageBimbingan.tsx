import React, { useState, useEffect } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Search } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

interface Bimbingan {
  id: string;
  kode_dosen: string;
  nama_dosen: string;
  nim: string;
  nama_mahasiswa: string;
  judul_proposal: string | null;
  created_at: string;
}

export default function ManageBimbingan() {
  const { user } = useAuth();
  const [bimbingans, setBimbingans] = useState<Bimbingan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canView = user?.role?.permissions.some(
    (p) => p.codename === "can_manage_proposals" || p.codename === "can_crud_mahasiswa"
  );

  const fetchBimbingans = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      const url = `/bimbingan/?${params.toString()}`;
      const response = await apiRequest(url);

      if (response?.results !== undefined) {
        setBimbingans(response.results);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else {
        setBimbingans(Array.isArray(response) ? response : []);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal mengambil data bimbingan", err);
      setBimbingans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchBimbingans(currentPage);
  }, [currentPage, search]);

  const columns = [
    { key: "kode_dosen", header: "Kode Dosen" },
    { key: "nama_dosen", header: "Nama Dosen" },
    { key: "nim", header: "NIM" },
    { key: "nama_mahasiswa", header: "Nama Mahasiswa" },
    { 
      key: "judul_proposal", 
      header: "Judul Proposal",
      render: (b: Bimbingan) => b.judul_proposal || "-"
    },
    { 
      key: "created_at", 
      header: "Tanggal Mulai",
      render: (b: Bimbingan) => new Date(b.created_at).toLocaleDateString('id-ID')
    },
  ];

  if (!canView) {
    return (
      <Card>
        <CardBody>
          <p className="text-yellow-600">Anda tidak memiliki akses ke halaman ini.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <Card className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Daftar Bimbingan
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari dosen/mahasiswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-full"
              />
            </div>
          </div>

          <DataGrid
            columns={columns}
            data={bimbingans}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </CardBody>
      </Card>
    </div>
  );
}