from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import Permission

class Division(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Divisions"

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']

class User(AbstractUser):   
    
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    division = models.ForeignKey(Division, on_delete=models.SET_NULL, null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No Role'})"
    
    class Meta:
        ordering = ['username']

class Religion(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Wilayah(models.Model):
    code = models.CharField(max_length=25, unique=True)  
    name = models.CharField(max_length=100)
    parent_code = models.CharField(max_length=20, null=True, blank=True)  
    level = models.PositiveSmallIntegerField() 

    def __str__(self):
        return f"{self.name} ({self.code})"
    
    class Meta:
        indexes = [
            models.Index(fields=['level']),
            models.Index(fields=['parent_code']),
            models.Index(fields=['code']),
        ]

class EducationLevel(models.Model):
    CODE_CHOICES = [
        ('SD', 'Sekolah Dasar'),
        ('SMP', 'Sekolah Menengah Pertama'),
        ('SMA', 'Sekolah Menengah Atas'),        
        ('D2', 'Diploma 2'),
        ('D3', 'Diploma 3'),
        ('D4', 'Diploma 4'),
        ('S1', 'Strata 1'),
        ('S2', 'Strata 2'),
        ('S3', 'Strata 3'),
        ('PROF', 'Profesor'),
    ]
    
    code = models.CharField(max_length=10, choices=CODE_CHOICES, null= True, blank= True, unique=True)    

    def __str__(self):
        return dict(self.CODE_CHOICES)[self.code]

class Prodi(models.Model):
    code = models.CharField(max_length=10, unique=True, verbose_name="Kode Program Studi")
    name = models.CharField(max_length=200, verbose_name="Nama Program Studi")

    class Meta:
        ordering = ['code']
        verbose_name = "Program Studi"
        verbose_name_plural = "Daftar Program Studi"

    def __str__(self):
        return f"{self.name} ({self.code})"

class KonsentrasiUtama(models.Model):
    code = models.CharField(max_length=25, unique=True, verbose_name="Kode Konsentrasi")
    name = models.CharField(max_length=100, verbose_name="Nama Konsentrasi")
    prodi = models.ForeignKey(Prodi, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.code})"
    
class Dosen(models.Model):
    kode_dosen = models.CharField(max_length=15, unique=True, verbose_name="Kode Dosen", null=True, blank=True)
    nama_dosen = models.CharField(max_length=150, verbose_name="Nama Dosen")
    konsentrasi = models.ForeignKey('KonsentrasiUtama', on_delete=models.SET_NULL, null=True, blank=True)    
    nidn = models.CharField(max_length=10, unique=True, primary_key=True, verbose_name="Nomor Induk Dosen Nasional")
    nip = models.CharField(max_length=18, unique=True, null=True, blank=True, verbose_name="Nomor Induk Pegawai")
    gelar_depan = models.CharField(max_length=50, null=True, blank=True)
    gelar_belakang = models.CharField(max_length=50, null=True, blank=True)
    jk = models.CharField(max_length=1, choices=[('L', 'Laki-laki'), ('P', 'Perempuan')], default='L')
    tempat_lahir = models.ForeignKey(Wilayah, on_delete=models.SET_NULL, null=True, blank=True, db_column='tempat_lahir')
    tgl_lahir = models.DateField(null=True, blank=True)
    prodi = models.ForeignKey(Prodi, on_delete=models.CASCADE, null=True, blank=True)
    status_aktif = models.CharField(max_length=30, default='Aktif', verbose_name="Status Keaktifan")
    jabatan_fungsional = models.CharField(max_length=50, null=True, blank=True, verbose_name="Jabatan Fungsional")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.kode_dosen} - {self.nama_dosen}"

    class Meta:
        verbose_name_plural = "Dosen"

class Mahasiswa(models.Model):
    GENDER_CHOICES = [
        ('L', 'Laki-laki'),
        ('P', 'Perempuan'),
    ]
    nim = models.CharField(max_length=15, unique=True, verbose_name="NIM")
    nama_mahasiswa = models.CharField(max_length=255, verbose_name="Nama Lengkap")
    tempat_lahir = models.ForeignKey(Wilayah, on_delete=models.SET_NULL, null=True, blank=True, db_column='tempat_lahir')
    alamat = models.CharField(max_length=255, verbose_name="Alamat", blank=True)
    tgl_lahir = models.DateField(verbose_name="Tanggal Lahir")  # ubah ke DateField
    tahun_masuk = models.IntegerField(verbose_name="Tahun Angkatan")
    jk = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Jenis Kelamin")
    prodi = models.ForeignKey(Prodi, on_delete=models.CASCADE, null=True, blank=True)
    konsentrasi = models.ForeignKey('KonsentrasiUtama', on_delete=models.SET_NULL, null=True, blank=True)
    judul_skripsi = models.CharField(max_length=300, blank=True, verbose_name="Judul Skripsi/Proposal")
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "Mahasiswa"
        verbose_name_plural = "Data Mahasiswa"
        ordering = ['nim']

    def __str__(self):
        return f"{self.nim} - {self.nama_mahasiswa}"

    @property
    def judul_skripsi_terbaru(self):
        proposal = self.proposals.filter(status='approved').order_by('-created_at').first()
        return proposal.judul if proposal else self.judul_skripsi
        
class Proposal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Menunggu Persetujuan'),
        ('approved', 'Disetujui'),
        ('rejected', 'Ditolak'),
    ]

    mahasiswa = models.ForeignKey(Mahasiswa, on_delete=models.CASCADE, related_name='proposals')    
    judul = models.CharField(max_length=300)
    catatan = models.TextField(blank=True)  # Untuk alasan penolakan
    file = models.FileField(upload_to='proposals/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    dosen_pembimbing = models.ForeignKey(Dosen, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.judul} ({self.mahasiswa.nim})"

    @property
    def nim(self):
        return self.mahasiswa.nim

    @property
    def nama_mahasiswa(self):
        return self.mahasiswa.nama_mahasiswa

class Bimbingan(models.Model):
    dosen = models.ForeignKey(Dosen, on_delete=models.CASCADE)
    mahasiswa = models.ForeignKey(Mahasiswa, on_delete=models.CASCADE)
    proposal = models.ForeignKey(Proposal, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('dosen', 'mahasiswa')

    @property
    def kode_dosen(self):
        return self.dosen.kode_dosen

    @property
    def nama_dosen(self):
        return self.dosen.nama_dosen

    @property
    def nim(self):
        return self.mahasiswa.nim

    @property
    def nama_mahasiswa(self):
        return self.mahasiswa.nama_mahasiswa