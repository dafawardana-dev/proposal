// src/pages/ManageUsers.tsx
import { useState, useEffect } from "react";
import { DataGrid } from "../components/ui/DataGrid";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { User, Division, Role } from "../types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import {apiRequest} from "../utils/api";

export const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/users/");
      const userData = Array.isArray(data) ? data : data.results;

      const mappedUsers: User[] = (userData || []).map((item: any) => ({
        id: String(item.id),
        username: item.username,
        name: `${item.first_name} ${item.last_name}`.trim(),
        email: item.email,
        role: item.role ? {
          id: item.role.id,
          name: item.role.name || "Tidak Ada Role"
        } : { id: "", name: "Tidak Ada Role" },
        divisionId: String(item.division?.id || ""),
        divisionName: item.division?.name || "N/A",
        createdAt: item.date_joined,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const data = await apiRequest("/divisions/");
      const divisionData = Array.isArray(data) ? data : data.results;
      setDivisions(divisionData || []);
    } catch (error) {
      console.error("Failed to fetch divisions:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await apiRequest("/roles/");
      const roleData = Array.isArray(data) ? data : data.results;
      setRoles(roleData || []);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDivisions();
    fetchRoles();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = () => {
    setModalMode("add");
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Anda yakin ingin menghapus pengguna ${user.name}?`)) {
      setSubmitting(true);
      apiRequest(`/users/${user.id}/`, { method: "DELETE" })
        .then(() => {
          fetchUsers(); // Refresh data
        })
        .catch((error) => alert("Gagal menghapus pengguna: " + error.message))
        .finally(() => setSubmitting(false));
    }
  };
  
  const getRoleBadgeVariant = (roleName: string) => {
  const name = roleName.toLowerCase();
  if (name.includes('super admin')) return "danger";
  if (name.includes('staff')) return "info";
  if (name.includes('operator')) return "success";
  return "default";
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const [firstName, ...lastNameParts] = (formData.get("name") as string).split(" ");
    const lastName = lastNameParts.join(" ");

    const userData: Record<string, any> = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      first_name: firstName,
      last_name: lastName,
      role_id: formData.get("role") as string,
      division_id: formData.get("division") as string,
    };

    if (modalMode === "add") {
    const password = formData.get("password") as string;
    if (!password) {
      alert("Password wajib diisi");
      return;
    }
    userData.password = password; 
  }

    try {
      setSubmitting(true);
      if (modalMode === "add") {
        if (!userData.password) {
          alert("Password wajib diisi untuk pengguna baru.");
          setSubmitting(false);
          return;
        }
        await apiRequest("/users/", {
          method: "POST",
          body: JSON.stringify(userData),
        });
      } else if (selectedUser) {
        await apiRequest(`/users/${selectedUser.id}/`, {
          method: "PUT",
          body: JSON.stringify(userData),
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      let errorMessage = "Gagal menyimpan pengguna.";
      if (error.message) {
        try {
          const errorObj = JSON.parse(error.message);
          errorMessage = Object.values(errorObj).flat().join("\n");
        } catch (e) {
          errorMessage = error.message;
        }
      }
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">{user.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user: User) => {
        const roleName = user.role?.name || 'Tidak Ada Role';
        return <Badge variant={getRoleBadgeVariant(roleName)}>{roleName}</Badge>;
      },
    },
    {
      key: "divisionName",
      header: "Division",
    },
    {
      key: "createdAt",
      header: "Created At",
      render: (user: User) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(user)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <button onClick={() => handleDelete(user)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add, edit, and manage user accounts</p>
        </div>
        <Button onClick={handleAdd} icon={<Plus className="w-5 h-5" />}>
          Add User
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <DataGrid columns={columns} data={paginatedUsers} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === "add" ? "Add New User" : "Edit User"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" name="name" placeholder="Enter full name" defaultValue={selectedUser?.name} required />
          <Input label="Username" name="username" placeholder="Enter username" defaultValue={selectedUser?.username} required />
          <Input type="email" name="email" label="Email Address" placeholder="Enter email address" defaultValue={selectedUser?.email} required />
         {modalMode === "add" && (
            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Enter password"
              required
            />
          )}
          <Select name="role" label="Role" defaultValue={selectedUser?.role.id} options={roles.map((role) => ({ value: role.id, label: role.name }))} required />
          <Select
            name="division"
            label="Division"
            defaultValue={selectedUser?.divisionId}
            options={divisions.map((div) => ({
              value: div.id,
              label: div.name,
            }))}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving..." : modalMode === "add" ? "Add User" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};