import json
from pathlib import Path
from django.core.management.base import BaseCommand
from api.models import Wilayah

WILAYAH_FILE = Path(__file__).parent.parent.parent/ "wilayah.json"

class Command(BaseCommand):
    help = 'Load wilayah data from wilayah.json into Wilayah model'

    def handle(self, *args, **kwargs):
        if not WILAYAH_FILE.exists():
            self.stdout.write(self.style.ERROR(f"File {WILAYAH_FILE} tidak ditemukan!"))
            return

        with open(WILAYAH_FILE, encoding="utf-8") as f:
            data = json.load(f)

        created = 0
        for item in data:
            kode = item["kode"]
            nama = item["nama"]
            parts = kode.split(".")
            level = len(parts)
            parent_code = ".".join(parts[:-1]) if level > 1 else None

            obj, new = Wilayah.objects.get_or_create(
                code=kode,
                defaults={
                    "name": nama,
                    "parent_code": parent_code,
                    "level": level
                }
            )
            if new:
                created += 1

        self.stdout.write(self.style.SUCCESS(f" {created} data wilayah berhasil dimuat!"))