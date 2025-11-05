from django.utils import timezone
from rest_framework import serializers
from .models import User, Division, Role, Wilayah, Religion, EducationLevel, KonsentrasiUtama, Prodi, Mahasiswa, Dosen, Proposal, Bimbingan
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Permission 

class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )    
    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'permission_ids', 'created_at']    
    def create(self, validated_data):
        permission_ids = validated_data.pop('permission_ids', [])
        role = Role.objects.create(**validated_data)
        if permission_ids:
            role.permissions.set(permission_ids)
        return role    
    def update(self, instance, validated_data):
        permission_ids = validated_data.pop('permission_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if permission_ids is not None:
            instance.permissions.set(permission_ids)
        
        return instance

class WilayahSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wilayah
        fields = ['id','code', 'name', 'level']

class KonsentrasiUtamaSerializer(serializers.ModelSerializer):
    prodi_name = serializers.CharField(source='prodi.name', read_only=True)
    prodi_id = serializers.PrimaryKeyRelatedField(
        queryset=Prodi.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = KonsentrasiUtama
        fields = ['id', 'code', 'name', 'prodi', 'prodi_id', 'prodi_name']
        read_only_fields = ['id']

    def validate_code(self, value):
        if self.instance is None and KonsentrasiUtama.objects.filter(code=value).exists():
            raise serializers.ValidationError("Kode konsentrasi sudah ada.")
        return value

class ReligionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Religion
        fields = ['id', 'name']

class EducationLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationLevel
        fields = ['id', 'code']

    def get_name(self, obj):
        return dict(EducationLevel.CODE_CHOICES).get(obj.code, obj.code)

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.IntegerField(write_only=True, required=False)
    division = DivisionSerializer(read_only=True)
    division_id = serializers.IntegerField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'role', 'role_id', 'division', 'division_id', 
            'password', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']
    
    def validate(self, data):
        if 'role_id' in data and data['role_id']:
            try:
                role = Role.objects.get(id=data['role_id'])
                data['role'] = role
            except Role.DoesNotExist:
                raise serializers.ValidationError({'role_id': 'Invalid role ID.'})
        
        if 'division_id' in data and data['division_id']:
            try:
                division = Division.objects.get(id=data['division_id'])
                data['division'] = division
            except Division.DoesNotExist:
                raise serializers.ValidationError({'division_id': 'Invalid division ID.'})
        
        if not self.instance and 'password' not in data:
            raise serializers.ValidationError({'password': 'This field is required.'})
        
        if 'password' in data:
            try:
                validate_password(data['password'])
            except ValidationError as e:
                raise serializers.ValidationError({'password': list(e.messages)})
        
        return data
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)
    division_id = serializers.IntegerField(required=True)
    role_id = serializers.IntegerField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2', 'role_id', 'division_id']
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        
        try:
            division = Division.objects.get(id=data['division_id'])
            data['division'] = division
        except Division.DoesNotExist:
            raise serializers.ValidationError({'division_id': 'Invalid division ID.'})
        
        try:
            role = Role.objects.get(id=data['role_id'])
            data['role'] = role
        except Role.DoesNotExist:
            raise serializers.ValidationError({'role_id': 'Invalid role ID.'})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2')
        division = validated_data.pop('division')
        role = validated_data.pop('role')
        
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            division=division
        )
        
        user.set_password(validated_data['password'])
        user.save()
        return user

class ProdiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prodi
        fields = ['id', 'code', 'name']
        read_only_fields = ['id']

    def validate_code(self, value):
        if self.instance is None and Prodi.objects.filter(code=value).exists():
            raise serializers.ValidationError("Kode program studi sudah ada.")
        return value

