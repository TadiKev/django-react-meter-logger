from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from rest_framework.exceptions import PermissionDenied
from .models import Suburb, MeterReadingSession, Reading, Reader
from .serializers import (
    SuburbSerializer,
    MeterReadingSessionSerializer,
    ReadingSerializer,
    UserSerializer,
    ReaderSerializer,
)

class SuburbViewSet(viewsets.ModelViewSet):
    queryset = Suburb.objects.all().order_by('name')
    serializer_class = SuburbSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Optionally restrict to sessions the user has access to.
        qs = super().get_queryset()
        # If only allow readers to see their own readings:
        return qs.filter(session__reader=self.request.user)

    def perform_create(self, serializer):
        # Optionally ensure session.reader == request.user
        session = serializer.validated_data.get('session')
        if session.reader != self.request.user:
            raise PermissionDenied("Cannot add reading to another user's session.")
        serializer.save()

class MeterReadingSessionViewSet(viewsets.ModelViewSet):
    queryset = MeterReadingSession.objects.all()
    serializer_class = MeterReadingSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only sessions for the current user
        return MeterReadingSession.objects.filter(reader=self.request.user)

    def perform_create(self, serializer):
        # Force reader to current user
        serializer.save(reader=self.request.user)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReaderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Reader.objects.all()
    serializer_class = ReaderSerializer
    permission_classes = [permissions.IsAuthenticated]
