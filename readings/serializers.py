from rest_framework import serializers
from .models import MeterReadingSession, Reading, Suburb

class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Reading
        fields = ['stand_number', 'consumption', 'status']

class MeterReadingSessionSerializer(serializers.ModelSerializer):
    reader_name    = serializers.CharField(source='reader.username', read_only=True)
    suburb         = serializers.PrimaryKeyRelatedField(queryset=Suburb.objects.all())
    readings       = ReadingSerializer(many=True)

    class Meta:
        model  = MeterReadingSession
        fields = [
            'id', 'reader_name', 'date',
            'suburb', 'sequence_start', 'sequence_end',
            'readings',
        ]

    def create(self, validated_data):
        # Not used—handled in view—but kept for completeness
        readings_data = validated_data.pop('readings')
        session = MeterReadingSession.objects.create(**validated_data)
        for r in readings_data:
            Reading.objects.create(session=session, **r)
        return session