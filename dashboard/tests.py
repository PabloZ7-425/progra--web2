from django.test import TestCase
from .models import Tarea


class ContratoAPITests(TestCase):
    def test_dashboard_carga(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Pendiente por atender")

    def test_lista_de_tareas(self):
        response = self.client.get("/api/tareas/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 5)
        self.assertEqual(response.json()[0], {
            "id": 1, "titulo": "Ensayo sobre ética", "curso": "Ética",
            "fechaEntrega": "2026-09-25", "estado": "pendiente",
        })

    def test_detalle_y_404(self):
        self.assertEqual(self.client.get("/api/tareas/1/").json()["titulo"], "Ensayo sobre ética")
        response = self.client.get("/api/tareas/999/")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"error": "No existe una tarea con ese id."})

    def test_filtro_y_valor_invalido(self):
        self.assertEqual(len(self.client.get("/api/tareas/?estado=pendiente").json()), 5)
        self.assertEqual(self.client.get("/api/tareas/?estado=completada").json(), [])
        self.assertEqual(self.client.get("/api/tareas/?estado=otra").status_code, 400)
        self.assertEqual(self.client.get("/api/tareas/?estado=").status_code, 400)

    def test_completar_y_verificar_persistencia(self):
        response = self.client.patch("/api/tareas/1/", {"estado": "completada"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["estado"], "completada")
        self.assertEqual(Tarea.objects.get(pk=1).estado, "completada")
        self.assertEqual([t["id"] for t in self.client.get("/api/tareas/?estado=completada").json()], [1])

    def test_body_invalido(self):
        for body in ({}, {"estado": "pendiente"}, {"estado": "completada", "titulo": "otro"}):
            response = self.client.patch("/api/tareas/1/", body, content_type="application/json")
            self.assertEqual(response.status_code, 400)
        self.assertEqual(Tarea.objects.get(pk=1).estado, "pendiente")

    def test_patch_no_encontrada_y_metodo_no_permitido(self):
        response = self.client.patch("/api/tareas/999/", {"estado": "completada"}, content_type="application/json")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.client.post("/api/tareas/", {}, content_type="application/json").status_code, 405)
        self.assertEqual(self.client.delete("/api/tareas/1/").status_code, 405)
