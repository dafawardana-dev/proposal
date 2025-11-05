# api/management/commands/import_excel.py
import pandas as pd
from django.core.management.base import BaseCommand
from api.models import KonsentrasiUtama 

class Command(BaseCommand):
    help = 'Import data from Excel file to KonsentrasiUtama model'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to Excel file (.xlsx)',
            default='api/data/konsen_utama_new.xlsx'
        )
        parser.add_argument(
            '--sheet',
            type=str,
            help='Sheet name (default: first sheet)',
            default=0
        )

    def handle(self, *args, **options):
        file_path = options['file']
        sheet_name = options['sheet']
        
        try:
            # Baca file Excel
            self.stdout.write(f"🔍 Membaca file: {file_path}")
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # Validasi kolom wajib
            required_columns = ['nip', 'konsentrasi']  # Sesuai header di Excel
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                self.stdout.write(
                    self.style.ERROR(f"❌ Kolom wajib tidak ditemukan: {missing_columns}")
                )
                return
            
            self.stdout.write(f"✅ Menemukan {len(df)} baris data")
            
            # Simpan ke database
            created_count = 0
            updated_count = 0
            error_count = 0
            
            for index, row in df.iterrows():
                try:
                    code = str(row['nip']).strip()
                    name = str(row['konsentrasi']).strip()
                    
                    if not code or not name:
                        self.stdout.write(
                            self.style.WARNING(f"⚠️ Baris {index+2}: Data kosong (NIP atau Konsentrasi)")
                        )
                        continue
                    
                    obj, created = KonsentrasiUtama.objects.update_or_create(
                        code=code,
                        defaults={'name': name}
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                        
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.WARNING(f"⚠️ Baris {index+2} error: {str(e)}")
                    )
                    continue
            
            # Tampilkan hasil
            self.stdout.write("\n" + "="*50)
            self.stdout.write("HASIL IMPORT")
            self.stdout.write("="*50)
            self.stdout.write(f" Berhasil dibuat: {created_count}")
            self.stdout.write(f"Diperbarui: {updated_count}")
            self.stdout.write(f" Error: {error_count}")
            self.stdout.write(f" Total diproses: {len(df)}")
            self.stdout.write("="*50)
            
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f" File tidak ditemukan: {file_path}")
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f" Error: {str(e)}")
            )