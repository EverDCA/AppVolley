# VolleyTrack - App Móvil de Asistencia y Rendimiento de Vóley

Aplicación móvil y Progressive Web App (PWA) diseñada para directores técnicos y entrenadores de voleibol en Colombia y Latinoamérica. Permite gestionar categorías (**Sub-11, Benjamín 11, Alevín, Sub-13, Sub-15, Sub-17, Sub-19**), pasar asistencia ágil en cancha con un solo toque y crear planes de ejercicios con evaluación técnica por alumna.

---

## Características Principales

1. **Diseño Minimalista, Suave y Monocromático**:
   - Fondo en negro grafito suave (`#0c0c0e`), superficies limpias y acentos en **vino tinto elegante** (`#78152a`, `#aa223f`).
   - Iconos 100% monocromáticos de trazo fino sin colores estridentes ni emojis.
   - Contraste suave optimizado para uso en cancha y respuesta táctil con vibración.

2. **Gestión de Divisiones (Subs)**:
   - Precargada con las categorías reales de tu archivo Excel (`Sub 11`, `Benjamín 11`, `Alevín`, `Sub 13`, `Sub 15`, `Sub 17`, `Sub 19`).
   - Creación de nuevas categorías personalizadas con código, rango de edades y color.
   - Métricas en tiempo real de cantidad de jugadoras y estado de asistencia del día.

3. **Alumnas y Alumnos**:
   - Registro de Nombre, Fecha de Nacimiento (calcula la edad exacta de forma automática), Asignación de Subdivisión, Número de Camiseta y Posición en Cancha (Armadora, Central, Punta, Opuesta, Líbero).
   - Más de 50 alumnas reales precargadas desde el archivo Excel.
   - Búsqueda en tiempo real por nombre o dorsal y filtro por categoría.

4. **Acción 1: Registro de Asistencia Ágil (Cancha)**:
   - Selección automática del **día de hoy** con opción de navegar entre fechas.
   - Selector táctil de 1 toque:
     - **P** (Presente)
     - **A** (Ausente)
     - **T** (Tarde)
     - **J** (Justificada)
   - Botón *"Marcar Todas Presentes"* para pasar lista en 3 segundos.
   - Historial de asistencias de cada Sub con porcentajes de cumplimiento y detalle de sesiones pasadas.

5. **Acción 2: Plan de Ejercicios & Calificación Técnica**:
   - Creación de planes de entrenamiento (ej: Saque, Recepción, Colocación, Remate, Bloqueo).
   - Calificación por jugadora mediante botones táctiles rápidos (`+` / `−`) o entrada directa en escala de 1 a 10 (o 1 a 5).
   - Observaciones técnicas individuales por alumna.
   - **Diagnóstico Grupal**: Estadísticas por fundamento para saber qué ejercicio dominó el equipo y cuál necesita refuerzo.
   - **Cuadro de Honor**: Ranking de la sesión con reconocimiento a la alumna destacada.
   - Botón para compartir el resumen de la sesión listo para WhatsApp.

6. **100% Offline & Instalable en Android (PWA)**:
   - Funciona sin internet en el coliseo o la cancha gracias al Service Worker y almacenamiento local (`localStorage`).
   - Exportación de asistencias a formato **Excel / CSV**.
   - Copia de seguridad en **JSON** para respaldar o transferir entre teléfonos.

---

## 📲 Cómo Abrir e Instalar en tu Celular Android

### Opción 1: Abrir directamente en tu navegador (PC o Celular)
- Haz doble clic en el archivo [index.html](file:///c:/Users/evdac/OneDrive/Documentos/Github/AppVolley/index.html) para abrirlo en Google Chrome, Edge o cualquier navegador moderno.

### Opción 2: Instalar como App en la pantalla de inicio de Android
1. Sube tu proyecto o ábrelo en Chrome desde tu dispositivo móvil.
2. Toca los tres puntos de la esquina superior derecha en Chrome (`⋮`).
3. Selecciona **"Añadir a pantalla de inicio"** o **"Instalar aplicación"**.
4. ¡Listo! Tendrás el icono de **VolleyTrack** en tu teléfono y abrirá a pantalla completa como una app nativa de Android, funcionando incluso sin conexión a internet.
