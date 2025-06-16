# views.py
from datetime import date, timedelta

from django.contrib.auth.models import User
from django.db.models import Sum

from rest_framework import status, generics
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import MeterReadingSession, Reading
from .serializers import MeterReadingSessionSerializer


class CustomAuthToken(ObtainAuthToken):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        res = super().post(request, *args, **kwargs)
        token = Token.objects.get(key=res.data['token'])
        return Response({
            'token': token.key,
            'reader_name': token.user.username
        })


class SessionListCreateAPIView(generics.ListCreateAPIView):
    """
    GET  /api/sessions/    → list sessions for user
    POST /api/sessions/    → create a new session or append to existing by date
    """
    queryset = (
        MeterReadingSession.objects
        .select_related('suburb', 'reader')
        .prefetch_related('readings')
    )
    serializer_class = MeterReadingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset().order_by('-date')
        if not self.request.user.is_staff:
            qs = qs.filter(reader=self.request.user)
        return qs

    def create(self, request, *args, **kwargs):
        user     = request.user
        date_val = request.data.get('date')
        readings = request.data.get('readings', [])

        # If a session exists for this reader+date, append readings
        existing = (
            MeterReadingSession.objects
            .filter(reader=user, date=date_val)
            .first()
        )
        if existing:
            for rd in readings:
                Reading.objects.create(session=existing, **rd)
            return Response(
                self.get_serializer(existing).data,
                status=status.HTTP_200_OK
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        session = serializer.save(reader=self.request.user)
        for rd in self.request.data.get('readings', []):
            Reading.objects.create(session=session, **rd)


class SessionRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/sessions/{pk}/  → retrieve session
    PUT  /api/sessions/{pk}/  → append new readings only
    """
    queryset = (
        MeterReadingSession.objects
        .select_related('suburb', 'reader')
        .prefetch_related('readings')
    )
    serializer_class = MeterReadingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_staff:
            qs = qs.filter(reader=self.request.user)
        return qs

    def update(self, request, *args, **kwargs):
        session = self.get_object()
        readings = request.data.get('readings', [])
        for rd in readings:
            Reading.objects.create(session=session, **rd)
        return Response(self.get_serializer(session).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    base_qs = MeterReadingSession.objects.all()
    if not request.user.is_staff:
        base_qs = base_qs.filter(reader=request.user)

    readings_qs = Reading.objects.filter(session__in=base_qs)
    active_meters  = readings_qs.values('stand_number').distinct().count()
    readings_today = readings_qs.filter(session__date=date.today()).count()
    alerts         = readings_qs.filter(status='alert').count()

    trend_data = (
        base_qs
        .filter(date__gte=date.today() - timedelta(days=7))
        .annotate(total_consumption=Sum('readings__consumption'))
        .values('date', 'total_consumption')
        .order_by('date')
    )

    recent = base_qs.order_by('-date')[:10]
    sessions_data = []
    for sess in recent:
        rds = sess.readings.all()
        sessions_data.append({
            'id':               sess.id,
            'date':             sess.date,
            'suburb':           sess.suburb.name,
            'reader_name':      sess.reader.username,
            'readings_count':   rds.count(),
            'total_consumption': rds.aggregate(Sum('consumption'))['consumption__sum'] or 0,
            'alert_count':      rds.filter(status='alert').count(),
        })

    location_stats = (
        base_qs
        .values('suburb__name')
        .annotate(total_consumption=Sum('readings__consumption'))
        .order_by('suburb__name')
    )

    return Response({
        'summary': {
            'active_meters':  active_meters,
            'readings_today': readings_today,
            'alerts':         alerts,
        },
        'trend_data':    list(trend_data),
        'sessions':      sessions_data,
        'location_stats': [
            {'suburb': loc['suburb__name'], 'consumption': loc['total_consumption']}
            for loc in location_stats
        ]
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response(
            {'error': 'Username/password required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        password=password,
        email=request.data.get('email', ''),
        first_name=request.data.get('first_name', ''),
        last_name=request.data.get('last_name', '')
    )
    token = Token.objects.create(user=user)
    return Response(
        {'token': token.key, 'reader_name': user.username},
        status=status.HTTP_201_CREATED
    ) 