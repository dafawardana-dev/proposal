import { User } from '../types';

export const hasPermission = (user: User | null, permissionCodename: string): boolean => {
  if (!user) return false;
  if (!user.role) return false;
  if (user.role.name === 'Super Admin') return true;
  if (!user.role.permissions) return false;
  
  return user.role.permissions.some(
    perm => perm.codename === permissionCodename
  );
};

// Master Data
export const canCrudReligions = (user: User | null) => 
  hasPermission(user, 'can_crud_religions');

export const canCrudWilayah = (user: User | null) => 
  hasPermission(user, 'can_crud_wilayah');

export const canCrudEducations = (user: User | null) => 
  hasPermission(user, 'can_crud_educations');

// User & Role Management
export const canManageUsers = (user: User | null) => 
  hasPermission(user, 'can_manage_users');

export const canManageRoles = (user: User | null) => 
  hasPermission(user, 'can_manage_roles');

export const canManageDivisions = (user: User | null) => 
  hasPermission(user, 'can_manage_divisions');

// Archive Management
export const canUploadArchives = (user: User | null) => 
  hasPermission(user, 'can_upload_archives');

export const canEditOwnArchives = (user: User | null) => 
  hasPermission(user, 'can_edit_own_archives');

export const canDeleteOwnArchives = (user: User | null) => 
  hasPermission(user, 'can_delete_own_archives');

export const canViewAllArchives = (user: User | null) => 
  hasPermission(user, 'can_view_all_archives');

export const canCrudKonsentrasiUtama = (user: User | null) =>
  hasPermission(user, 'can_crud_konsentrasi_utama');

export const canCrudProdis = (user: User | null) =>
  hasPermission(user, 'can_crud_prodis');

export const canCrudMahasiswa = (user: User | null) =>
  hasPermission(user, 'can_crud_mahasiswa');

export const canCrudDosen = (user: User | null) =>
  hasPermission(user, 'can_crud_dosen');

export const canSubmitProposal = (user: User | null) => 
  hasPermission(user, 'can_submit_proposal');

export const canManageProposals = (user: User | null) => 
  hasPermission(user, 'can_manage_proposals');

export const canViewProposals = (user: User | null) => 
  hasPermission(user, 'can_view_own_proposals');