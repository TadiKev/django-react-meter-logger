from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Suburb, MeterReadingSession, Reading, Reader

class SuburbSerializer(serializers.ModelSerializer):
    class Meta:
        model = Suburb
        fields = ['id', 'name']

class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = ['id', 'session', 'stand_number', 'consumption', 'status']

class MeterReadingSessionSerializer(serializers.ModelSerializer):
    # Nested readings: read-only by default; for writes you can accept list of readings if desired.
    readings = ReadingSerializer(many=True, read_only=True)
    # Optionally allow creating readings inline:
    # readings = ReadingSerializer(many=True, required=False)

    class Meta:
        model = MeterReadingSession
        fields = [
            'id',
            'reader',
            'date',
            'suburb',
            'sequence_start',
            'sequence_end',
            'readings',
        ]

    # If you want to allow nested create/update of readings, override create/update:
    # def create(self, validated_data):
    #     readings_data = validated_data.pop('readings', [])
    #     session = super().create(validated_data)
    #     for rd in readings_data:
    #         Reading.objects.create(session=session, **rd)
    #     return session

class UserSerializer(serializers.ModelSerializer):
    # For Reader proxy: list sessions?
    sessions = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True,
        source='meterreadingsession_set'  # or related_name if set
    )
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'sessions']

class ReaderSerializer(serializers.ModelSerializer):
    # As proxy, but same as UserSerializer; can customize if needed.
    sessions = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True,
        source='meterreadingsession_set'
    )
    class Meta:
        model = Reader
        fields = ['id', 'username', 'email', 'sessions']
