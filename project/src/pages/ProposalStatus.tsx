import { useState, useEffect } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { FileText, Download } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

interface Proposal {
  id: string;
  judul: string;
  deskripsi: string;
  status: string;
  catatan: string;
  file?: string;
  created_at: string;
}

export default function ProposalStatus() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);

  const canView = user?.role?.permissions.some(
    p => p.codename === "can_view_own_proposals"
  );

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/proposals/");
      setProposals(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Gagal mengambil data proposal", err);
      alert("Gagal memuat data proposal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchProposals();            
      const interval = setInterval(fetchProposals, 30000);
      return () => clearInterval(interval);
    }
  }, [canView]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const handleDownload = (fileUrl: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { key: "judul", header: "Judul Proposal" },
    { 
      key: "status", 
      header: "Status",
      render: (p: Proposal) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          p.status === 'approved' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {getStatusText(p.status)}
        </span>
      )
    },
    {
      key: "catatan",
      header: "Catatan",
      render: (p: Proposal) => p.catatan || "-"
    },
    {
      key: "file",
      header: "File",
      render: (p: Proposal) => p.file ? (
        <button 
          onClick={() => handleDownload(p.file!)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Download size={14} />
          Unduh
        </button>
      ) : "-"
    },
    {
      key: "created_at",
      header: "Diajukan",
      render: (p: Proposal) => new Date(p.created_at).toLocaleDateString('id-ID')
    }
  ];

  if (!canView) {
    return (
      <Card className="m-6">
        <CardBody>
          <p className="text-yellow-600">Anda tidak punya akses melihat proposal.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Status Proposal Saya</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada proposal yang diajukan.</p>
              <p className="mt-2 text-sm">Silakan ajukan judul proposal di halaman <strong>Ajukan Proposal</strong>.</p>
            </div>
          ) : (
            <DataGrid
              columns={columns}
              data={proposals}
              currentPage={1}
              totalPages={1}
              onPageChange={() => {}}
              loading={loading}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}