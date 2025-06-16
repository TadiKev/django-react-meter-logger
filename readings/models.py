from django.db import models
from django.contrib.auth.models import User

class Suburb(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class MeterReadingSession(models.Model):
    reader = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    suburb = models.ForeignKey(Suburb, on_delete=models.PROTECT, related_name='sessions')
    sequence_start = models.PositiveIntegerField()
    sequence_end = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['reader', 'date'], name='unique_reader_date')
        ]

    def __str__(self):
        return f"{self.reader.username} – {self.date}"

class Reading(models.Model):
    STATUS_CHOICES = [
        ('normal', 'Normal'),
        ('alert', 'Alert'),
    ]
    session = models.ForeignKey(MeterReadingSession, related_name='readings', on_delete=models.CASCADE)
    stand_number = models.CharField(max_length=50)
    consumption = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='normal')

    def __str__(self):
        return f"Stand {self.stand_number}: {self.consumption}m³"

# Proxy model so each User appears only once as a “Reader”
class Reader(User):
    class Meta:
        proxy = True
        verbose_name = 'Reader'
        verbose_name_plural = 'Readers'
