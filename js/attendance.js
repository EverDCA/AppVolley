// Módulo de Asistencia — Diseño idéntico a Screen 3 de volleytrack-diseno.html
import { store } from './store.js';
import { getInitials } from './app.js';

export function setupAttendanceModule(app) {
  return {
    renderAttendanceView(container, divisionId, targetDate = null) {
      const division = store.getDivisionById(divisionId);
      if (!division) {
        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Selecciona una categoría</div>
            <h2>Asistencia</h2>
          </div>
          <p style="color:var(--text-muted); font-size:13px;">Elige una división en Inicio para pasar asistencia.</p>
        `;
        return;
      }

      const todayStr = targetDate || new Date().toISOString().split('T')[0];
      const students = store.getStudentsByDivision(divisionId);
      const attendanceData = store.getAttendanceForDate(divisionId, todayStr);
      let records = { ...attendanceData.records };

      container.innerHTML = `
        <div class="screen-head">
          <div class="greet">${division.name}</div>
          <h2>Asistencia</h2>
        </div>

        <div class="date-nav">
          <button id="btnPrevDay" title="Día anterior">
            <svg class="icon" viewBox="0 0 24 24" width="14" height="14"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          <div class="day" id="dateText">${formatDateNav(todayStr)}</div>
          <button id="btnNextDay" title="Día siguiente">
            <svg class="icon" viewBox="0 0 24 24" width="14" height="14"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>

        <button class="btn-primary mark-all" id="btnMarkAllPresent">
          <svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="#f7e9ec"><path d="M20 6L9 17l-5-5"/></svg>
          Marcar todas presentes
        </button>

        <div style="overflow-y:auto; flex:1; margin:0 -4px;" id="attendanceRowsBox">
          ${students.length === 0 ? `
            <div style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px;">
              No hay alumnas registradas en ${division.name}.
            </div>
          ` : `
            ${students.map(s => {
              const currentStatus = records[s.id] || '';
              return `
                <div class="att-row" data-id="${s.id}">
                  <div class="avatar">${getInitials(s.name)}</div>
                  <div class="player-info" style="flex:1">
                    <div class="pname">${s.name}</div>
                    <div class="ptag">${s.jerseyNumber ? '#' + s.jerseyNumber + ' · ' : ''}${s.position || 'General'}</div>
                  </div>
                  <div class="seg">
                    <button class="${currentStatus === 'P' ? 'sel' : ''}" data-student="${s.id}" data-status="P">P</button>
                    <button class="${currentStatus === 'A' ? 'sel' : ''}" data-student="${s.id}" data-status="A">A</button>
                    <button class="${currentStatus === 'T' ? 'sel' : ''}" data-student="${s.id}" data-status="T">T</button>
                    <button class="${currentStatus === 'J' ? 'sel' : ''}" data-student="${s.id}" data-status="J">J</button>
                  </div>
                </div>
              `;
            }).join('')}
          `}
        </div>
      `;

      // Handlers de fecha
      container.querySelector('#btnPrevDay')?.addEventListener('click', () => {
        const d = new Date(todayStr + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        this.renderAttendanceView(container, divisionId, d.toISOString().split('T')[0]);
      });

      container.querySelector('#btnNextDay')?.addEventListener('click', () => {
        const d = new Date(todayStr + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        this.renderAttendanceView(container, divisionId, d.toISOString().split('T')[0]);
      });

      // Atajo: Marcar todas presentes
      container.querySelector('#btnMarkAllPresent')?.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(15);
        students.forEach(s => {
          records[s.id] = 'P';
        });
        store.saveAttendance(divisionId, todayStr, records);

        // Actualizar botones visualmente
        container.querySelectorAll('.seg').forEach(seg => {
          seg.querySelectorAll('button').forEach(b => b.classList.remove('sel'));
          seg.querySelector('button[data-status="P"]')?.classList.add('sel');
        });
        app.showToast('Todas marcadas presentes', 'success');
      });

      // Click en botones de estado P, A, T, J
      container.querySelector('#attendanceRowsBox')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg button');
        if (!btn) return;

        const studentId = btn.dataset.student;
        const status = btn.dataset.status;
        const seg = btn.closest('.seg');

        if (navigator.vibrate) navigator.vibrate(8);

        seg.querySelectorAll('button').forEach(b => b.classList.remove('sel'));

        if (records[studentId] === status) {
          delete records[studentId];
        } else {
          records[studentId] = status;
          btn.classList.add('sel');
        }

        // Auto-guardado instantáneo
        store.saveAttendance(divisionId, todayStr, records);
      });
    }
  };
}

function formatDateNav(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  const isToday = d.getFullYear() === today.getFullYear() &&
                  d.getMonth() === today.getMonth() &&
                  d.getDate() === today.getDate();

  const dayNum = d.getDate();
  const month = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
  if (isToday) {
    return `Hoy, ${dayNum} de ${month}`;
  }
  const weekday = d.toLocaleDateString('es-CO', { weekday: 'short' });
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capWeekday}, ${dayNum} de ${month}`;
}
