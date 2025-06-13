from django.db import migrations, models

def remove_duplicates(apps, schema_editor):
    MeterReadingSession = apps.get_model('readings', 'MeterReadingSession')

    # Find duplicates based on reader + date
    duplicates = (
        MeterReadingSession.objects
        .values('reader', 'date')
        .annotate(count=models.Count('id'))
        .filter(count__gt=1)
    )

    for dup in duplicates:
        sessions = MeterReadingSession.objects.filter(
            reader=dup['reader'],
            date=dup['date']
        ).order_by('id')  # Oldest first

        # Keep the first, delete the rest
        sessions.exclude(id=sessions.first().id).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('readings', '0005_meterreadingsession_unique_reader_date'),
    ]

    operations = [
        migrations.RunPython(remove_duplicates, migrations.RunPython.noop),
    ]
