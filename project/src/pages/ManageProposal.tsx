import { useState, useEffect } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Modal } from "../components/ui/Modal";
import { apiRequest } from "../utils/api";
import { ProposalStatusBadge } from "../components/ui/ProposalStatusBadge";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

interface Proposal {
  id: string;
  judul: string;
  deskripsi: string;
  status: string;
  catatan: string;
  mahasiswa_nim: string;
  mahasiswa_nama: string;
}

export default function ManageProposal() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [catatan, setCatatan] = useState('');
  
  const canManage = user?.role?.permissions.some(
    p => p.codename === "can_manage_proposals"
  );
  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/proposals/");
      console.log("Data dari API:", data); 
      setProposals(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleApproveReject = async () => {
    if (!selectedProposal) return;
    
    try {
      await apiRequest(`/proposals/${selectedProposal.id}/${action}/`, {
        method: 'POST',
        body: JSON.stringify({ catatan }),
      });
      fetchProposals();
      setIsModalOpen(false);
      setCatatan('');
    } catch (err) {
      alert(`Gagal ${action === 'approve' ? 'menyetujui' : 'menolak'}`);
    }
  };

  const columns = [
    { key: "judul", header: "Judul Proposal" },
    { key: "mahasiswa_nama", header: "Mahasiswa" },
    { 
      key: "status", 
      header: "Status",
      render: (p: Proposal) => <ProposalStatusBadge status={p.status} />
    },
    {
      key: "actions",
      header: "Aksi",
      render: (p: Proposal) => (
        p.status === 'pending' && (
          <div className="flex gap-2">
            <button 
              onClick={() => { setSelectedProposal(p); setAction('approve'); setIsModalOpen(true); }}
              className="text-green-600"
            >
              Setujui
            </button>
            <button 
              onClick={() => { setSelectedProposal(p); setAction('reject'); setIsModalOpen(true); }}
              className="text-red-600"
            >
              Tolak
            </button>
          </div>
        )
      )
    }
  ];


if (!canManage) {
  return (
    <Card>
      <CardBody>
        <p className="text-yellow-600">Anda tidak punya akses mengelola proposal.</p>
      </CardBody>
    </Card>
  );
}
  return (
    <div className="p-6">
      <Card>
        <CardBody>
          <h2 className="text-xl font-bold mb-4">Kelola Proposal</h2>
          <DataGrid 
            columns={columns} 
            data={proposals} 
            loading={loading}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={action === 'approve' ? "Setujui Proposal" : "Tolak Proposal"}
      >
        <div className="space-y-4">
          <p><strong>Judul:</strong> {selectedProposal?.judul}</p>
          <p><strong>Mahasiswa:</strong> {selectedProposal?.mahasiswa_nama}</p>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              {action === 'approve' ? 'Catatan (Opsional)' : 'Alasan Penolakan *'}
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={3}
              required={action === 'reject'}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button 
              variant={action === 'approve' ? 'primary' : 'danger'}
              onClick={handleApproveReject}
            >
              {action === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}