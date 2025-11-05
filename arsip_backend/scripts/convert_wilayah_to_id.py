from api.models import Mahasiswa, Wilayah

def convert():
    for m in Mahasiswa.objects.raw("SELECT * FROM api_mahasiswa WHERE tempat_lahir IS NOT NULL"):
        if isinstance(m.tempat_lahir, str):
            try:
                wilayah = Wilayah.objects.get(name__iexact=m.tempat_lahir.strip())
                Mahasiswa.objects.filter(id=m.id).update(tempat_lahir=wilayah.id)
                print(f"✅ {m.nim} | {m.tempat_lahir} → {wilayah.id}")
            except Wilayah.DoesNotExist:
                print(f"❌ Tidak ditemukan: {m.tempat_lahir}")

if __name__ == "__main__":
    convert()