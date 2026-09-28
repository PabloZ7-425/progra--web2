from django.db import models


class Tarea(models.Model):
    ESTADOS = (("pendiente", "Pendiente"), ("completada", "Completada"))
    titulo = models.CharField(max_length=200)
    curso = models.CharField(max_length=100)
    fechaEntrega = models.DateField()
    estado = models.CharField(max_length=10, choices=ESTADOS, default="pendiente")

    class Meta:
        ordering = ("fechaEntrega", "id")

    def __str__(self):
        return self.titulo
