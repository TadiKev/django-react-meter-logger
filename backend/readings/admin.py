# backend/admin.py

from django.contrib import admin
from django.db.models import Count, Max
from django.contrib.auth import get_user_model

from .models import Suburb, MeterReadingSession, Reading, Reader

User = get_user_model()

# 1) Ensure Suburb isn’t double-registered
try:
    admin.site.unregister(Suburb)
except admin.sites.NotRegistered:
    pass

@admin.register(Suburb)
class SuburbAdmin(admin.ModelAdmin):
    list_display = ('name',)


# 2) Reading admin
@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ('stand_number', 'consumption', 'status', 'session')
    list_filter  = ('status', 'session__suburb', 'session__reader')


# 3) Inline readings for sessions
class ReadingInline(admin.TabularInline):
    model = Reading
    extra = 1


# 4) MeterReadingSession admin with inline readings
@admin.register(MeterReadingSession)
class MeterReadingSessionAdmin(admin.ModelAdmin):
    list_display    = ('reader', 'date', 'suburb', 'sequence_start', 'sequence_end')
    list_filter     = ('reader', 'suburb', 'date')
    date_hierarchy  = 'date'
    inlines         = [ReadingInline]


# 5) Reader proxy model admin—shows each reader only once
@admin.register(Reader)
class ReaderAdmin(admin.ModelAdmin):
    list_display   = ('username', 'email', 'total_sessions', 'last_session_date')
    list_filter    = ('meterreadingsession__suburb__name',)
    search_fields  = ('username', 'email')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(
            _session_count = Count('meterreadingsession', distinct=True),
            _latest_date   = Max('meterreadingsession__date'),
        )

    def total_sessions(self, obj):
        return obj._session_count
    total_sessions.short_description = 'Session Count'

    def last_session_date(self, obj):
        return obj._latest_date or '-'
    last_session_date.short_description = 'Most Recent Session'

    def has_add_permission(self, request, obj=None):
        # Prevent adding via proxy
        return False