class MahasiswaSerializer(serializers.ModelSerializer):
    tempat_lahir_id = serializers.IntegerField(source='tempat_lahir.id', read_only=True)
    tempat_lahir_nama = serializers.CharField(source='tempat_lahir.name', read_only=True)
    prodi_id = serializers.IntegerField(source='prodi.id', read_only=True)
    prodi_nama = serializers.CharField(source='prodi.name', read_only=True)
    konsentrasi_id = serializers.IntegerField(source='konsentrasi.id', read_only=True)
    konsentrasi_nama = serializers.CharField(source='konsentrasi.name', read_only=True)
    judul_skripsi = serializers.SerializerMethodField()

    class Meta:
        model = Mahasiswa
        fields = [
            'id', 'nim', 'nama_mahasiswa', 'alamat',
            'tempat_lahir', 'tempat_lahir_id', 'tempat_lahir_nama',
            'tgl_lahir', 'jk', 'tahun_masuk',
            'prodi', 'prodi_id', 'prodi_nama',
            'konsentrasi', 'konsentrasi_id', 'konsentrasi_nama',
            'judul_skripsi',
        ]
        read_only_fields = ['id']

    def get_judul_skripsi(self, obj):            
            if hasattr(obj, 'proposals'):
                approved = obj.proposals.filter(status='approved').first()
                if approved:
                    return approved.judul
            return obj.judul_skripsi or "BELUM ADA"
        
    def get_tempat_lahir(self, obj):
        if obj.tempat_lahir:
            return obj.tempat_lahir.name  
        return "-"

    def get_prodi(self, obj):
        if obj.prodi:
            return obj.prodi.name  
        return "-"

    def get_konsentrasi(self, obj):
        if obj.konsentrasi:
            return obj.konsentrasi.name 
        return "-"
        
    def validate_nim(self, value):
        if self.instance is None and Mahasiswa.objects.filter(nim=value).exists():
            raise serializers.ValidationError("NIM sudah terdaftar.")
        return value

    def validate_tgl_lahir(self, value):
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Tanggal lahir tidak boleh di masa depan.")
        return value

class RegisterMahasiswaSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Mahasiswa
        fields = [
            'nim', 'nama_mahasiswa', 'alamat', 'tempat_lahir',
            'tgl_lahir', 'jk', 'tahun_masuk', 'prodi', 'konsentrasi',
            'judul_skripsi', 'password', 'password2'
        ]
        extra_kwargs = {
            'judul_skripsi': {'required': False},
            'konsentrasi': {'required': False},
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password dan konfirmasi tidak cocok."})
        
        if Mahasiswa.objects.filter(nim=data['nim']).exists():
            raise serializers.ValidationError({"nim": "NIM sudah terdaftar."})
        
        if User.objects.filter(username=data['nim']).exists():
            raise serializers.ValidationError({"nim": "Akun dengan NIM ini sudah aktif."})
        
        try:
            validate_password(data['password'])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=validated_data['nim'],
            password=password,
            is_active=True
        )

        mahasiswa = Mahasiswa.objects.create(
            user=user,
            **validated_data
        )
        return mahasiswa

