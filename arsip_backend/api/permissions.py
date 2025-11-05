from rest_framework import permissions

class BasePermission(permissions.BasePermission):
    permission_codename = None
    
    def has_permission(self, request, view):        
        if not request.user.is_authenticated:
            return False
                
        if request.user.is_superuser:
            return True
                    
        if not hasattr(request.user, 'role') or not request.user.role:
            return False
                
        if self.permission_codename is None:
            return False
            
        return request.user.role.permissions.filter(
            codename=self.permission_codename
        ).exists()

class CanManageUsers(BasePermission):
    permission_codename = 'can_manage_users'

class CanManageDivisions(BasePermission):
    permission_codename = 'can_manage_divisions'

class CanManageRoles(BasePermission):
    permission_codename = 'can_manage_roles'

class CanViewAllArchives(BasePermission):
    permission_codename = 'can_view_all_archives'

class CanEditOwnArchives(BasePermission):
    permission_codename = 'can_edit_own_archives'

class CanDeleteOwnArchives(BasePermission):
    permission_codename = 'can_delete_own_archives'

class CanUploadArchives(BasePermission):
    permission_codename = 'can_upload_archives'

class CanCrudEducations(BasePermission):
    permission_codename = 'can_crud_educations'

class CanCrudWilayah(BasePermission):
    permission_codename = 'can_crud_wilayah'

class CanCrudReligions(BasePermission):
    permission_codename = 'can_crud_religions'

class CanCrudKonsentrasiUtama(BasePermission):
    permission_codename = 'can_crud_konsentrasi_utama'

class CanCrudProdis(BasePermission):
    permission_codename = 'can_crud_prodis'