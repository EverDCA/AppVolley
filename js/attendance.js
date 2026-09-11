// Módulo de Asistencia — VolleyTrack
import { store } from './store.js';
import { getInitials } from './app.js';

// Fecha local del dispositivo (sin el bug de UTC)
function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function setupAttendanceModule(app) {
  return {
    renderAttendanceView(container, divisionId, targetDate = null) {
      const division = store.getDivisionById(divisionId);
      if (!division) {
        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Sin categoría seleccionada</div>
            <h2>Asistencia</h2>
          </div>
          <div class="empty-state">
            <svg class="icon" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M7.5 14.5l2 2 4-4"/></svg>
            <p>Ve a <strong>Inicio</strong> y selecciona una categoría para pasar asistencia.</p>
          </div>
        `;
        return;
      }

      const todayStr = targetDate || getLocalDateStr();
      const students = store.getStudentsByDivision(divisionId);
      const attendanceData = store.getAttendanceForDate(divisionId, todayStr);
      let records = { ...attendanceData.records };

      const allPresent = () => students.length > 0 && students.every(s => records[s.id] === 'P');

      const renderMarkAllBtn = (btn) => {
        if (!btn) return;
        const allArePresent = allPresent();
        btn.innerHTML = allArePresent
          ? `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"><path d="M18 6L7 17l-5-5"/><path d="M23 6L12 17l-2-2"/></svg> Desmarcar todas`
          : `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="#f7e9ec"><path d="M20 6L9 17l-5-5"/></svg> Marcar todas presentes`;
        btn.className = allArePresent ? 'btn-ghost mark-all' : 'btn-primary mark-all';
      };

      container.innerHTML = `
        <div class="screen-head">
          <div class="greet">${division.name} · ${students.length} jugadoras</div>
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

        <button class="${allPresent() ? 'btn-ghost' : 'btn-primary'} mark-all" id="btnMarkAllPresent">
          ${allPresent()
            ? `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"><path d="M18 6L7 17l-5-5"/><path d="M23 6L12 17l-2-2"/></svg> Desmarcar todas`
            : `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="#f7e9ec"><path d="M20 6L9 17l-5-5"/></svg> Marcar todas presentes`}
        </button>

        <div style="overflow-y:auto; flex:1; margin:0 -4px;" id="attendanceRowsBox">
          ${students.length === 0 ? `
            <div class="empty-state">
              <p>No hay alumnas en ${division.name}.<br>Agrégalas desde <strong>Alumnas</strong>.</p>
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
                    <button class="${currentStatus === 'P' ? 'sel' : ''}" data-student="${s.id}" data-status="P" title="Presente">P</button>
                    <button class="${currentStatus === 'A' ? 'sel' : ''}" data-student="${s.id}" data-status="A" title="Ausente">A</button>
                    <button class="${currentStatus === 'T' ? 'sel' : ''}" data-student="${s.id}" data-status="T" title="Tarde">T</button>
                    <button class="${currentStatus === 'J' ? 'sel' : ''}" data-student="${s.id}" data-status="J" title="Justificada">J</button>
                  </div>
                </div>
              `;
            }).join('')}
          `}
        </div>
      `;

      // Navegación de fecha
      container.querySelector('#btnPrevDay')?.addEventListener('click', () => {
        const d = new Date(todayStr + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        this.renderAttendanceView(container, divisionId, getLocalDateStr(d));
      });

      container.querySelector('#btnNextDay')?.addEventListener('click', () => {
        const d = new Date(todayStr + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        // No permitir navegar al futuro
        if (getLocalDateStr(d) > getLocalDateStr()) {
          app.showToast('No puedes pasar asistencia en el futuro', 'info');
          return;
        }
        this.renderAttendanceView(container, divisionId, getLocalDateStr(d));
      });

      // Toggle marcar/desmarcar todas
      const markAllBtn = container.querySelector('#btnMarkAllPresent');
      markAllBtn?.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(15);

        if (allPresent()) {
          // Desmarcar todas
          students.forEach(s => { delete records[s.id]; });
          app.showToast('Asistencia limpiada', 'info');
        } else {
          // Marcar todas presentes
          students.forEach(s => { records[s.id] = 'P'; });
          app.showToast('Todas marcadas presentes ✓', 'success');
        }

        store.saveAttendance(divisionId, todayStr, records);
        renderMarkAllBtn(markAllBtn);

        // Actualizar botones del segmented control visualmente
        container.querySelectorAll('.seg').forEach(seg => {
          const studentId = seg.querySelector('button')?.dataset.student;
          seg.querySelectorAll('button').forEach(b => b.classList.remove('sel'));
          if (studentId && records[studentId]) {
            seg.querySelector(`button[data-status="${records[studentId]}"]`)?.classList.add('sel');
          }
        });
      });

      // Click en P / A / T / J
      container.querySelector('#attendanceRowsBox')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg button');
        if (!btn) return;

        const studentId = btn.dataset.student;
        const status = btn.dataset.status;
        const seg = btn.closest('.seg');

        if (navigator.vibrate) navigator.vibrate(8);

        seg.querySelectorAll('button').forEach(b => b.classList.remove('sel'));

        if (records[studentId] === status) {
          // Toggle off
          delete records[studentId];
        } else {
          records[studentId] = status;
          btn.classList.add('sel');
        }

        // Auto-guardado instantáneo
        store.saveAttendance(divisionId, todayStr, records);

        // Actualizar el botón de marcar-todas
        renderMarkAllBtn(markAllBtn);
      });
    }
  };
}

function formatDateNav(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  // Usar horario local correcto (evitando UTC shift)
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const today = new Date();
  const isToday = d.getFullYear() === today.getFullYear() &&
                  d.getMonth() === today.getMonth() &&
                  d.getDate() === today.getDate();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.getFullYear() === yesterday.getFullYear() &&
                      d.getMonth() === yesterday.getMonth() &&
                      d.getDate() === yesterday.getDate();

  const dayNum = d.getDate();
  const month = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');

  if (isToday) return `Hoy, ${dayNum} de ${month}`;
  if (isYesterday) return `Ayer, ${dayNum} de ${month}`;

  const weekday = d.toLocaleDateString('es-CO', { weekday: 'short' });
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capWeekday}, ${dayNum} de ${month}`;
}
