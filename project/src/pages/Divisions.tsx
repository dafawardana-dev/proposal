import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Division } from "../types";
import { Plus, Pencil, Trash2, Building2, Users, Archive } from "lucide-react";
import { apiRequest } from "../utils/api";
import { canManageDivisions } from "../utils/permissions";
import { useAuth } from "../contexts/AuthContext";

export const Divisions = () => {
  const { user } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/divisions/");

      const divisionData = Array.isArray(data) ? data : data.results;

      if (!Array.isArray(divisionData)) {
        console.error("Invalid API response format:", data);
        throw new Error("Invalid response format from server");
      }

      const mappedDivisions: Division[] = divisionData.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description,
        userCount: item.user_count,
        archiveCount: item.archive_count,
        createdAt: item.created_at,
      }));

      setDivisions(mappedDivisions);
    } catch (error) {
      console.error("Failed to fetch divisions:", error);
      alert("Gagal memuat data divisi: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageDivisions(user)) {
      fetchDivisions();
    }
  }, [user]);

  const handleAdd = () => {
    setModalMode("add");
    setSelectedDivision(null);
    setIsModalOpen(true);
  };

  const handleEdit = (division: Division) => {
    setModalMode("edit");
    setSelectedDivision(division);
    setIsModalOpen(true);
  };

  const handleDelete = async (division: Division) => {
    if (window.confirm(`Are you sure you want to delete ${division.name}?`)) {
      try {
        await apiRequest(`/divisions/${division.id}/`, { method: "DELETE" });
        fetchDivisions();
      } catch (error: any) {
        if (error.message?.includes("protected")) {
          alert("Cannot delete division with associated data");
        } else {
          alert("Gagal menghapus divisi");
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      setSubmitting(true);

      if (modalMode === "add") {
        const divisionData = {
          name: formData.get("name")?.toString() || "",
          description: formData.get("description")?.toString() || "",
        };

        if (!divisionData.name.trim()) {
          alert("Nama divisi wajib diisi");
          return;
        }

        await apiRequest("/divisions/", {
          method: "POST",
          body: JSON.stringify(divisionData),
        });
      } else if (modalMode === "edit" && selectedDivision) {
        const divisionData = {
          name: formData.get("name")?.toString() || "",
          description: formData.get("description")?.toString() || "",
        };

        await apiRequest(`/divisions/${selectedDivision.id}/`, {
          method: "PUT",
          body: JSON.stringify(divisionData),
        });
      }

      setIsModalOpen(false);
      fetchDivisions();
    } catch (error: any) {
      console.error("Submit error:", error);
      if (error.message.includes("name")) {
        alert("Nama divisi sudah digunakan atau tidak valid");
      } else {
        alert("Gagal menyimpan divisi: " + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageDivisions(user)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Divisions</h1>
        <p className="text-yellow-600">You do not have permission to manage divisions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Divisions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage organizational divisions and departments</p>
        </div>
        <Button onClick={handleAdd} icon={<Plus className="w-5 h-5" />}>
          Add Division
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {divisions.map((division) => (
            <Card key={division.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{division.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{division.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Users</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{division.userCount || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Archives</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{division.archiveCount || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(division)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(division)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === "add" ? "Add New Division" : "Edit Division"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Division Name" name="name" placeholder="Enter division name" defaultValue={selectedDivision?.name} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              name="description"
              placeholder="Enter division description"
              defaultValue={selectedDivision?.description}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : modalMode === "add" ? "Add Division" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
