// Módulo de Exportación a Excel (.xlsx) — VolleyTrack
// Genera el archivo Excel idéntico al formato oficial: 'Asistencia sub 13 sub11 benjamin y alevin.xlsx'
import { store } from './store.js';
import { AppUI } from './ui.js';

const MONTH_NAMES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export function exportDivisionAttendanceToXlsx(divisionId, app = null) {
  if (typeof window.XLSX === 'undefined') {
    AppUI.alert({
      title: 'Librería Excel no lista',
      message: 'La librería para generar hojas de cálculo de Excel se está cargando. Por favor, intenta de nuevo en unos segundos.'
    });
    return false;
  }

  const division = store.getDivisionById(divisionId);
  if (!division) {
    if (app && app.showToast) app.showToast('División no encontrada', 'info');
    return false;
  }

  const students = store.getStudentsByDivision(divisionId);
  if (students.length === 0) {
    if (app && app.showToast) {
      app.showToast(`No hay alumnas registradas en ${division.name}`, 'info');
    }
    return false;
  }

  // Obtener todas las sesiones de asistencia registradas para esta división
  const history = store.getAttendanceHistoryForDivision(divisionId);
  
  // Extraer fechas únicas y ordenarlas cronológicamente (de más antigua a más reciente)
  const dateMap = {};
  history.forEach(h => {
    if (h && h.date) {
      dateMap[h.date] = h.records || {};
    }
  });

  let dates = Object.keys(dateMap).sort();

  // Si no hay fechas registradas aún, incluir al menos la fecha de hoy
  if (dates.length === 0) {
    const today = new Date().toISOString().slice(0, 10);
    dateMap[today] = {};
    dates = [today];
  }

  // Estructura de filas AOA (Array of Arrays)
  // Fila 0: 'ALIANZA' (A1:D1) y Nombres de Meses sobre las columnas de fechas
  // Fila 1: 'CONTROL DE ASISTENCIA <CATEGORIA>' (A2:D2) y Números de día en cada columna
  // Fila 2: Encabezados de columnas (N°, CATEGORIA, NOMBRE, AÑO DE NACIMIENTO)
  // Filas 3+: Datos de cada jugadora

  const row0 = ['ALIANZA', '', '', ''];
  const row1 = [`CONTROL DE ASISTENCIA ${division.name.toUpperCase()}`, '', '', ''];
  const row2 = ['N°', 'CATEGORIA', 'NOMBRE', 'AÑO DE NACIMIENTO'];

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1 -> ALIANZA
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }  // A2:D2 -> CONTROL DE ASISTENCIA...
  ];

  // Agrupar fechas por mes para crear los merges del encabezado de meses
  let currentMonthName = null;
  let monthStartCol = -1;

  dates.forEach((dateStr, idx) => {
    const colIndex = 4 + idx;
    const parts = dateStr.split('-');
    const mIdx = parseInt(parts[1], 10) - 1;
    const monthName = MONTH_NAMES_ES[mIdx] || 'MES';
    const dayNumber = parseInt(parts[2], 10);

    // Fila 1: número de día
    row1.push(dayNumber);
    // Fila 2: vacío
    row2.push('');

    // Lógica para agrupar meses en Fila 0
    if (monthName !== currentMonthName) {
      if (currentMonthName !== null && monthStartCol !== -1 && (colIndex - 1) > monthStartCol) {
        merges.push({ s: { r: 0, c: monthStartCol }, e: { r: 0, c: colIndex - 1 } });
      }
      currentMonthName = monthName;
      monthStartCol = colIndex;
      row0.push(monthName);
    } else {
      row0.push('');
    }
  });

  // Cerrar el último merge de mes si aplica
  if (currentMonthName !== null && monthStartCol !== -1 && (4 + dates.length - 1) > monthStartCol) {
    merges.push({ s: { r: 0, c: monthStartCol }, e: { r: 0, c: 4 + dates.length - 1 } });
  }

  // Filas de jugadoras
  const aoa = [row0, row1, row2];

  students.forEach((student, index) => {
    // Año de nacimiento
    let birthYear = '';
    if (student.birthDate) {
      birthYear = student.birthDate.slice(0, 4);
    }

    const studentRow = [
      index + 1,
      division.name.toUpperCase().replace('CATEGORÍA ', '').trim(),
      student.name.toUpperCase().trim(),
      birthYear
    ];

    // Marcas de asistencia para cada fecha
    dates.forEach(dStr => {
      const records = dateMap[dStr] || {};
      const status = records[student.id] || '';
      let mark = '';
      if (status === 'P') {
        mark = '✅';
      } else if (status === 'A') {
        mark = '❌';
      } else if (status === 'T') {
        mark = 'T';
      } else if (status === 'J') {
        mark = 'E'; // E = Excusa / Justificada según formato Excel
      }
      studentRow.push(mark);
    });

    aoa.push(studentRow);
  });

  // Crear Hoja de Cálculo
  const ws = window.XLSX.utils.aoa_to_sheet(aoa);

  // Asignar merges
  ws['!merges'] = merges;

  // Ancho de columnas idéntico a la plantilla original
  const cols = [
    { wch: 5 },   // Col A: N°
    { wch: 13 },  // Col B: CATEGORIA
    { wch: 28 },  // Col C: NOMBRE
    { wch: 20 }   // Col D: AÑO DE NACIMIENTO
  ];
  dates.forEach(() => {
    cols.push({ wch: 4.5 }); // Columnas de días
  });
  ws['!cols'] = cols;

  // Crear Libro de Trabajo
  const wb = window.XLSX.utils.book_new();
  const cleanSheetName = division.name.slice(0, 31).replace(/[\\/?*[\]]/g, '');
  window.XLSX.utils.book_append_sheet(wb, ws, cleanSheetName || 'Asistencias');

  // Descargar archivo Excel binario
  const todayStr = new Date().toISOString().slice(0, 10);
  const cleanFileName = `Asistencia_${division.name.replace(/\s+/g, '_')}_${todayStr}.xlsx`;

  try {
    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (app && app.showToast) {
      app.showToast(`Excel de ${division.name} descargado ✓`, 'success');
    }
    return true;
  } catch (err) {
    console.error('Error exportando Excel:', err);
    if (app && app.showToast) {
      app.showToast('No se pudo generar el archivo Excel', 'info');
    }
    return false;
  }
}
