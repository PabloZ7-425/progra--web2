from django.db import migrations


def cargar_tareas(apps, schema_editor):
    Tarea = apps.get_model("dashboard", "Tarea")
    Tarea.objects.bulk_create([
        Tarea(id=1, titulo="Ensayo sobre ética", curso="Ética", fechaEntrega="2026-09-25", estado="pendiente"),
        Tarea(id=2, titulo="Informe de laboratorio", curso="Química", fechaEntrega="2026-09-28", estado="pendiente"),
        Tarea(id=3, titulo="Presentación grupal", curso="Historia", fechaEntrega="2026-09-30", estado="pendiente"),
        Tarea(id=4, titulo="Resolución de problemas", curso="Cálculo 2", fechaEntrega="2026-10-02", estado="pendiente"),
        Tarea(id=5, titulo="Lectura comentada", curso="Inglés", fechaEntrega="2026-10-03", estado="pendiente"),
    ])


class Migration(migrations.Migration):
    dependencies = [("dashboard", "0001_initial")]
    operations = [migrations.RunPython(cargar_tareas, migrations.RunPython.noop)]
