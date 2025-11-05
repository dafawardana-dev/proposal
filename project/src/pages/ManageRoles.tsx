import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Role, Permission } from "../types";
import { Plus, Pencil, Trash2, ShieldCheck, Users } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { canManageUsers } from "../utils/permissions";

const PERMISSION_CATEGORIES = [
  {
    id: "master_data",
    label: "Master Data",
    permissions: ["can_crud_educations", "can_crud_wilayah", "can_crud_religions", "can_crud_prodis", "can_crud_mahasiswa", "can_crud_konsentrasi_utama", "can_crud_dosen", "can_manage_proposals", "can_view_own_proposals","can_submit_proposal"],
  },
  {
    id: "users_roles",
    label: "User & Role",
    permissions: ["can_manage_users", "can_manage_roles", "can_manage_divisions"],
  },
];
export const ManageRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/roles/");
      const roleData = Array.isArray(data) ? data : data.results || [];
      setRoles(roleData);

      const permissionMap = new Map<number, Permission>();
      roleData.forEach((role) => {
        role.permissions.forEach((perm) => {
          permissionMap.set(perm.id, perm);
        });
      });
      setPermissions(Array.from(permissionMap.values()));
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      alert("Gagal memuat data role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers(user)) {
      fetchRoles();
    }
  }, [user]);

  const handleAdd = () => {
    setModalMode("add");
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setModalMode("edit");
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      try {
        await apiRequest(`/roles/${role.id}/`, { method: "DELETE" });
        fetchRoles();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Gagal menghapus role");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const selectedPermissionIds = permissions.filter((p) => formData.get(`perm_${p.id}`)).map((p) => p.id);

    const roleData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      permission_ids: selectedPermissionIds,
    };

    try {
      setSubmitting(true);
      if (modalMode === "add") {
        await apiRequest("/roles/", {
          method: "POST",
          body: JSON.stringify(roleData),
        });
      } else if (selectedRole) {
        await apiRequest(`/roles/${selectedRole.id}/`, {
          method: "PUT",
          body: JSON.stringify(roleData),
        });
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error("Submit failed:", error);
      alert(`Gagal menyimpan role: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageUsers(user)) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Manage Roles</h1>
        <p className="text-yellow-600">You do not have permission to manage roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Roles</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Define user roles and their permissions</p>
        </div>
        <Button onClick={handleAdd} icon={<Plus className="w-5 h-5" />}>
          Add Role
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{role.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Permissions</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{role.permissions.length}</span>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(role)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === "add" ? "Add New Role" : "Edit Role"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Role Name" name="name" placeholder="Enter role name" defaultValue={selectedRole?.name} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              name="description"
              placeholder="Enter role description"
              defaultValue={selectedRole?.description}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
            <div className="max-h-60 overflow-y-auto space-y-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              {PERMISSION_CATEGORIES.map((category) => {
                const categoryPermissions = permissions.filter((perm) => category.permissions.includes(perm.codename));
                if (categoryPermissions.length === 0) return null;

                return (
                  <div key={category.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">{category.label}</h4>
                    <div className="space-y-2">
                      {categoryPermissions.map((perm) => {
                        const isChecked = selectedRole?.permissions.some((p) => p.id === perm.id) || false;
                        return (
                          <div key={perm.id} className="flex items-center">
                            <input id={`perm_${perm.id}`} name={`perm_${perm.id}`} type="checkbox" defaultChecked={isChecked} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor={`perm_${perm.id}`} className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                              {perm.name}
                              <span className="ml-2 text-xs text-gray-500">({perm.codename})</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : modalMode === "add" ? "Add Role" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
