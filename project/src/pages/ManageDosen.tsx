import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { Search, Plus, Pencil, Trash2, Upload, RotateCcw } from "lucide-react";
import { apiRequest, apiFormDataRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { DataActions } from "../components/ui/DataActions";
import { downloadCsvTemplate } from "../utils/csvTemplates";
import { WilayahPicker, WilayahPathItem } from "../components/WilayahPicker"; 

interface Dosen {
  nidn: string;
  nip?: string;
  nama_dosen: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  jk: string;  
  tempat_lahir?: string; 
  tempat_lahir_id?: number | null;
  tempat_lahir_nama?: string;   
  tgl_lahir?: string;  
  prodi?: string;
  konsentrasi?: string;
  prodi_id?: number | null;
  prodi_nama?: string;
  konsentrasi_id?: number | null;
  konsentrasi_nama?: string;  
  status_aktif: string;
  jabatan_fungsional?: string;
}

interface DropdownOption {
  id: number;
  name: string;
}

const GENDER_LABELS: Record<string, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

const STATUS_DOSEN_OPTIONS = [
  { value: "Aktif", label: "Aktif" },
  { value: "Cuti", label: "Cuti" },
  { value: "Tugas Belajar", label: "Tugas Belajar" },
  { value: "Pensiun", label: "Pensiun" },
];

export default function ManageDosen() {
  const { user } = useAuth();
  const [dosens, setDosens] = useState<Dosen[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentDosen, setCurrentDosen] = useState<Dosen | null>(null);
  const [formData, setFormData] = useState({
    nidn: "",
    nip: "",
    nama_dosen: "",
    gelar_depan: "",
    gelar_belakang: "",
    jk: "L" as "L" | "P",
    tempat_lahir_id: null as number | null,
    tgl_lahir: "",
    prodi_id: 0,
    konsentrasi_id: 0,
    status_aktif: "Aktif",
    jabatan_fungsional: "",
  });
  const [formError, setFormError] = useState("");
  const [confirmDeleteNidn, setConfirmDeleteNidn] = useState<string | null>(null);  
  const [editWilayahPath, setEditWilayahPath] = useState<WilayahPathItem[] | undefined>(undefined);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    backendErrors: string[];
  } | null>(null);

  const [prodiOptions, setProdiOptions] = useState<DropdownOption[]>([]);
  const [konsentrasiByProdi, setKonsentrasiByProdi] = useState<DropdownOption[]>([]);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const canManage = user?.role?.permissions.some((p) => p.codename === "can_crud_dosen");
  
  const fetchDosens = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));      
      const url = `/dosen/?${params.toString()}`;
      const response = await apiRequest(url);

      if (response?.results !== undefined) {
        setDosens(response.results);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else {
        setDosens([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal mengambil data dosen", err);
      setDosens([]);
    } finally {
      setLoading(false);
    }
  }, [search]); // Dependensi: search
  

  const fetchDropdowns = async () => {
    setDropdownLoading(true);
    setDropdownError(null);
    try {
      const prodiRes = await apiRequest("/prodis/dropdown/");
      if (Array.isArray(prodiRes)) {
        setProdiOptions(prodiRes);
      } else {
        throw new Error("Format respons tidak valid");
      }
    } catch (err: any) {
      console.error("Gagal memuat dropdown", err);
      setDropdownError(err.message?.includes("404") ? "Data master Prodi/Konsentrasi belum tersedia. Hubungi admin." : "Gagal memuat data dropdown. Coba lagi nanti.");
    } finally {
      setDropdownLoading(false);
    }
  };

  const fetchKonsentrasiByProdi = async (prodiId: number) => {
    if (!prodiId) {
      setKonsentrasiByProdi([]);
      return;
    }
    try {
      const response = await apiRequest(`/konsentrasi-utama/?prodi_id=${prodiId}`);
      console.log("Response konsentrasi:", response);    
      const data = Array.isArray(response.results) ? response.results : [];    
      setKonsentrasiByProdi(
        data.map((item: any) => ({
          id: item.id,
          name: item.name,
        }))
      );
    } catch (err) {
      console.error("Gagal memuat konsentrasi berdasarkan prodi:", err);
      setKonsentrasiByProdi([]);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDosens(1);
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [search, fetchDosens]);

  useEffect(() => {
    fetchDosens(currentPage);
  }, [currentPage, fetchDosens]);

  const resetFormData = () => {
    setFormData({
      nidn: "",
      nip: "",
      nama_dosen: "",
      gelar_depan: "",
      gelar_belakang: "",
      jk: "L",
      tempat_lahir_id: null,
      tgl_lahir: "",
      prodi_id: 0,
      konsentrasi_id: 0,
      status_aktif: "Aktif",
      jabatan_fungsional: "",
    });
    setFormError("");
    setEditWilayahPath(undefined);
  };

  const openAddModal = () => {
    setModalMode("add");
    resetFormData();
    setIsModalOpen(true);
  };

  const openEditModal = async (dosen: Dosen) => {
    setModalMode("edit");
    setCurrentDosen(dosen);    
    const prodiId = dosen.prodi_id || 0;
    const konsentrasiId = dosen.konsentrasi_id || 0;
    const tempatLahirId = dosen.tempat_lahir_id || null; 

    setFormData({
        nidn: dosen.nidn || "",
        nip: dosen.nip || "",
        nama_dosen: dosen.nama_dosen || "",
        gelar_depan: dosen.gelar_depan || "",
        gelar_belakang: dosen.gelar_belakang || "",
        jk: dosen.jk || "L",                
        tempat_lahir_id: tempatLahirId,         
        tgl_lahir: dosen.tgl_lahir ? new Date(dosen.tgl_lahir).toISOString().split("T")[0] : "",
        prodi_id: prodiId,
        konsentrasi_id: konsentrasiId,
        status_aktif: dosen.status_aktif || "Aktif",
        jabatan_fungsional: dosen.jabatan_fungsional || "",
    });
  
    setEditWilayahPath(undefined);
    if (tempatLahirId) {
        try {
            const pathRes = await apiRequest(`/wilayah/path/${tempatLahirId}/`);
            if (Array.isArray(pathRes) && pathRes.length > 0) {
                setEditWilayahPath(pathRes);
            }
        } catch (err) {
            console.warn("Gagal mengambil path wilayah", err);
            setEditWilayahPath([]);
        }
    } else {
        setEditWilayahPath([]);
    }
    
    setFormError("");
    setIsModalOpen(true);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nidn, nama_dosen } = formData;

    if (!nidn.trim() || !nama_dosen.trim()) {
      setFormError("NIDN dan Nama Dosen wajib diisi.");
      return;
    }

    try {
      const payload: any = {
        nidn: formData.nidn?.trim(),
        nip: formData.nip?.trim() || null,
        nama_dosen: formData.nama_dosen?.trim(),
        gelar_depan: formData.gelar_depan?.trim() || null,
        gelar_belakang: formData.gelar_belakang?.trim() || null,
        jk: formData.jk,
        tempat_lahir: formData.tempat_lahir_id || null,
        tgl_lahir: formData.tgl_lahir, 
        prodi: formData.prodi_id > 0 ? formData.prodi_id : null,            
        status_aktif: formData.status_aktif?.trim() || "Aktif",
        jabatan_fungsional: formData.jabatan_fungsional?.trim() || null,
        };
      if (formData.konsentrasi_id > 0) {
        payload.konsentrasi = formData.konsentrasi_id;
      }
      if (formData.jabatan_fungsional?.trim()) {
        payload.jabatan_fungsional = formData.jabatan_fungsional.trim();
      }
      
      console.log("Payload yang dikirim:", payload);

      if (modalMode === "add") {
        await apiRequest("/dosen/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === "edit" && currentDosen) {
        await apiRequest(`/dosen/${currentDosen.nidn}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },          
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchDosens(currentPage);      
      resetFormData();
    } catch (err: any) {
      console.error(" Error saat menyimpan:", err);
      const errorData = err.data || {};
      const errorMessage =
        errorData.nidn?.[0] ||
        errorData.status_aktif?.[0] ||
        errorData.detail ||
        "Gagal menyimpan data.";
      setFormError(errorMessage);
    }
  };

  const handleDeleteClick = (nidn: string) => {
    setConfirmDeleteNidn(nidn);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteNidn) return;
    try {
      await apiRequest(`/dosen/${confirmDeleteNidn}/`, { method: "DELETE" });
      fetchDosens(currentPage);
      setConfirmDeleteNidn(null);
    } catch (err) {
      alert("Gagal menghapus data");
      console.error(err);
    }
  };

  const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadResult({ success: false, message: "File terlalu besar! Maksimal 10 MB.", backendErrors: [] });
      e.target.value = "";
      return;
    }

    const validExtensions = [".xlsx", ".csv"];
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !validExtensions.includes(`.${extension}`)) {
      setUploadResult({ success: false, message: "Format file tidak didukung. Gunakan .xlsx atau .csv", backendErrors: [] });
      e.target.value = "";
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      setUploading(true);
      setUploadResult(null);
      const response = await apiFormDataRequest("/dosen/upload/", uploadFormData, "POST");
      let message = `Berhasil: ${response.created} data baru, ${response.updated} diperbarui.`;
      if (response.errors && response.errors.length > 0) {
        message += ` ${response.errors.length} baris gagal diimpor.`;
      }

      setUploadResult({
        success: true,
        message: message,
        backendErrors: response.errors || [],
      });
      fetchDosens(currentPage);
    } catch (err: any) {
      console.error("Upload Error:", err);
      let message = "Gagal upload file. Periksa format header dan data.";
      let backendErrors: string[] = [];

      if (err.data && typeof err.data.error === "string") {
        message = err.data.error;
      } else if (err.data && Array.isArray(err.data.errors)) {
        backendErrors = err.data.errors;
      } else if (err.message?.includes("500")) {
        message = "Server error (500). Coba periksa data tanggal dan tipe angka.";
      }

      setUploadResult({
        success: false,
        message,
        backendErrors,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    downloadCsvTemplate("dosen");
  };

  const columns = [      
      { key: "nidn", header: "NIDN", render: (d: Dosen) => d.nidn || "-" },
      
      {
        key: "nama_dosen",
        header: "Nama Dosen",
        render: (d: Dosen) => {
          const gelarDepan = d.gelar_depan ? `${d.gelar_depan} ` : "";
          const gelarBelakang = d.gelar_belakang ? `, ${d.gelar_belakang}` : "";
          return (
            <span title={`${d.nidn} - ${gelarDepan}${d.nama_dosen}${gelarBelakang}`}>
              {gelarDepan}
              <span className="font-medium">{d.nama_dosen}</span>
              {gelarBelakang}
            </span>
          );
        },
      },
      
      { key: "nip", header: "NIP", render: (d: Dosen) => d.nip || "-" },

      {
        key: "prodi_nama",
        header: "Prodi",
        render: (d: Dosen) => {
          return d.prodi_nama || "-";
        },
      },
      
      {
        key: "konsentrasi_nama",
        header: "Konsentrasi",
        render: (d: Dosen) => d.konsentrasi_nama || "-",
      },
      
      {
        key: "tempat_lahir_nama",
        header: "Tempat Lahir",
        render: (d: Dosen) => d.tempat_lahir_nama || "-",
      },
      
      {
        key: "tgl_lahir",
        header: "Tgl Lahir",
        render: (d: Dosen) => (d.tgl_lahir ? new Date(d.tgl_lahir).toLocaleDateString() : "-"),
      },
      
      {
        key: "status_aktif",
        header: "Status",
        render: (d: Dosen) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              d.status_aktif === "Aktif"
                ? "bg-green-100 text-green-800"
                : d.status_aktif === "Cuti"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {d.status_aktif || "-"}
          </span>
        ),
      },
      
      { key: "jabatan_fungsional", header: "Jabatan", render: (d: Dosen) => d.jabatan_fungsional || "-" },

      {
        key: "actions",
        header: "Aksi",
        render: (dosen: Dosen) => (
          <div className="flex gap-2">
            <button
              onClick={() => openEditModal(dosen)}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteClick(dosen.nidn)}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

  return (
    <div className="p-6 space-y-4">
      <Card className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Daftar Dosen</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari dosen..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-64"
                />
              </div>
              <button onClick={openAddModal} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                <Plus size={16} />
                Tambah Data
              </button>
              <DataActions
                onFileUpload={handleFileUpload}
                onDownloadTemplate={handleDownloadTemplate}
                templateLabel="Template Dosen"
              />
            </div>
          </div>

          {/* Error Dropdown */}
          {dropdownError && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg flex justify-between items-start">
              <div>
                <p className="font-medium">{dropdownError}</p>
              </div>
              <button
                onClick={fetchDropdowns}
                className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition"
                title="Muat ulang data dropdown"
              >
                <RotateCcw size={14} />
                Muat Ulang
              </button>
            </div>
          )}

          {uploading && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">Sedang memproses file... Mohon tunggu.</div>}

          {uploadResult && (
            <div className={`mb-4 p-3 rounded-lg ${uploadResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              <p className="font-semibold">{uploadResult.message}</p>
              {uploadResult.backendErrors && uploadResult.backendErrors.length > 0 && (
                <div className="mt-2 text-sm max-h-32 overflow-y-auto p-2 bg-white/50 rounded">
                  <p className="font-medium text-red-900">Detail Kesalahan ({uploadResult.backendErrors.length} baris):</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    {uploadResult.backendErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DataGrid columns={columns} data={dosens} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === "add" ? "Tambah Dosen" : "Edit Dosen"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIDN *</label>
              <input
                type="text"
                value={formData.nidn}
                onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                readOnly={modalMode === "edit"}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dosen *</label>
              <input
                type="text"
                value={formData.nama_dosen}
                onChange={(e) => setFormData({ ...formData, nama_dosen: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gelar Depan</label>
              <input
                type="text"
                value={formData.gelar_depan}
                onChange={(e) => setFormData({ ...formData, gelar_depan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gelar Belakang</label>
              <input
                type="text"
                value={formData.gelar_belakang}
                onChange={(e) => setFormData({ ...formData, gelar_belakang: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
              <input
                type="text"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
              <WilayahPicker
                value={formData.tempat_lahir_id}
                onChange={(path) => {
                  const id = path && path.length > 0 ? path[path.length - 1].id : null;
                  setFormData((prev) => ({ ...prev, tempat_lahir_id: id }));
                }}
                                
                initialPath={modalMode === 'edit' ? editWilayahPath : undefined} 
                key={modalMode === 'edit' ? currentDosen?.nidn : 'add'} // 💡 Key untuk reset WilayahPicker saat modal dibuka/tutup
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.tgl_lahir}
                onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.jk}
                onChange={(e) => setFormData({ ...formData, jk: e.target.value as "L" | "P" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program Studi *</label>
              <select
                value={formData.prodi_id}
                onChange={(e) => {
                  const prodiId = Number(e.target.value);
                  setFormData({ ...formData, prodi_id: prodiId, konsentrasi_id: 0 });
                  fetchKonsentrasiByProdi(prodiId);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value={0}>Pilih Prodi</option>
                {prodiOptions.length > 0 ? (
                  prodiOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value={0} disabled>
                    {dropdownLoading ? "Memuat..." : "Data tidak tersedia"}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konsentrasi</label>
              <select
                value={formData.konsentrasi_id}
                onChange={(e) => setFormData({ ...formData, konsentrasi_id: Number(e.target.value) })}
                disabled={formData.prodi_id === 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={0}>Pilih Konsentrasi</option>
                {konsentrasiByProdi.length > 0 ? (
                  konsentrasiByProdi.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))
                ) : (
                  <option value={0} disabled>
                    {formData.prodi_id === 0 ? "Pilih Prodi terlebih dahulu" : "Tidak ada konsentrasi"}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan Fungsional</label>
              <input
                type="text"
                value={formData.jabatan_fungsional}
                onChange={(e) => setFormData({ ...formData, jabatan_fungsional: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Aktif</label>
              <select
                value={formData.status_aktif}
                onChange={(e) => setFormData({ ...formData, status_aktif: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {STATUS_DOSEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {formError && <div className="text-red-600 text-sm">{formError}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteNidn}
        onClose={() => setConfirmDeleteNidn(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Dosen"
        message={`Apakah Anda yakin ingin menghapus dosen dengan NIDN ${confirmDeleteNidn}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}