import pandas as pd
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from rest_framework import viewsets, generics, status, views, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import Permission
from .models import User, Division, Role, Wilayah, Religion, EducationLevel, KonsentrasiUtama, Prodi, Mahasiswa, Dosen, Proposal, Bimbingan
from rest_framework import status
from .serializers import (UserSerializer, DivisionSerializer, LoginSerializer, RegisterSerializer, RoleSerializer, PermissionSerializer,WilayahSerializer, EducationLevelSerializer, ReligionSerializer,KonsentrasiUtamaSerializer,ProdiSerializer, MahasiswaSerializer,DosenSerializer, ProposalSerializer, BimbinganSerializer, RegisterMahasiswaSerializer)
from .permissions import ( CanManageUsers, CanManageDivisions, CanViewAllArchives,CanEditOwnArchives, CanDeleteOwnArchives, CanUploadArchives,CanCrudEducations, CanCrudWilayah, CanCrudReligions, CanManageUsers, CanManageRoles, CanManageDivisions, CanUploadArchives, CanViewAllArchives,)
from django.utils import timezone
from .pagination import Pagination
from django.db import IntegrityError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend

User = get_user_model()
class LoginView(views.APIView):    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            mahasiswa = Mahasiswa.objects.get(user=user)
            is_mahasiswa = True
            nim = mahasiswa.nim
            nama_mahasiswa = mahasiswa.nama_mahasiswa
            prodi = mahasiswa.prodi.name if mahasiswa.prodi else None
            konsentrasi = mahasiswa.konsentrasi.name if mahasiswa.konsentrasi else None
        except Mahasiswa.DoesNotExist:
            is_mahasiswa = False
            nim = None
            nama_mahasiswa = None
            prodi = None
            konsentrasi = None

        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user, context={'request': request}).data
        
        user_data.update({
            'is_mahasiswa': is_mahasiswa,
            'nim': nim,
            'nama_mahasiswa': nama_mahasiswa,
            'prodi': prodi,
            'konsentrasi': konsentrasi,
        })

        return Response({
            'token': token.key,
            'user': user_data,
            'message': 'Login successful'
        })

class RegisterView(views.APIView):    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user, context={'request': request}).data
        
        return Response({
            'token': token.key,
            'user': user_data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)

class RoleListView(generics.ListCreateAPIView):
    queryset = Role.objects.prefetch_related('permissions')
    serializer_class = RoleSerializer
    permission_classes = [CanManageUsers]

class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Role.objects.prefetch_related('permissions')
    serializer_class = RoleSerializer
    permission_classes = [CanManageUsers]

class PermissionListView(generics.ListAPIView):
    serializer_class = PermissionSerializer

    def get_queryset(self):
        master_ct = ContentType.objects.get_for_model(MasterPermission)
        return Permission.objects.filter(content_type=master_ct)

class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.select_related('role', 'division')
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.select_related('role', 'division')
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]

class DivisionListView(generics.ListCreateAPIView):
    queryset = Division.objects.all()
    serializer_class = DivisionSerializer
    permission_classes = [CanManageDivisions]

class DivisionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Division.objects.all()
    serializer_class = DivisionSerializer
    permission_classes = [CanManageDivisions]

class ReligionListCreateView(generics.ListCreateAPIView):

    queryset = Religion.objects.all().order_by('name')
    serializer_class = ReligionSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReligionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Religion.objects.all()
    serializer_class = ReligionSerializer
    permission_classes = [permissions.IsAuthenticated]

class WilayahApiListView(generics.ListAPIView):
    serializer_class = WilayahSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        level = self.request.query_params.get('level')
        parent_code = self.request.query_params.get('parent_code') 

        queryset = Wilayah.objects.all().order_by('code')
        
        if level:
            try:
                level = int(level)
                if 1 <= level <= 4:
                    queryset = queryset.filter(level=level)
            except (ValueError, TypeError):
                pass

        if parent_code:
            queryset = queryset.filter(parent_code=parent_code)

        return queryset

