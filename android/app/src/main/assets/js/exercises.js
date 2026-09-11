// Módulo de Planes y Calificación — VolleyTrack
import { store } from './store.js';
import { getInitials } from './app.js';

const FUNDAMENTALS = [
  { id: 'saque',      name: 'Saque' },
  { id: 'recepcion',  name: 'Recepción' },
  { id: 'colocacion', name: 'Colocación' },
  { id: 'remate',     name: 'Remate' },
  { id: 'bloqueo',    name: 'Bloqueo' }
];

export function setupExercisesModule(app) {
  return {
    renderPlansListView(container, initialDivisionId) {
      const divisions = store.getDivisions();

      // Sin divisiones en absoluto
      if (divisions.length === 0) {
        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Sin divisiones</div>
            <h2>Ejercicios</h2>
          </div>
          <div class="empty-state">
            <svg class="icon" viewBox="0 0 24 24" width="36" height="36"><path d="M12 3v18M5 8h14M5 16h14"/></svg>
            <p>Crea una <strong>División</strong> en Inicio antes de calificar ejercicios.</p>
          </div>
        `;
        return;
      }

      // Resolver la división activa
      let activeDivisionId = initialDivisionId
        || store.getActiveDivisionId()
        || divisions[0].id;
      if (!store.getDivisionById(activeDivisionId)) {
        activeDivisionId = divisions[0].id;
      }

      // Estado mutable de fundamentals (persiste entre cambios de división)
      let activeFundId = FUNDAMENTALS[0].id;

      // -------------------------------------------------------------------
      // loadSession: carga o crea el plan de hoy para la división activa
      // -------------------------------------------------------------------
      const loadSession = () => {
        const division = store.getDivisionById(activeDivisionId);
        const students = store.getStudentsByDivision(activeDivisionId);

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

        let plans = store.getExercisePlansByDivision(activeDivisionId);
        let todayPlan = plans.find(p => p.date === todayStr);

        if (!todayPlan) {
          todayPlan = store.saveExercisePlan({
            divisionId: activeDivisionId,
            title: `Sesión · ${division.name}`,
            date: todayStr,
            scaleMax: 10,
            exercises: FUNDAMENTALS.map(f => ({ id: f.id, name: f.name })),
            evaluations: {}
          });
        }

        return { division, students, todayPlan, todayStr };
      };

      // -------------------------------------------------------------------
      // renderSession: pinta la zona de calificación
      // -------------------------------------------------------------------
      const renderSession = () => {
        const { division, students, todayPlan } = loadSession();
        let evaluations = JSON.parse(JSON.stringify(todayPlan.evaluations || {}));

        const getScore = (studentId) => evaluations[studentId]?.scores?.[activeFundId];

        const getTopPlayer = () => {
          let topName = null;
          let topScore = -Infinity;
          students.forEach(st => {
            const v = getScore(st.id);
            if (typeof v === 'number' && v > topScore) { topScore = v; topName = st.name; }
          });
          return { topName, topScore };
        };

        const sessionBox = container.querySelector('#exSessionBox');
        if (!sessionBox) return;

        const { topName, topScore } = getTopPlayer();
        const activeFund = FUNDAMENTALS.find(f => f.id === activeFundId);

        sessionBox.innerHTML = `
          <!-- Pestañas de Fundamentos -->
          <div class="fund-tabs" id="fundTabsBar">
            ${FUNDAMENTALS.map(fund => `
              <div class="fund-tab ${fund.id === activeFundId ? 'active' : ''}" data-fund="${fund.id}">
                ${fund.name}
              </div>
            `).join('')}
          </div>

          <!-- Filas de calificación -->
          <div class="ex-rows-scroll" id="rateRowsBox">
            ${students.length === 0 ? `
              <div class="empty-state">
                <svg class="icon" viewBox="0 0 24 24" width="32" height="32"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5 7-5s7 2 7 5"/><circle cx="17" cy="8" r="2.4"/><path d="M16 15c2.8.3 5 2 5 5"/></svg>
                <p>No hay alumnas en <strong>${division.name}</strong>.</p>
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

          <!-- Cuadro de Honor -->
          <div class="honor-card" id="honorCard">
            <div class="badge">
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" stroke="#f7e9ec">
                <path d="M8 21h8M12 17v4M6 4h12l-1 6a5 5 0 0 1-10 0z"/>
                <path d="M6 6H4a2 2 0 0 0 2 4M18 6h2a2 2 0 0 1-2 4"/>
              </svg>
            </div>
            <div class="htext">
              <div class="h1" id="honorTitle">Mejor en ${activeFund?.name || ''}</div>
              <div class="h2" id="honorText">
                ${topScore > -Infinity && topName ? `${topName} · ${topScore}/10` : 'Sin calificar aún'}
              </div>
            </div>
          </div>
        `;

        // --- Cambio de fundamento (solo actualiza valores, no re-renderiza toda la lista) ---
        sessionBox.querySelector('#fundTabsBar')?.addEventListener('click', (e) => {
          const tab = e.target.closest('.fund-tab');
          if (!tab || tab.dataset.fund === activeFundId) return;
          activeFundId = tab.dataset.fund;
          if (navigator.vibrate) navigator.vibrate(8);

          // Actualizar tab activo
          sessionBox.querySelectorAll('.fund-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.fund === activeFundId)
          );

          // Actualizar valores de cada alumna sin re-render
          students.forEach(s => {
            const score = getScore(s.id);
            const hasScore = typeof score === 'number';
            const valEl = sessionBox.querySelector(`#val-${s.id}`);
            const stepperEl = sessionBox.querySelector(`.rate-row[data-id="${s.id}"] .stepper`);
            if (valEl) {
              valEl.textContent = hasScore ? score : '—';
              valEl.style.color = hasScore ? '' : 'var(--text-faint)';
            }
            if (stepperEl) {
              stepperEl.querySelector('.btn-step-minus').disabled = hasScore && score <= 1;
              stepperEl.querySelector('.btn-step-plus').disabled  = hasScore && score >= 10;
            }
          });

          updateHonorCard();
        });

        // --- Stepper +/- (actualización puntual del DOM) ---
        sessionBox.querySelector('#rateRowsBox')?.addEventListener('click', (e) => {
          const minus = e.target.closest('.btn-step-minus');
          const plus  = e.target.closest('.btn-step-plus');
          const btn   = minus || plus;
          if (!btn) return;

          const studentId = btn.dataset.student;
          const delta     = minus ? -1 : 1;

          if (!evaluations[studentId])        evaluations[studentId] = { scores: {} };
          if (!evaluations[studentId].scores) evaluations[studentId].scores = {};

          let current = evaluations[studentId].scores[activeFundId];
          if (current === undefined) current = delta > 0 ? 4 : 6;
          current = Math.max(1, Math.min(10, current + delta));
          evaluations[studentId].scores[activeFundId] = current;

          // Guardar
          store.saveExercisePlan({ id: todayPlan.id, evaluations });
          if (navigator.vibrate) navigator.vibrate(8);

          // Actualizar solo el DOM del stepper afectado
          const valEl = sessionBox.querySelector(`#val-${studentId}`);
          if (valEl) { valEl.textContent = current; valEl.style.color = ''; }

          const stepperEl = sessionBox.querySelector(`.rate-row[data-id="${studentId}"] .stepper`);
          if (stepperEl) {
            stepperEl.querySelector('.btn-step-minus').disabled = current <= 1;
            stepperEl.querySelector('.btn-step-plus').disabled  = current >= 10;
          }

          updateHonorCard();
        });

        const updateHonorCard = () => {
          const { topName: n, topScore: s } = getTopPlayer();
          const f = FUNDAMENTALS.find(f => f.id === activeFundId);
          const titleEl = sessionBox.querySelector('#honorTitle');
          const textEl  = sessionBox.querySelector('#honorText');
          if (titleEl) titleEl.textContent = `Mejor en ${f?.name || ''}`;
          if (textEl)  textEl.textContent  = s > -Infinity && n ? `${n} · ${s}/10` : 'Sin calificar aún';
        };
      };

      // -------------------------------------------------------------------
      // Render completo (chips de división + zona de sesión)
      // -------------------------------------------------------------------
      container.innerHTML = `
        <div class="screen-head">
          <div class="greet">Calificación de sesión</div>
          <h2>Ejercicios</h2>
        </div>

        <!-- Selector de división -->
        <div class="chip-row" id="exDivisionChipsRow">
          ${divisions.map(d => `
            <div class="chip ${d.id === activeDivisionId ? 'active' : ''}" data-divid="${d.id}">
              ${d.name}
            </div>
          `).join('')}
        </div>

        <!-- Zona de sesión -->
        <div id="exSessionBox" style="display:flex; flex-direction:column; flex:1; min-height:0;"></div>
      `;

      // Chips de división
      container.querySelector('#exDivisionChipsRow')?.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip[data-divid]');
        if (!chip) return;
        const newId = chip.dataset.divid;
        if (newId === activeDivisionId) return;

        if (navigator.vibrate) navigator.vibrate(8);

        container.querySelectorAll('#exDivisionChipsRow .chip').forEach(c =>
          c.classList.toggle('active', c.dataset.divid === newId)
        );

        activeDivisionId = newId;
        app.currentDivisionId = newId;
        store.setActiveDivisionId(newId);
        activeFundId = FUNDAMENTALS[0].id; // reset pestaña al cambiar de división

        renderSession();
      });

      // Render inicial
      renderSession();
    }
  };
}
