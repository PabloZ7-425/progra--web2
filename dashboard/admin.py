from django.contrib import admin
from .models import Tarea


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "curso", "fechaEntrega", "estado")
    list_filter = ("estado", "curso")
    search_fields = ("titulo", "curso")