class WilayahListView(generics.ListAPIView):
    serializer_class = WilayahSerializer
    permission_classes = [permissions.AllowAny]    

    def get_queryset(self):
        level = self.request.query_params.get('level')
        parent_code = self.request.query_params.get('parent_code')  

        queryset = Wilayah.objects.all().order_by('code')          
        if level:
            try:
                level = int(level)
                if 1 <= level <= 4:
                    queryset = queryset.filter(level=level)
            except (ValueError, TypeError):
                pass  

        if parent_code:
            queryset = queryset.filter(parent_code=parent_code)

        return queryset

class WilayahDetailView(generics.RetrieveAPIView):
    queryset = Wilayah.objects.all()
    serializer_class = WilayahSerializer
    permission_classes = [permissions.AllowAny]

class EducationLevelListView(generics.ListCreateAPIView):
    queryset = EducationLevel.objects.all()
    serializer_class = EducationLevelSerializer
    permission_classes = [permissions.IsAuthenticated]

class EducationLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = EducationLevel.objects.all()
    serializer_class = EducationLevelSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProdiViewSet(viewsets.ModelViewSet):
    queryset = Prodi.objects.all()
    serializer_class = ProdiSerializer
    permission_classes = [AllowAny]
    pagination_class = Pagination

    @action(detail=False, methods=['get'], url_path='dropdown')
    def dropdown(self, request):
        print(" Dropdown called")
        prodis = Prodi.objects.all().values('id', 'name')
        print(f"Found {len(prodis)} prodi")
        return Response(list(prodis))

    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "File wajib diunggah"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ext = file.name.split('.')[-1].lower()
            if ext == 'xlsx':
                df = pd.read_excel(BytesIO(file.read()), engine='openpyxl')
            elif ext == 'csv':
                try:
                    df = pd.read_csv(BytesIO(file.read()), encoding='utf-8-sig')
                except UnicodeDecodeError:
                    file.seek(0)
                    df = pd.read_csv(BytesIO(file.read()), encoding='latin-1')
            else:
                return Response({"error": "Format file tidak didukung. Gunakan .xlsx atau .csv"}, status=status.HTTP_400_BAD_REQUEST)
            
            required_fields = {'code', 'name'}
            missing = required_fields - set(df.columns)
            if missing:
                return Response({
                    "error": f"Kolom wajib tidak ditemukan: {missing}. Kolom file: {list(df.columns)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            created = updated = 0
            errors = []

            for idx, row in df.iterrows():
                try:
                    code = str(row['code']).strip()
                    name = str(row['name']).strip()
                    if not code or not name:
                        errors.append(f"Baris {idx+2}: code atau name kosong")
                        continue

                    obj, created_flag = Prodi.objects.update_or_create(
                        code=code,
                        defaults={'name': name}
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:
                    errors.append(f"Baris {idx+2}: {str(e)}")

            return Response({
                "message": "Upload berhasil",
                "created": created,
                "updated": updated,
                "errors": errors[:20]
            })

        except Exception as e:
            return Response({"error": f"Error memproses file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class KonsentrasiUtamaViewSet(viewsets.ModelViewSet):
    queryset = KonsentrasiUtama.objects.select_related('prodi').all()
    serializer_class = KonsentrasiUtamaSerializer
    permission_classes = [AllowAny]
    pagination_class = Pagination
    
    @action(detail=False, methods=['get'], url_path='dropdown')
    def dropdown(self, request):
        print("Dropdown called")
        konsentrasis = KonsentrasiUtama.objects.all().values('id', 'name')
        print(f"Found {len(konsentrasis)} konsentrasi")
        return Response([
            {'id': k['id'], 'name': k['name']} for k in konsentrasis
        ])            
    
    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "File wajib diunggah"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ext = file.name.split('.')[-1].lower()
            if ext == 'xlsx':
                df = pd.read_excel(BytesIO(file.read()), engine='openpyxl')
            elif ext == 'csv':
                try:
                    df = pd.read_csv(BytesIO(file.read()), encoding='utf-8-sig')
                except UnicodeDecodeError:
                    file.seek(0)
                    df = pd.read_csv(BytesIO(file.read()), encoding='latin-1')
            else:
                return Response({"error": "Format file tidak didukung. Gunakan .xlsx atau .csv"}, status=status.HTTP_400_BAD_REQUEST)

            required_fields = {'code', 'name'}
            missing = required_fields - set(df.columns)
            if missing:
                return Response({
                    "error": f"Kolom wajib tidak ditemukan: {missing}. Kolom file: {list(df.columns)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            created = updated = 0
            errors = []

            for idx, row in df.iterrows():
                try:
                    code = str(row['code']).strip()
                    name = str(row['name']).strip()
                    if not code or not name:
                        errors.append(f"Baris {idx+2}: code atau name kosong")
                        continue

                    obj, created_flag = KonsentrasiUtama.objects.update_or_create(
                        code=code,
                        defaults={'name': name}
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
                except Exception as e:
                    errors.append(f"Baris {idx+2}: {str(e)}")

            return Response({
                "message": "Upload berhasil",
                "created": created,
                "updated": updated,
                "errors": errors[:20]
            })

        except Exception as e:
            return Response({"error": f"Error memproses file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def konsentrasi_by_prodi(request, prodi_id):
    konsentrasi_list = KonsentrasiUtama.objects.filter(prodi_id=prodi_id).values('id', 'name')
    return Response(list(konsentrasi_list))

class MahasiswaViewSet(viewsets.ModelViewSet):
    queryset = Mahasiswa.objects.select_related('tempat_lahir', 'prodi').prefetch_related('konsentrasi')
    serializer_class = MahasiswaSerializer
    permission_classes = [permissions.IsAuthenticated]        
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = [
        'nim', 'nama_mahasiswa', 'prodi__nama', 'konsentrasi__nama',
        'tempat_lahir__name', 'judul_skripsi'
    ]
    filterset_fields = ['prodi', 'tahun_masuk', 'jk']

    def get_queryset(self):
        queryset = Mahasiswa.objects.select_related('prodi', 'konsentrasi', 'tempat_lahir')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nim__icontains=search) | Q(nama_mahasiswa__icontains=search)
            )
        return queryset

    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "File wajib diunggah"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ext = file.name.split('.')[-1].lower()
            if ext == 'xlsx':
                df = pd.read_excel(BytesIO(file.read()), engine='openpyxl')
            elif ext == 'csv':
                try:
                    df = pd.read_csv(BytesIO(file.read()), encoding='utf-8-sig')
                except UnicodeDecodeError:
                    file.seek(0)
                    df = pd.read_csv(BytesIO(file.read()), encoding='latin-1')
            else:
                return Response({"error": "Format file tidak didukung. Gunakan .xlsx atau .csv"}, status=status.HTTP_400_BAD_REQUEST)
            
            allowed_fields = {
                'nim', 'nama_mahasiswa','alamat', 'tempat_lahir', 'tgl_lahir',
                'jk', 'tahun_masuk', 'prodi', 'konsentrasi', 'judul_skripsi'
            }
            required_fields = {'nim', 'nama_mahasiswa', 'prodi'}

            missing_required = required_fields - set(df.columns)
            if missing_required:
                return Response({
                    "error": f"Kolom wajib tidak ditemukan: {missing_required}. Kolom file: {list(df.columns)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            valid_columns = [col for col in df.columns if col in allowed_fields]
            df = df[valid_columns]

            created = 0
            errors = []

            for idx, row in df.iterrows():
                try:                    
                    nim = str(row['nim']).strip()
                    nama = str(row['nama_mahasiswa']).strip()
                    prodi_code = str(row['prodi']).strip()

                    if not nim or not nama or not prodi_code:
                        errors.append(f"Baris {idx+2}: nim, nama, atau prodi kosong")
                        continue
                    
                    try:
                        prodi = Prodi.objects.get(code=prodi_code)
                    except Prodi.DoesNotExist:
                        errors.append(f"Baris {idx+2}: Prodi dengan kode '{prodi_code}' tidak ditemukan")
                        continue

                    konsentrasi = None
                    if 'konsentrasi' in row and pd.notna(row['konsentrasi']):
                        kons_code = str(row['konsentrasi']).strip()
                        try:
                            konsentrasi = KonsentrasiUtama.objects.get(code=kons_code)
                        except KonsentrasiUtama.DoesNotExist:
                            errors.append(f"Baris {idx+2}: Konsentrasi '{kons_code}' tidak ditemukan")
                            continue

                    tempat_lahir = None
                    if 'tempat_lahir' in row and pd.notna(row['tempat_lahir']):
                        wilayah_code = str(row['tempat_lahir']).strip()
                        try:
                            tempat_lahir = Wilayah.objects.get(code=wilayah_code)
                        except Wilayah.DoesNotExist:
                            errors.append(f"Baris {idx+2}: Wilayah '{wilayah_code}' tidak ditemukan")
                            continue
                    
                    tgl_lahir = None
                    if 'tgl_lahir' in row and pd.notna(row['tgl_lahir']):
                        try:
                            tgl_lahir = pd.to_datetime(row['tgl_lahir']).date()
                        except:
                            errors.append(f"Baris {idx+2}: Format tgl_lahir tidak valid")
                            continue
                    
                    Mahasiswa.objects.create(
                        nim=nim,
                        nama_mahasiswa=nama,
                        tempat_lahir=tempat_lahir,
                        tgl_lahir=tgl_lahir,
                        jk=str(row.get('jk', 'L'))[:1].upper() or 'L',
                        tahun_masuk=int(row['tahun_masuk']) if pd.notna(row.get('tahun_masuk')) else 0,
                        prodi=prodi,
                        konsentrasi=konsentrasi,
                        judul_skripsi=str(row.get('judul_skripsi', '')).strip() or ''
                    )
                    created += 1

                except Exception as e:
                    errors.append(f"Baris {idx+2}: {str(e)}")

            return Response({
                "message": "Upload berhasil",
                "created": created,
                "updated": 0,
                "errors": errors[:20]
            })

        except Exception as e:
            return Response({"error": f"Error memproses file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class RegisterMahasiswaView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterMahasiswaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        nim = serializer.validated_data['nim']
        password = serializer.validated_data['password']
        nama_mahasiswa = serializer.validated_data['nama_mahasiswa']

        if Mahasiswa.objects.filter(nim=nim).exists():
            return Response({"detail": "NIM sudah terdaftar."}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=nim).exists():
            return Response({"detail": "Akun dengan NIM ini sudah aktif."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            mahasiswa_role = Role.objects.get(name="Mahasiswa")
        except Role.DoesNotExist:
            return Response({"detail": "Role 'Mahasiswa' tidak ditemukan. Hubungi admin."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            mahasiswa_division = Division.objects.get(name="Mahasiswa")
        except Division.DoesNotExist:            
            mahasiswa_division = Division.objects.create(
                name="Mahasiswa",
                description="Division untuk semua mahasiswa"
            )
        
        user = User.objects.create_user(
            username=nim,
            password=password,
            first_name=nama_mahasiswa.split()[0] if nama_mahasiswa else "",
            last_name=" ".join(nama_mahasiswa.split()[1:]) if len(nama_mahasiswa.split()) > 1 else "",
            role=mahasiswa_role,
            division=mahasiswa_division,
            is_active=True
        )
        
        mahasiswa = Mahasiswa.objects.create(
            user=user,
            nim=nim,
            nama_mahasiswa=nama_mahasiswa,
            tempat_lahir=serializer.validated_data.get('tempat_lahir'),
            alamat=serializer.validated_data.get('alamat'),
            tgl_lahir=serializer.validated_data.get('tgl_lahir'),
            jk=serializer.validated_data.get('jk'),
            tahun_masuk=serializer.validated_data.get('tahun_masuk'),
            prodi=serializer.validated_data.get('prodi'),
            konsentrasi=serializer.validated_data.get('konsentrasi'),
            judul_skripsi=serializer.validated_data.get('judul_skripsi', 'BELUM ADA'),
        )
        
        return Response({
            "message": "Registrasi berhasil. Silakan login dengan NIM dan password Anda.",
            "nim": mahasiswa.nim,
            "user_id": user.id,
            "role": user.role.name,
            "division": user.division.name
        }, status=status.HTTP_201_CREATED)

class DosenViewSet(viewsets.ModelViewSet):
    queryset = Dosen.objects.select_related('tempat_lahir', 'prodi', 'konsentrasi')
    serializer_class = DosenSerializer    
    pagination_class = Pagination
    permission_classes = [permissions.IsAuthenticated]        
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = [
        'nama_dosen', 'prodi__name', 'konsentrasi__name',
        'tempat_lahir__name'
    ]
    filterset_fields = ['prodi', 'jk']

    def get_queryset(self):
        queryset = Dosen.objects.select_related('prodi', 'konsentrasi', 'tempat_lahir')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nidn__icontains=search) | Q(nama_dosen__icontains=search)
            )
        return queryset
    
    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "File wajib diunggah"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ext = file.name.split('.')[-1].lower()
            if ext == 'xlsx':
                df = pd.read_excel(BytesIO(file.read()), engine='openpyxl')
            elif ext == 'csv':
                try:
                    df = pd.read_csv(BytesIO(file.read()), encoding='utf-8-sig')
                except UnicodeDecodeError:
                    file.seek(0)
                    df = pd.read_csv(BytesIO(file.read()), encoding='latin-1')
            else:
                return Response({"error": "Format file tidak didukung. Gunakan .xlsx atau .csv"}, status=status.HTTP_400_BAD_REQUEST)

            allowed_fields = {
                'nidn', 'kode_dosen', 'nama_dosen', 'konsentrasi',
                'gelar_depan', 'gelar_belakang', 'jk', 'tempat_lahir',
                'tgl_lahir', 'prodi', 'status_aktif', 'jabatan_fungsional'
            }
            required_fields = {'nidn', 'kode_dosen', 'nama_dosen', 'prodi'}

            missing_required = required_fields - set(df.columns)
            if missing_required:
                return Response({
                    "error": f"Kolom wajib tidak ditemukan: {missing_required}. Kolom file: {list(df.columns)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            valid_columns = [col for col in df.columns if col in allowed_fields]
            df = df[valid_columns]

            created = updated = 0
            errors = []

            for idx, row in df.iterrows():
                try:
                    nidn = str(row['nidn']).strip()
                    kode_dosen = str(row['kode_dosen']).strip()
                    nama = str(row['nama_dosen']).strip()
                    kode_unit = str(row['kode_unit']).strip()

                    if not all([nidn, kode_dosen, nama, kode_unit]):
                        errors.append(f"Baris {idx+2}: kolom wajib kosong")
                        continue
                    
                    tgl_lahir = None
                    if 'tgl_lahir' in row and pd.notna(row['tgl_lahir']):
                        try:
                            tgl_lahir = pd.to_datetime(row['tgl_lahir']).date()
                        except:
                            errors.append(f"Baris {idx+2}: Format tgl_lahir tidak valid")
                            continue
                    
                    dosen, created_flag = Dosen.objects.update_or_create(
                        nidn=nidn,
                        defaults={
                            'kode_dosen': kode_dosen,
                            'nama_dosen': nama,
                            'gelar_depan': str(row.get('gelar_depan', '')).strip() or None,
                            'gelar_belakang': str(row.get('gelar_belakang', '')).strip() or None,
                            'jk': str(row.get('jk', 'L'))[:1].upper() or 'L',
                            'tempat_lahir': str(row.get('tempat_lahir', '')).strip() or None,
                            'tgl_lahir': tgl_lahir,
                            'kode_unit': kode_unit,
                            'status_aktif': str(row.get('status_aktif', 'Aktif')).strip() or 'Aktif',
                            'jabatan_fungsional': str(row.get('jabatan_fungsional', '')).strip() or None,
                        }
                    )
                    
                    if 'konsentrasi' in row and pd.notna(row['konsentrasi']):
                        kons_codes = str(row['konsentrasi']).split(',')
                        kons_list = []
                        for code in kons_codes:
                            code = code.strip()
                            try:
                                kons = KonsentrasiUtama.objects.get(code=code)
                                kons_list.append(kons)
                            except KonsentrasiUtama.DoesNotExist:
                                errors.append(f"Baris {idx+2}: Konsentrasi '{code}' tidak ditemukan")
                        dosen.konsentrasi.set(kons_list)

                    if created_flag:
                        created += 1
                    else:
                        updated += 1

                except Exception as e:
                    errors.append(f"Baris {idx+2}: {str(e)}")

            return Response({
                "message": "Upload berhasil",
                "created": created,
                "updated": updated,
                "errors": errors[:20]
            })

        except Exception as e:
            return Response({"error": f"Error memproses file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):     
        user = self.request.user
                
        if not hasattr(user, 'role') or user.role is None:
            return Proposal.objects.none()
        
        if user.role.name == 'Super Admin':
            return Proposal.objects.all()
        try:
            mahasiswa = Mahasiswa.objects.get(user=user)
            return Proposal.objects.filter(mahasiswa=mahasiswa)
        except Mahasiswa.DoesNotExist:
            return Proposal.objects.none()

    def perform_create(self, serializer):
        """Hanya mahasiswa yang bisa mengajukan proposal"""
        user = self.request.user
        
        # Pastikan user adalah mahasiswa
        try:
            mahasiswa = Mahasiswa.objects.get(user=user)
            serializer.save(mahasiswa=mahasiswa)
        except Mahasiswa.DoesNotExist:
            raise serializers.ValidationError("Hanya mahasiswa yang dapat mengajukan proposal.")

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Hanya admin yang bisa menyetujui proposal"""
        user = request.user
        
        # Cek permission: hanya Super Admin
        if not (hasattr(user, 'role') and user.role and user.role.name == 'Super Admin'):
            return Response(
                {"error": "Hanya admin yang dapat menyetujui proposal"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        proposal = get_object_or_404(Proposal, pk=pk)
        proposal.status = 'approved'
        proposal.catatan = request.data.get('catatan', '')
        proposal.save()
        
        return Response({
            "status": "disetujui",
            "message": "Proposal berhasil disetujui"
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Hanya admin yang bisa menolak proposal"""
        user = request.user
        
        # Cek permission: hanya Super Admin
        if not (hasattr(user, 'role') and user.role and user.role.name == 'Super Admin'):
            return Response(
                {"error": "Hanya admin yang dapat menolak proposal"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        proposal = get_object_or_404(Proposal, pk=pk)
        catatan = request.data.get('catatan', '').strip()
        if not catatan:
            return Response(
                {"error": "Alasan penolakan wajib diisi"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        proposal.status = 'rejected'
        proposal.catatan = catatan
        proposal.save()
        
        return Response({
            "status": "ditolak",
            "message": "Proposal berhasil ditolak"
        }, status=status.HTTP_200_OK)

class BimbinganViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bimbingan.objects.select_related('dosen', 'mahasiswa', 'proposal')
    serializer_class = BimbinganSerializer
    permission_classes = [permissions.  IsAuthenticated]

    def get_queryset(self):
        queryset = Bimbingan.objects.select_related('dosen', 'mahasiswa', 'proposal')
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(dosen__nama_dosen__icontains=search) |
                Q(mahasiswa__nama_mahasiswa__icontains=search) |
                Q(mahasiswa__nim__icontains=search)
            )
        return queryset

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def wilayah_list(request):
    parent_code = request.query_params.get('parent')
    if parent_code:
        queryset = Wilayah.objects.filter(parent_code=parent_code)
    else:
        queryset = Wilayah.objects.all()
    serializer = WilayahSerializer(queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def dashboard_stats(request):
    return Response({
        'users': User.objects.count(),
        'divisions': Division.objects.count(),        
        'religions': Religion.objects.count(),
        'wilayah': Wilayah.objects.count(),
        'education_levels': EducationLevel.objects.count(),
    })