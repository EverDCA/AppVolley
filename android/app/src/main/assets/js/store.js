// Store centralizado con persistencia en localStorage para AppVolley
import { defaultDivisions, defaultStudents, defaultExerciseCatalog } from './seedData.js';

const STORAGE_KEYS = {
  DIVISIONS: 'appvolley_divisions_v1',
  STUDENTS: 'appvolley_students_v1',
  ATTENDANCE: 'appvolley_attendance_v1',
  EXERCISE_PLANS: 'appvolley_exercise_plans_v1',
  EXERCISE_CATALOG: 'appvolley_exercise_catalog_v1',
  ACTIVE_DIVISION: 'appvolley_active_division_v1'
};

class VolleyStore {
  constructor() {
    this.init();
  }

  init() {
    // Si no existen divisiones o alumnas, precargar datos reales del Excel
    if (!localStorage.getItem(STORAGE_KEYS.DIVISIONS)) {
      localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(defaultDivisions));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(defaultStudents));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISE_CATALOG)) {
      localStorage.setItem(STORAGE_KEYS.EXERCISE_CATALOG, JSON.stringify(defaultExerciseCatalog));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXERCISE_PLANS)) {
      localStorage.setItem(STORAGE_KEYS.EXERCISE_PLANS, JSON.stringify([]));
    }
  }

  // --- DIVISIONES ---
  getDivisions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DIVISIONS)) || [];
    } catch (e) {
      return [];
    }
  }

  getDivisionById(id) {
    return this.getDivisions().find(d => d.id === id) || null;
  }

  addDivision(divisionData) {
    const divisions = this.getDivisions();
    const id = 'sub-' + (divisionData.name || 'div').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
    const newDivision = {
      id,
      name: divisionData.name.trim(),
      code: divisionData.code ? divisionData.code.trim().toUpperCase() : divisionData.name.substring(0, 5).toUpperCase(),
      category: divisionData.category?.trim() || 'Categoría Juvenil',
      ageRange: divisionData.ageRange?.trim() || 'Libre',
      color: divisionData.color || '#8f142d',
      description: divisionData.description?.trim() || 'División de entrenamiento.'
    };
    divisions.push(newDivision);
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(divisions));
    return newDivision;
  }

  updateDivision(id, updatedData) {
    const divisions = this.getDivisions().map(d => d.id === id ? { ...d, ...updatedData } : d);
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(divisions));
  }

  deleteDivision(id) {
    const divisions = this.getDivisions().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(divisions));
    // Limpiar división activa si era esta
    if (this.getActiveDivisionId() === id) {
      this.setActiveDivisionId(divisions[0]?.id || null);
    }
  }

  getActiveDivisionId() {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_DIVISION);
    if (saved && this.getDivisionById(saved)) return saved;
    const all = this.getDivisions();
    return all.length > 0 ? all[0].id : null;
  }

  setActiveDivisionId(id) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DIVISION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DIVISION);
    }
  }

  // --- ALUMNOS / ALUMNAS ---
  getStudents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    } catch (e) {
      return [];
    }
  }

  getStudentsByDivision(divisionId) {
    return this.getStudents().filter(s => s.divisionId === divisionId);
  }

  getStudentById(id) {
    return this.getStudents().find(s => s.id === id) || null;
  }

  addStudent(studentData) {
    const students = this.getStudents();
    const newStudent = {
      id: 'stu-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name: studentData.name.trim(),
      birthDate: studentData.birthDate || '',
      divisionId: studentData.divisionId,
      jerseyNumber: studentData.jerseyNumber ? String(studentData.jerseyNumber).trim() : '',
      position: studentData.position ? studentData.position.trim() : 'General',
      notes: studentData.notes ? studentData.notes.trim() : '',
      createdAt: new Date().toISOString()
    };
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return newStudent;
  }

  updateStudent(id, studentData) {
    const students = this.getStudents().map(s => s.id === id ? { ...s, ...studentData } : s);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  deleteStudent(id) {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  calculateAge(birthDateStr) {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // --- ASISTENCIAS ---
  getAttendanceMap() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || {};
    } catch (e) {
      return {};
    }
  }

  getAttendanceKey(divisionId, dateStr) {
    return `${divisionId}__${dateStr}`;
  }

  getAttendanceForDate(divisionId, dateStr) {
    const map = this.getAttendanceMap();
    const key = this.getAttendanceKey(divisionId, dateStr);
    return map[key] || {
      divisionId,
      date: dateStr,
      records: {}, // studentId: 'P' | 'A' | 'T' | 'J'
      updatedAt: null,
      notes: ''
    };
  }

  saveAttendance(divisionId, dateStr, records, notes = '') {
    const map = this.getAttendanceMap();
    const key = this.getAttendanceKey(divisionId, dateStr);
    map[key] = {
      divisionId,
      date: dateStr,
      records,
      updatedAt: new Date().toISOString(),
      notes
    };
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(map));
    return map[key];
  }

  getAttendanceHistoryForDivision(divisionId) {
    const map = this.getAttendanceMap();
    const prefix = `${divisionId}__`;
    const list = [];
    for (const key of Object.keys(map)) {
      if (key.startsWith(prefix)) {
        list.push(map[key]);
      }
    }
    // Ordenar de más reciente a más antiguo
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  // --- EJERCICIOS Y PLANES DE ENTRENAMIENTO ---
  getExerciseCatalog() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXERCISE_CATALOG)) || defaultExerciseCatalog;
    } catch (e) {
      return defaultExerciseCatalog;
    }
  }

  addCatalogExercise(exercise) {
    const catalog = this.getExerciseCatalog();
    const newEx = {
      id: 'ex-' + Date.now().toString(36),
      name: exercise.name.trim(),
      category: exercise.category?.trim() || 'Fundamento',
      description: exercise.description?.trim() || '',
      maxScore: exercise.maxScore || 10
    };
    catalog.push(newEx);
    localStorage.setItem(STORAGE_KEYS.EXERCISE_CATALOG, JSON.stringify(catalog));
    return newEx;
  }

  getExercisePlans() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXERCISE_PLANS)) || [];
    } catch (e) {
      return [];
    }
  }

  getExercisePlansByDivision(divisionId) {
    return this.getExercisePlans()
      .filter(p => p.divisionId === divisionId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  getExercisePlanById(id) {
    return this.getExercisePlans().find(p => p.id === id) || null;
  }

  saveExercisePlan(planData) {
    const plans = this.getExercisePlans();
    if (planData.id) {
      // Actualizar
      const index = plans.findIndex(p => p.id === planData.id);
      if (index !== -1) {
        plans[index] = { ...plans[index], ...planData, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEYS.EXERCISE_PLANS, JSON.stringify(plans));
        return plans[index];
      }
    }
    // Crear nuevo
    const newPlan = {
      id: 'plan-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3),
      divisionId: planData.divisionId,
      title: planData.title.trim(),
      date: planData.date,
      scaleMax: planData.scaleMax || 10,
      exercises: planData.exercises || [], // [{ id, name, category, maxScore }]
      evaluations: planData.evaluations || {}, // { studentId: { exerciseId: score, notes: '' } }
      overallNotes: planData.overallNotes || '',
      createdAt: new Date().toISOString()
    };
    plans.push(newPlan);
    localStorage.setItem(STORAGE_KEYS.EXERCISE_PLANS, JSON.stringify(plans));
    return newPlan;
  }

  deleteExercisePlan(id) {
    const plans = this.getExercisePlans().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXERCISE_PLANS, JSON.stringify(plans));
  }

  // --- REINICIAR / EXPORTAR / IMPORTAR ---
  resetToExcelDefaults() {
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(defaultDivisions));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(defaultStudents));
    localStorage.setItem(STORAGE_KEYS.EXERCISE_CATALOG, JSON.stringify(defaultExerciseCatalog));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify({}));
    localStorage.setItem(STORAGE_KEYS.EXERCISE_PLANS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DIVISION, defaultDivisions[0].id);
  }

  exportFullBackup() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      divisions: this.getDivisions(),
      students: this.getStudents(),
      attendance: this.getAttendanceMap(),
      exercisePlans: this.getExercisePlans(),
      exerciseCatalog: this.getExerciseCatalog()
    };
  }

  importFullBackup(backupData) {
    if (!backupData || !backupData.divisions || !backupData.students) {
      throw new Error('Formato de respaldo no válido.');
    }
    localStorage.setItem(STORAGE_KEYS.DIVISIONS, JSON.stringify(backupData.divisions));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(backupData.students));
    if (backupData.attendance) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(backupData.attendance));
    }
    if (backupData.exercisePlans) {
      localStorage.setItem(STORAGE_KEYS.EXERCISE_PLANS, JSON.stringify(backupData.exercisePlans));
    }
    if (backupData.exerciseCatalog) {
      localStorage.setItem(STORAGE_KEYS.EXERCISE_CATALOG, JSON.stringify(backupData.exerciseCatalog));
    }
    return true;
  }
}

export const store = new VolleyStore();
