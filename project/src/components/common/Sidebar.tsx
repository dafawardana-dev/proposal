// src/components/common/Sidebar.tsx
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings,
  LogOut,
  GraduationCap, 
  Globe,          
  MapPin,
  ChevronDown,
  ChevronRight,
  FileText, 
  CheckCircle 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // ✅ Tambahkan ini

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  permission?: string;
}

interface SidebarProps {
  activeTab: string; // Masih digunakan untuk highlight
  isOpen: boolean;
  isCollapsed?: boolean;
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'dashboard':
      return <LayoutDashboard className="w-5 h-5" />;
    case 'users':
      return <Users className="w-5 h-5" />;
    case 'divisions':
      return <Building2 className="w-5 h-5" />;
    case 'settings':
      return <Settings className="w-5 h-5" />;
    case 'educations':
      return <GraduationCap className="w-5 h-5" />;
    case 'religions':
      return <Globe className="w-5 h-5" />;
    case 'wilayah':
      return <MapPin className="w-5 h-5" />;
    case 'master-data':
      return <Globe className="w-5 h-5" />;
    case 'management':
      return <Settings className="w-5 h-5" />;
    case 'file-text':
      return <FileText className="w-5 h-5" />;
    case 'check-circle':  
      return <CheckCircle className="w-5 h-5" />;
    default:
      return <LayoutDashboard className="w-5 h-5" />;    
  }
};

export const Sidebar = ({ 
  activeTab, 
  isOpen,
  isCollapsed = false
}: SidebarProps) => {
  const { logout, user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation(); // ✅ Untuk mobile close

  const hasPermission = (permissionCodename: string): boolean => {
    if (!user?.role?.permissions) return false;
    return user.role.permissions.some(p => p.codename === permissionCodename);
  };

  // Grup Master Data
  const masterDataItems: SidebarItem[] = [    
    { id: "bimbingan", label: "Kelola Bimbingan", icon: "users", permission: "can_manage_proposals" },
    { id: "manage-proposals", label: "Kelola Proposal", icon: "check-circle", permission: "can_manage_proposals" },
    { id: "proposal-status", label: "Status Proposal", icon: "check-circle", permission: "can_view_own_proposals" },
    { id: "submit-proposal", label: "Ajukan Proposal", icon: "file-text", permission: "can_submit_proposal" },
    { id: "konsentrasi-utama", label: "Kelola Konsentrasi", icon: "graduation-cap", permission: "can_crud_konsentrasi_utama" },
    { id: "dosen", label: "Kelola Dosen", icon: "users", permission: "can_crud_dosen" },
    { id: "mahasiswa", label: "Kelola Mahasiswa", icon: "users", permission: "can_crud_mahasiswa" },
    { id: 'wilayah', label: 'Kelola Wilayah', icon: 'wilayah', permission: 'can_crud_wilayah' },
    { id: 'prodis', label: 'Kelola Prodi', icon: 'educations', permission: 'can_crud_prodis' },
    { id: 'educations', label: 'Kelola Pendidikan', icon: 'educations', permission: 'can_crud_educations' },
    { id: 'religions', label: 'Kelola Agama', icon: 'religions', permission: 'can_crud_religions' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  // Grup Manajemen
  const managementItems: SidebarItem[] = [
    { id: 'divisions', label: 'Kelola Divisi', icon: 'divisions', permission: 'can_manage_divisions' },
    { id: 'roles', label: 'Kelola Role', icon: 'settings', permission: 'can_manage_roles' },
    { id: 'users', label: 'Users', icon: 'users', permission: 'can_manage_users' },
    { id: 'settings', label: 'Pengaturan', icon: 'settings' },
  ].filter(item => !item.permission || hasPermission(item.permission));

  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(true);

  const sidebarClass = isCollapsed 
    ? "w-20" 
    : "w-64";
  
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {      
    }
  }, [location.pathname, isOpen]);


  const getPathFromId = (id: string): string => {
    return id === 'dashboard' ? '/' : `/${id}`;
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 ${sidebarClass} bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-gray-900 dark:text-white">Arsip</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {/* Dashboard */}
            <li>
              <Link
                to="/"
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {getIcon('dashboard')}
                {!isCollapsed && 'Dashboard'}
              </Link>
            </li>

            {/* Master Data Accordion */}
            {masterDataItems.length > 0 && !isCollapsed && (
              <li>
                <button
                  onClick={() => setMasterDataOpen(!masterDataOpen)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getIcon('master-data')}
                    Master Data
                  </div>
                  {masterDataOpen ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </button>
                
                {masterDataOpen && (
                  <ul className="mt-1 space-y-1 ml-6">
                    {masterDataItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={getPathFromId(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {getIcon(item.icon)}
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}

            {/* Management Accordion */}
            {managementItems.length > 0 && !isCollapsed && (
              <li>
                <button
                  onClick={() => setManagementOpen(!managementOpen)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getIcon('management')}
                    Manajemen
                  </div>
                  {managementOpen ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </button>
                
                {managementOpen && (
                  <ul className="mt-1 space-y-1 ml-6">
                    {managementItems.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={getPathFromId(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {getIcon(item.icon)}
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        {user && !isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name || user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role?.name || 'N/A'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};