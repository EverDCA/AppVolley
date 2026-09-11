// Módulo de Asistencia — VolleyTrack
import { store } from './store.js';
import { getInitials } from './app.js';
import { AppUI } from './ui.js';
import { exportDivisionAttendanceToXlsx } from './exportExcel.js';

// Fecha local del dispositivo (sin el bug de UTC)
function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function setupAttendanceModule(app) {
  return {
    renderAttendanceView(container, initialDivisionId, targetDate = null) {
      const divisions = store.getDivisions();

      // Si no hay divisiones en absoluto, mostramos estado vacío
      if (divisions.length === 0) {
        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Sin divisiones</div>
            <h2>Asistencia</h2>
          </div>
          <div class="empty-state">
            <svg class="icon" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M7.5 14.5l2 2 4-4"/></svg>
            <p>Crea una <strong>División</strong> en Inicio antes de registrar asistencia.</p>
          </div>
        `;
        return;
      }

      // Resolver la división activa: la pasada como arg, la guardada en store, o la primera
      let activeDivisionId = initialDivisionId
        || store.getActiveDivisionId()
        || divisions[0].id;

      // Si la id no existe (división borrada), caer en la primera
      if (!store.getDivisionById(activeDivisionId)) {
        activeDivisionId = divisions[0].id;
      }

      // Estado mutable de fecha — persist entre cambios de división
      let todayStr = targetDate || getLocalDateStr();

      // ---------------------------------------------------------------
      // renderSession: pinta la sesión de asistencia para la división
      // y fecha actuales. Solo reemplaza la zona inferior del contenido,
      // NO los chips de selección de división.
      // ---------------------------------------------------------------
      const renderSession = () => {
        const division = store.getDivisionById(activeDivisionId);
        const students = store.getStudentsByDivision(activeDivisionId);
        const attendanceData = store.getAttendanceForDate(activeDivisionId, todayStr);
        let records = { ...attendanceData.records };

        const allPresent = () =>
          students.length > 0 && students.every(s => records[s.id] === 'P');

        const renderMarkAllBtn = (btn) => {
          if (!btn) return;
          const all = allPresent();
          btn.innerHTML = all
            ? `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"><path d="M18 6L7 17l-5-5"/><path d="M23 6L12 17l-2-2"/></svg> Desmarcar todas`
            : `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="#f7e9ec"><path d="M20 6L9 17l-5-5"/></svg> Marcar todas presentes`;
          btn.className = all ? 'btn-ghost mark-all' : 'btn-primary mark-all';
        };

        // Contar resumen de estados
        const countStatus = (status) => Object.values(records).filter(v => v === status).length;

        const sessionBox = container.querySelector('#attSessionBox');
        if (!sessionBox) return;

        sessionBox.innerHTML = `
          <!-- Resumen del día -->
          <div class="att-summary-strip">
            <div class="att-sum-chip present">
              <span class="num">${countStatus('P')}</span>
              <span class="lab">Presentes</span>
            </div>
            <div class="att-sum-chip absent">
              <span class="num">${countStatus('A')}</span>
              <span class="lab">Ausentes</span>
            </div>
            <div class="att-sum-chip late">
              <span class="num">${countStatus('T')}</span>
              <span class="lab">Tarde</span>
            </div>
            <div class="att-sum-chip justified">
              <span class="num">${countStatus('J')}</span>
              <span class="lab">Justif.</span>
            </div>
          </div>

          <!-- Nav de fecha -->
          <div class="date-nav">
            <button id="btnPrevDay" title="Día anterior">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14"><path d="M15 6l-6 6 6 6"/></svg>
            </button>
            <div class="day" id="dateText">${formatDateNav(todayStr)}</div>
            <button id="btnNextDay" title="Día siguiente">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>

          <!-- Marcar todas -->
          <button class="${allPresent() ? 'btn-ghost' : 'btn-primary'} mark-all" id="btnMarkAllPresent">
            ${allPresent()
              ? `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor"><path d="M18 6L7 17l-5-5"/><path d="M23 6L12 17l-2-2"/></svg> Desmarcar todas`
              : `<svg class="icon" viewBox="0 0 24 24" width="16" height="16" stroke="#f7e9ec"><path d="M20 6L9 17l-5-5"/></svg> Marcar todas presentes`}
          </button>

          <!-- Botón Exportar Asistencias a Excel -->
          <button class="att-export-btn" id="btnExportAttendanceXlsx" title="Exportar historial de asistencia a Excel">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Exportar Asistencias de ${division.name} (.xlsx)
          </button>

          <!-- Lista de alumnas -->
          <div class="att-rows-scroll" id="attendanceRowsBox">
            ${students.length === 0 ? `
              <div class="empty-state">
                <svg class="icon" viewBox="0 0 24 24" width="32" height="32"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><circle cx="17" cy="8" r="2.4"/><path d="M16 15c2.8.3 5 2 5 5"/></svg>
                <p>No hay alumnas en <strong>${division.name}</strong>.<br>Agrégalas desde la pestaña <strong>Alumnas</strong>.</p>
              </div>
            ` : `
              ${students.map(s => {
                const st = records[s.id] || '';
                return `
                  <div class="att-row" data-id="${s.id}">
                    <div class="avatar">${getInitials(s.name)}</div>
                    <div class="player-info" style="flex:1">
                      <div class="pname">${s.name}</div>
                      <div class="ptag">${s.jerseyNumber ? '#' + s.jerseyNumber + ' · ' : ''}${s.position || 'General'}</div>
                    </div>
                    <div class="seg">
                      <button class="${st === 'P' ? 'sel' : ''}" data-student="${s.id}" data-status="P" title="Presente">P</button>
                      <button class="${st === 'A' ? 'sel' : ''}" data-student="${s.id}" data-status="A" title="Ausente">A</button>
                      <button class="${st === 'T' ? 'sel' : ''}" data-student="${s.id}" data-status="T" title="Tarde">T</button>
                      <button class="${st === 'J' ? 'sel' : ''}" data-student="${s.id}" data-status="J" title="Justificada">J</button>
                    </div>
                  </div>
                `;
              }).join('')}
            `}
          </div>
        `;

        // --- Eventos de la sesión ---

        // Navegación de fecha
        sessionBox.querySelector('#btnPrevDay')?.addEventListener('click', () => {
          const d = new Date(todayStr + 'T12:00:00');
          d.setDate(d.getDate() - 1);
          todayStr = getLocalDateStr(d);
          renderSession();
        });

        sessionBox.querySelector('#btnNextDay')?.addEventListener('click', () => {
          const d = new Date(todayStr + 'T12:00:00');
          d.setDate(d.getDate() + 1);
          if (getLocalDateStr(d) > getLocalDateStr()) {
            app.showToast('No puedes registrar asistencia en el futuro', 'info');
            return;
          }
          todayStr = getLocalDateStr(d);
          renderSession();
        });

        // Tocar fecha para abrir calendario personalizado
        sessionBox.querySelector('#dateText')?.addEventListener('click', () => {
          AppUI.showDatePicker({
            initialDate: todayStr,
            title: 'Fecha de Asistencia',
            onSelect: (dateStr) => {
              if (dateStr) {
                if (dateStr > getLocalDateStr()) {
                  app.showToast('No puedes registrar asistencia en el futuro', 'info');
                  return;
                }
                todayStr = dateStr;
                renderSession();
              }
            }
          });
        });

        // Exportar a Excel (.xlsx)
        sessionBox.querySelector('#btnExportAttendanceXlsx')?.addEventListener('click', () => {
          if (navigator.vibrate) navigator.vibrate(10);
          exportDivisionAttendanceToXlsx(activeDivisionId, app);
        });

        // Toggle marcar / desmarcar todas
        const markAllBtn = sessionBox.querySelector('#btnMarkAllPresent');
        markAllBtn?.addEventListener('click', () => {
          if (navigator.vibrate) navigator.vibrate(15);
          if (allPresent()) {
            students.forEach(s => { delete records[s.id]; });
            app.showToast('Asistencia limpiada', 'info');
          } else {
            students.forEach(s => { records[s.id] = 'P'; });
            app.showToast('Todas presentes ✓', 'success');
          }
          store.saveAttendance(activeDivisionId, todayStr, records);
          // Re-render solo la sesión para actualizar chips y lista
          renderSession();
        });

        // P / A / T / J individual
        sessionBox.querySelector('#attendanceRowsBox')?.addEventListener('click', (e) => {
          const btn = e.target.closest('.seg button');
          if (!btn) return;

          const studentId = btn.dataset.student;
          const status    = btn.dataset.status;
          const seg       = btn.closest('.seg');

          if (navigator.vibrate) navigator.vibrate(8);

          seg.querySelectorAll('button').forEach(b => b.classList.remove('sel'));

          if (records[studentId] === status) {
            delete records[studentId];
          } else {
            records[studentId] = status;
            btn.classList.add('sel');
          }

          store.saveAttendance(activeDivisionId, todayStr, records);

          // Actualizar el resumen de chips sin re-render total
          updateSummaryChips(sessionBox, records);
          renderMarkAllBtn(markAllBtn);
        });
      };

      // Actualiza solo los chips de resumen (P/A/T/J) sin re-render de filas
      const updateSummaryChips = (box, records) => {
        const count = (s) => Object.values(records).filter(v => v === s).length;
        box.querySelector('.att-sum-chip.present .num')?.  (() => {})
          || void (box.querySelector('.att-sum-chip.present .num') && (box.querySelector('.att-sum-chip.present .num').textContent = count('P')));
        const chips = box.querySelectorAll('.att-sum-chip .num');
        const statuses = ['P','A','T','J'];
        chips.forEach((el, i) => { el.textContent = count(statuses[i]); });
      };

      // ---------------------------------------------------------------
      // Render completo inicial (chips de división + zona de sesión)
      // ---------------------------------------------------------------
      container.innerHTML = `
        <div class="screen-head">
          <div class="greet">Registro de asistencia</div>
          <h2>Asistencia</h2>
        </div>

        <!-- Selector de división -->
        <div class="chip-row" id="divisionChipsRow">
          ${divisions.map(d => `
            <div class="chip ${d.id === activeDivisionId ? 'active' : ''}" data-divid="${d.id}">
              ${d.name}
            </div>
          `).join('')}
        </div>

        <!-- Zona de sesión (se reemplaza al cambiar división o fecha) -->
        <div id="attSessionBox" style="display:flex; flex-direction:column; flex:1; min-height:0;"></div>
      `;

      // Eventos chips de división
      container.querySelector('#divisionChipsRow')?.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip[data-divid]');
        if (!chip) return;

        const newId = chip.dataset.divid;
        if (newId === activeDivisionId) return;

        if (navigator.vibrate) navigator.vibrate(8);

        // Actualizar chip activo visualmente
        container.querySelectorAll('#divisionChipsRow .chip').forEach(c =>
          c.classList.toggle('active', c.dataset.divid === newId)
        );

        // Cambiar división activa y guardar en store
        activeDivisionId = newId;
        app.currentDivisionId = newId;
        store.setActiveDivisionId(newId);

        // Re-render solo la sesión
        renderSession();
      });

      // Render inicial de la sesión
      renderSession();
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

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.getFullYear() === yesterday.getFullYear() &&
                      d.getMonth() === yesterday.getMonth() &&
                      d.getDate() === yesterday.getDate();

  const dayNum = d.getDate();
  const month = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');

  if (isToday)     return `Hoy, ${dayNum} de ${month}`;
  if (isYesterday) return `Ayer, ${dayNum} de ${month}`;

  const weekday = d.toLocaleDateString('es-CO', { weekday: 'short' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayNum} de ${month}`;
}
