from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Tarea
from .serializers import TareaSerializer


@api_view(["GET"])
def lista_tareas(request):
    estado = request.query_params.get("estado")
    if estado is not None and estado not in ("pendiente", "completada"):
        return Response(
            {"error": "El estado debe ser pendiente o completada."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    tareas = Tarea.objects.all()
    if estado is not None:
        tareas = tareas.filter(estado=estado)
    return Response(TareaSerializer(tareas, many=True).data)


@api_view(["GET", "PATCH"])
def detalle_tarea(request, pk):
    if request.method == "PATCH" and request.data != {"estado": "completada"}:
        return Response(
            {"error": 'El cuerpo debe ser {"estado": "completada"}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    tarea = Tarea.objects.filter(pk=pk).first()
    if tarea is None:
        return Response(
            {"error": "No existe una tarea con ese id."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if request.method == "PATCH":
        tarea.estado = "completada"
        tarea.save(update_fields=["estado"])
    return Response(TareaSerializer(tarea).data)
