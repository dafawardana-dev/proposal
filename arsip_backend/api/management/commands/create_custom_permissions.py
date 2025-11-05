from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from api.models import Role

class Command(BaseCommand):
    help = 'Create custom permissions and assign to Super Admin role'

    def handle(self, *args, **options):
        # Gunakan model User sebagai content_type (karena global)
        content_type = ContentType.objects.get_for_model(User)
        
        permissions_to_add = [
            ("can_crud_konsentrasi_utama", "Can create, read, update, delete konsentrasi utama data"),
            ("can_crud_prodis", "Can create, read, update, delete prodi data"),
            ("can_crud_mahasiswa", "Can create, read, update, delete mahasiswa data"),
            ("can_crud_dosen", "Can create, read, update, delete dosen data"),
            ("can_manage_users", "Can manage all users"),
            ("can_manage_roles", "Can manage roles"),
            ("can_manage_divisions", "Can manage divisions"),
            ("can_manage_proposals", "Can approve/reject proposals"),
            ("can_crud_educations", "Can create, read, update, delete educations data"),
            ("can_crud_wilayah", "Can create, read, update, delete wilayah data"),
            ("can_crud_religions", "Can create, read, update, delete religion data")
        ]

        # Buat atau dapatkan permission
        created_count = 0
        for codename, name in permissions_to_add:
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={'name': name, 'content_type': content_type}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ Created: {codename}"))
                created_count += 1
            else:
                self.stdout.write(self.style.WARNING(f"⚠️ Exists: {codename}"))

        # Assign ke Super Admin
        try:
            super_admin = Role.objects.get(name="Super Admin")
            
            # Ambil semua permission yang baru dibuat/ada
            perms_to_assign = Permission.objects.filter(
                codename__in=[codename for codename, _ in permissions_to_add]
            )
            
            # Tambahkan ke role (gunakan add() dengan queryset untuk efisiensi)
            super_admin.permissions.add(*perms_to_assign)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Berhasil menambahkan {perms_to_assign.count()} permission ke role 'Super Admin'"
                )
            )
            
        except Role.DoesNotExist:
            self.stdout.write(
                self.style.ERROR("❌ Role 'Super Admin' tidak ditemukan. Permission tidak di-assign.")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error saat assign permission: {str(e)}")
            )