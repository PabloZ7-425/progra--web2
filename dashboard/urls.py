from django.urls import path
from . import views

urlpatterns = [
    path("tareas/", views.lista_tareas, name="lista_tareas"),
    path("tareas/<int:pk>/", views.detalle_tarea, name="detalle_tarea"),
]
