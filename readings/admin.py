from django.contrib import admin
from .models import Suburb, MeterReadingSession, Reading, Reader

@admin.register(Suburb)
class SuburbAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(MeterReadingSession)
class MeterReadingSessionAdmin(admin.ModelAdmin):
    list_display = ['reader', 'date', 'suburb', 'sequence_start', 'sequence_end']
    list_filter = ['date', 'suburb', 'reader']
    search_fields = ['reader__username', 'suburb__name']

@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ['session', 'stand_number', 'consumption', 'status']
    list_filter = ['status']
    search_fields = ['stand_number', 'session__reader__username']

@admin.register(Reader)
class ReaderAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name']
    # Because Reader is a proxy, you can customize admin for readers if needed.
