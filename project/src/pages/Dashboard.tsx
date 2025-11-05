import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody } from '../components/ui/Card';
import { 
  Users, Building2, Globe, MapPin, GraduationCap, 
  TrendingUp, FileText, CheckCircle, AlertCircle 
} from 'lucide-react';
import { apiRequest } from '../utils/api';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Untuk admin
  const [stats, setStats] = useState({
    users: 0,
    divisions: 0,
    religions: 0,
    wilayah: 0,
    education_levels: 0
  });
  
  // Untuk mahasiswa
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);
  const [proposalTitle, setProposalTitle] = useState<string | null>(null);

  // Cek role user
  const isAdmin = user?.role?.permissions?.some(p => 
    p.codename === 'can_manage_users' || 
    p.codename === 'can_manage_divisions' ||
    p.codename === 'can_manage_roles'
  );

  const isMahasiswa = user?.role?.permissions?.some(p => 
    p.codename === 'can_submit_proposal' ||
    p.codename === 'can_view_own_proposals'
  );

  // Fetch data berdasarkan role
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Ambil statistik untuk admin
        const response = await apiRequest('/dashboard-stats/');
        setStats({
          users: response.users || 0,
          divisions: response.divisions || 0,
          religions: response.religions || 0,
          wilayah: response.wilayah || 0,
          education_levels: response.education_levels || 0
        });
      } else if (isMahasiswa) {
        // Ambil status proposal untuk mahasiswa
        const proposals = await apiRequest('/proposals/');
        const myProposals = Array.isArray(proposals) ? proposals : proposals.results || [];
        
        if (myProposals.length > 0) {
          const latest = myProposals[0];
          setProposalStatus(latest.status);
          setProposalTitle(latest.judul);
        } else {
          setProposalStatus('no_proposal');
        }
      }
      
    } catch (error: any) {
      console.error('Dashboard API Error:', error);
      if (isAdmin) {
        setStats({
          users: 0,
          divisions: 0,
          religions: 0,
          wilayah: 0,
          education_levels: 0
        });
      } else if (isMahasiswa) {
        setProposalStatus('error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Statistik untuk admin
  const adminStats = [
    {
      id: 1,
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      id: 2,
      title: 'Divisions',
      value: stats.divisions,
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 3,
      title: 'Agama',
      value: stats.religions,
      icon: Globe,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 4,
      title: 'Wilayah',
      value: stats.wilayah,
      icon: MapPin,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      id: 5,
      title: 'Jenjang Pendidikan',
      value: stats.education_levels,
      icon: GraduationCap,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 6,
      title: 'Total Data Master',
      value: stats.religions + stats.wilayah + stats.education_levels,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  // Tampilan untuk mahasiswa
  const renderMahasiswaDashboard = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Info Pribadi */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user?.name?.charAt(0) || 'M'}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Mahasiswa • {user?.divisionName || 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Status Proposal */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Status Proposal
                </h3>
                {proposalStatus === 'no_proposal' ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    Anda belum mengajukan proposal.
                  </p>
                ) : proposalStatus === 'error' ? (
                  <p className="text-red-600 dark:text-red-400">
                    Gagal memuat status proposal.
                  </p>
                ) : (
                  <>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {proposalTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {proposalStatus === 'pending' && (
                        <>
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-yellow-600">Menunggu Konfirmasi</span>
                        </>
                      )}
                      {proposalStatus === 'approved' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Disetujui</span>
                        </>
                      )}
                      {proposalStatus === 'rejected' && (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-red-600">Ditolak</span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardBody>
        </Card>

        {/* Aksi Cepat */}
        {/* <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => window.location.href = '/submit-proposal'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FileText className="w-4 h-4" />
                Ajukan Proposal
              </button>
              <button 
                onClick={() => window.location.href = '/proposal-status'}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <FileText className="w-4 h-4" />
                Lihat Status Proposal
              </button>
            </div>
          </CardBody>
        </Card> */}
      </div>
    );
  };

  // Tampilan untuk admin
  const renderAdminDashboard = () => {
    return (
      <>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {adminStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.id}>
                  <CardBody className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Progres Master Data */}
        {!loading && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Master Data Overview</h3>
            </div>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agama</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.religions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, stats.religions)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wilayah</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.wilayah}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, stats.wilayah)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jenjang Pendidikan</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.education_levels}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, stats.education_levels)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isAdmin 
            ? "Here's your system overview." 
            : "Here's your academic dashboard."}
        </p>
      </div>

      {isAdmin ? renderAdminDashboard() : renderMahasiswaDashboard()}
    </div>
  );
};