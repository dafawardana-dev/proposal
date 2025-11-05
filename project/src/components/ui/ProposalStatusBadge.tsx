import { Badge } from './Badge';

export const ProposalStatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { text: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
    approved: { text: 'Disetujui', color: 'bg-green-100 text-green-800' },
    rejected: { text: 'Ditolak', color: 'bg-red-100 text-red-800' },
  }[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

  return <Badge variant="custom" className={config.color}>{config.text}</Badge>;
};