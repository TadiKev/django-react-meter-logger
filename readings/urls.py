from rest_framework import routers
from django.urls import path, include
from .views import SuburbViewSet, MeterReadingSessionViewSet, ReadingViewSet, UserViewSet, ReaderViewSet

router = routers.DefaultRouter()
router.register(r'suburbs', SuburbViewSet)
router.register(r'sessions', MeterReadingSessionViewSet, basename='meterreadingsession')
router.register(r'readings', ReadingViewSet, basename='reading')
# Optionally:
router.register(r'users', UserViewSet)
router.register(r'readers', ReaderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