class DosenSerializer(serializers.ModelSerializer):    
    tempat_lahir_id = serializers.IntegerField(source='tempat_lahir.id', read_only=True)
    tempat_lahir_nama = serializers.CharField(source='tempat_lahir.name', read_only=True, allow_null=True)    
    prodi_id = serializers.IntegerField(source='prodi.id', read_only=True)
    prodi_nama = serializers.CharField(source='prodi.name', read_only=True, allow_null=True)    
    konsentrasi_id = serializers.IntegerField(source='konsentrasi.id', read_only=True)
    konsentrasi_nama = serializers.CharField(source='konsentrasi.name', read_only=True, allow_null=True)

    class Meta:
        model = Dosen
        fields = [
            'nidn', 'nip', 'nama_dosen', 'gelar_depan', 'gelar_belakang',
            'jk', 'tempat_lahir', 'tempat_lahir_id', 'tempat_lahir_nama', 
            'tgl_lahir',
            'prodi', 'prodi_id', 'prodi_nama',
            'konsentrasi', 'konsentrasi_id', 'konsentrasi_nama',
            'status_aktif', 'jabatan_fungsional'
        ]

    def create(self, validated_data):      
        tempat_lahir_id = validated_data.pop('tempat_lahir_id', None)
        prodi_id = validated_data.pop('prodi_id', None)
        konsentrasi_id = validated_data.pop('konsentrasi_id', None)

        if tempat_lahir_id:
            validated_data['tempat_lahir'] = tempat_lahir_id
        if prodi_id:
            validated_data['prodi'] = prodi_id
        if konsentrasi_id:
            validated_data['konsentrasi'] = konsentrasi_id
            
        return super().create(validated_data)

    def update(self, instance, validated_data):        
        tempat_lahir_id = validated_data.pop('tempat_lahir_id', None)
        prodi_id = validated_data.pop('prodi_id', None)
        konsentrasi_id = validated_data.pop('konsentrasi_id', None)
        
        if tempat_lahir_id is not None:
            instance.tempat_lahir = tempat_lahir_id
        if prodi_id is not None:
            instance.prodi = prodi_id
        if konsentrasi_id is not None:
            instance.konsentrasi = konsentrasi_id
        
        return super().update(instance, validated_data)

    def get_tempat_lahir(self, obj):
        if obj.tempat_lahir:
            return obj.tempat_lahir.name 
        return "-"
        
    def get_prodi(self, obj):
        if obj.prodi:
            return obj.prodi.name 
        return "-"

    def get_konsentrasi(self, obj):
        if obj.konsentrasi:
            return obj.konsentrasi.name  
        return "-"

    def validate_kode_dosen(self, value):
        if not validated_data.get('kode_dosen'):
            validated_data['kode_dosen'] = validated_data.get('nidn')
        return super().create(validated_data)

class ProposalSerializer(serializers.ModelSerializer):
    mahasiswa_nim = serializers.CharField(source='mahasiswa.nim', read_only=True)
    mahasiswa_nama = serializers.CharField(source='mahasiswa.nama_mahasiswa', read_only=True)
    dosen_pembimbing = serializers.PrimaryKeyRelatedField(queryset=Dosen.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Proposal
        fields = [
            'id', 'mahasiswa', 'judul', 'deskripsi', 'file',
            'status', 'catatan',
            'dosen_pembimbing',
            'created_at', 'updated_at',
            'mahasiswa_nim', 'mahasiswa_nama'
        ]
        read_only_fields = ['id', 'status', 'catatan', 'created_at', 'updated_at']

    def validate_mahasiswa(self, value):        
        if Proposal.objects.filter(mahasiswa=value, status='pending').exists():
            raise serializers.ValidationError("Mahasiswa sudah memiliki proposal yang menunggu persetujuan.")
        return value

    def validate_judul(self, value):
        if not value.strip():
            raise serializers.ValidationError("Judul tidak boleh kosong.")
        if len(value) < 5:
            raise serializers.ValidationError("Judul minimal 5 karakter.")
        return value

    def validate_file(self, value):
        if value:
            max_size = 5 * 1024 * 1024  # 5 MB
            if value.size > max_size:
                raise serializers.ValidationError("Ukuran file maksimal 5 MB.")
            ext = value.name.split('.')[-1].lower()
            if f".{ext}" not in ['.pdf', '.doc', '.docx']:
                raise serializers.ValidationError("Format file harus PDF, DOC, atau DOCX.")
        return value

class BimbinganSerializer(serializers.ModelSerializer):
    kode_dosen = serializers.CharField(source='dosen.kode_dosen', read_only=True)
    nama_dosen = serializers.CharField(source='dosen.nama_dosen', read_only=True)
    nim = serializers.CharField(source='mahasiswa.nim', read_only=True)
    nama_mahasiswa = serializers.CharField(source='mahasiswa.nama_mahasiswa', read_only=True)
    judul_proposal = serializers.CharField(source='proposal.judul', read_only=True, allow_null=True)

    class Meta:
        model = Bimbingan
        fields = [
            'id', 'kode_dosen', 'nama_dosen', 'nim', 'nama_mahasiswa',
            'judul_proposal', 'created_at'
        ]