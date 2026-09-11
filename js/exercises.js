// Módulo de Planes y Calificación — VolleyTrack
import { store } from './store.js';
import { getInitials } from './app.js';

const FUNDAMENTALS = [
  { id: 'saque',     name: 'Saque',      emoji: '🏐' },
  { id: 'recepcion', name: 'Recepción',  emoji: '🤲' },
  { id: 'colocacion',name: 'Colocación', emoji: '👆' },
  { id: 'remate',    name: 'Remate',     emoji: '⚡' },
  { id: 'bloqueo',   name: 'Bloqueo',   emoji: '🛡️' }
];

export function setupExercisesModule(app) {
  return {
    renderPlansListView(container, divisionId) {
      const division = store.getDivisionById(divisionId);
      if (!division) {
        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Sin categoría seleccionada</div>
            <h2>Ejercicios</h2>
          </div>
          <div class="empty-state">
            <svg class="icon" viewBox="0 0 24 24" width="36" height="36"><path d="M12 3v18M5 8h14M5 16h14"/></svg>
            <p>Ve a <strong>Inicio</strong> y selecciona una categoría para calificar ejercicios.</p>
          </div>
        `;
        return;
      }

      const students = store.getStudentsByDivision(divisionId);

      // Fecha local correcta (sin bug UTC)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

      // Obtener o crear plan de hoy (sin score default)
      let plans = store.getExercisePlansByDivision(divisionId);
      let todayPlan = plans.find(p => p.date === todayStr);

      if (!todayPlan) {
        todayPlan = store.saveExercisePlan({
          divisionId,
          title: `Sesión · ${division.name}`,
          date: todayStr,
          scaleMax: 10,
          exercises: FUNDAMENTALS.map(f => ({ id: f.id, name: f.name })),
          evaluations: {}
        });
      }

      let activeFundId = FUNDAMENTALS[0].id;
      let evaluations = JSON.parse(JSON.stringify(todayPlan.evaluations || {}));

      // Helpers
      const getScore = (studentId) => {
        return evaluations[studentId]?.scores?.[activeFundId];
      };

      const getTopPlayer = () => {
        let topName = null;
        let topScore = -Infinity;
        students.forEach(st => {
          const v = getScore(st.id);
          if (typeof v === 'number' && v > topScore) {
            topScore = v;
            topName = st.name;
          }
        });
        return { topName, topScore };
      };

      // Render inicial completo
      const renderInitial = () => {
        const { topName, topScore } = getTopPlayer();
        const activeFund = FUNDAMENTALS.find(f => f.id === activeFundId);

        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Sesión de hoy · ${division.name}</div>
            <h2>Ejercicios</h2>
          </div>

          <div class="fund-tabs" id="fundTabsBar">
            ${FUNDAMENTALS.map(fund => `
              <div class="fund-tab ${fund.id === activeFundId ? 'active' : ''}" data-fund="${fund.id}">
                ${fund.name}
              </div>
            `).join('')}
          </div>

          <div style="overflow-y:auto; flex:1; margin:0 -4px;" id="rateRowsBox">
            ${students.length === 0 ? `
              <div class="empty-state">
                <p>No hay jugadoras en ${division.name}.</p>
              </div>
            ` : `
              ${students.map(s => {
                const score = getScore(s.id);
                const hasScore = typeof score === 'number';
                return `
                  <div class="rate-row" data-id="${s.id}">
                    <div class="avatar">${getInitials(s.name)}</div>
                    <div class="player-info" style="flex:1; min-width:0;">
                      <div class="pname">${s.name}</div>
                    </div>
                    <div class="stepper">
                      <button class="btn-step-minus" data-student="${s.id}" ${hasScore && score <= 1 ? 'disabled' : ''}>−</button>
                      <div class="val" id="val-${s.id}" style="${!hasScore ? 'color:var(--text-faint);' : ''}">
                        ${hasScore ? score : '—'}
                      </div>
                      <button class="btn-step-plus" data-student="${s.id}" ${hasScore && score >= 10 ? 'disabled' : ''}>+</button>
                    </div>
                  </div>
                `;
              }).join('')}
            `}
          </div>

          <div class="honor-card" id="honorCard">
            <div class="badge">
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" stroke="#f7e9ec">
                <path d="M8 21h8M12 17v4M6 4h12l-1 6a5 5 0 0 1-10 0z"/>
                <path d="M6 6H4a2 2 0 0 0 2 4M18 6h2a2 2 0 0 1-2 4"/>
              </svg>
            </div>
            <div class="htext">
              <div class="h1">Mejor en ${activeFund?.name || ''}</div>
              <div class="h2" id="honorText">${topScore > -Infinity && topName ? `${topName} · ${topScore}/10` : 'Sin calificar aún'}</div>
            </div>
          </div>
        `;

        // Eventos de tabs
        container.querySelectorAll('.fund-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            activeFundId = tab.dataset.fund;
            if (navigator.vibrate) navigator.vibrate(8);
            // Re-render solo el contenido (no los tabs header)
            switchFundamental();
          });
        });

        // Eventos stepper — actualización puntual, sin re-render total
        container.querySelector('#rateRowsBox')?.addEventListener('click', (e) => {
          const minusBtn = e.target.closest('.btn-step-minus');
          const plusBtn = e.target.closest('.btn-step-plus');
          const btn = minusBtn || plusBtn;
          if (!btn) return;

          const studentId = btn.dataset.student;
          const delta = minusBtn ? -1 : 1;
          updateScore(studentId, delta);
        });
      };

      // Actualizar puntualmente el DOM del score (sin parpadear toda la pantalla)
      const updateScore = (studentId, delta) => {
        if (!evaluations[studentId]) evaluations[studentId] = { scores: {} };
        if (!evaluations[studentId].scores) evaluations[studentId].scores = {};

        let current = evaluations[studentId].scores[activeFundId];
        // Si no tiene score, iniciar desde 5 (no desde 7)
        if (current === undefined) current = delta > 0 ? 4 : 6;
        current = Math.max(1, Math.min(10, current + delta));

        evaluations[studentId].scores[activeFundId] = current;

        // Guardar
        store.saveExercisePlan({ id: todayPlan.id, evaluations });
        if (navigator.vibrate) navigator.vibrate(8);

        // Actualizar solo el valor del DOM (sin re-render)
        const valEl = container.querySelector(`#val-${studentId}`);
        if (valEl) {
          valEl.textContent = current;
          valEl.style.color = '';
        }

        // Actualizar botones +/- del mismo stepper
        const stepperEl = container.querySelector(`.rate-row[data-id="${studentId}"] .stepper`);
        if (stepperEl) {
          const minus = stepperEl.querySelector('.btn-step-minus');
          const plus = stepperEl.querySelector('.btn-step-plus');
          if (minus) minus.disabled = current <= 1;
          if (plus) plus.disabled = current >= 10;
        }

        // Actualizar solo el cuadro de honor
        updateHonorCard();
      };

      const updateHonorCard = () => {
        const { topName, topScore } = getTopPlayer();
        const activeFund = FUNDAMENTALS.find(f => f.id === activeFundId);
        const honorEl = container.querySelector('#honorText');
        const h1El = container.querySelector('.honor-card .h1');
        if (honorEl) honorEl.textContent = topScore > -Infinity && topName ? `${topName} · ${topScore}/10` : 'Sin calificar aún';
        if (h1El) h1El.textContent = `Mejor en ${activeFund?.name || ''}`;
      };

      // Cambiar de fundamento: re-render solo los valores del stepper, no toda la pantalla
      const switchFundamental = () => {
        // Actualizar tabs activos visualmente
        container.querySelectorAll('.fund-tab').forEach(tab => {
          tab.classList.toggle('active', tab.dataset.fund === activeFundId);
        });

        // Actualizar los steppers de cada alumna
        students.forEach(s => {
          const score = getScore(s.id);
          const hasScore = typeof score === 'number';
          const valEl = container.querySelector(`#val-${s.id}`);
          const stepperEl = container.querySelector(`.rate-row[data-id="${s.id}"] .stepper`);

          if (valEl) {
            valEl.textContent = hasScore ? score : '—';
            valEl.style.color = hasScore ? '' : 'var(--text-faint)';
          }
          if (stepperEl) {
            const minus = stepperEl.querySelector('.btn-step-minus');
            const plus = stepperEl.querySelector('.btn-step-plus');
            if (minus) minus.disabled = hasScore && score <= 1;
            if (plus) plus.disabled = hasScore && score >= 10;
          }
        });

        updateHonorCard();
      };

      renderInitial();
    }
  };
}
