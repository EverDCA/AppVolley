// Módulo de Planes y Calificación — Diseño idéntico a Screen 4 de volleytrack-diseno.html
import { store } from './store.js';
import { getInitials } from './app.js';

export function setupExercisesModule(app) {
  return {
    renderPlansListView(container, divisionId) {
      const division = store.getDivisionById(divisionId);
      if (!division) {
        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Selecciona una categoría</div>
            <h2>Plan de ejercicios</h2>
          </div>
          <p style="color:var(--text-muted); font-size:13px;">Elige una división en Inicio para calificar ejercicios.</p>
        `;
        return;
      }

      const students = store.getStudentsByDivision(divisionId);
      const todayStr = new Date().toISOString().split('T')[0];

      // Lista de fundamentos predeterminados de voleibol
      const fundamentals = [
        { id: 'saque', name: 'Saque' },
        { id: 'recepcion', name: 'Recepción' },
        { id: 'colocacion', name: 'Colocación' },
        { id: 'remate', name: 'Remate' },
        { id: 'bloqueo', name: 'Bloqueo' }
      ];

      // Obtener o crear plan de hoy
      let plans = store.getExercisePlansByDivision(divisionId);
      let todayPlan = plans.find(p => p.date === todayStr);

      if (!todayPlan) {
        todayPlan = store.saveExercisePlan({
          divisionId,
          title: `Sesión de entrenamiento · ${division.name}`,
          date: todayStr,
          scaleMax: 10,
          exercises: fundamentals,
          evaluations: {}
        });
      }

      let activeFundId = fundamentals[0].id;
      let evaluations = todayPlan.evaluations || {};

      const renderScreen = () => {
        // Calcular mejor jugadora para el cuadro de honor
        let topName = 'Sin calificar';
        let topScore = 0;

        students.forEach(st => {
          const stEval = evaluations[st.id]?.scores || {};
          const currentVal = stEval[activeFundId];
          if (typeof currentVal === 'number' && currentVal > topScore) {
            topScore = currentVal;
            topName = st.name;
          }
        });

        container.innerHTML = `
          <div class="screen-head">
            <div class="greet">Sesión de hoy · ${division.name}</div>
            <h2>Plan de ejercicios</h2>
          </div>

          <!-- Pestañas de Fundamentos -->
          <div class="fund-tabs" id="fundTabsBar">
            ${fundamentals.map(fund => `
              <div class="fund-tab ${fund.id === activeFundId ? 'active' : ''}" data-fund="${fund.id}">
                ${fund.name}
              </div>
            `).join('')}
          </div>

          <!-- Filas de calificación por alumna -->
          <div style="overflow-y:auto; flex:1; margin:0 -4px;" id="rateRowsBox">
            ${students.length === 0 ? `
              <div style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px;">
                No hay jugadoras en ${division.name}.
              </div>
            ` : `
              ${students.map(s => {
                const stEval = evaluations[s.id]?.scores || {};
                const score = stEval[activeFundId] !== undefined ? stEval[activeFundId] : 7;
                return `
                  <div class="rate-row" data-id="${s.id}">
                    <div class="avatar">${getInitials(s.name)}</div>
                    <div class="player-info" style="flex:1">
                      <div class="pname">${s.name}</div>
                    </div>
                    <div class="stepper">
                      <button class="btn-step-minus" data-student="${s.id}">−</button>
                      <div class="val" id="val-${s.id}">${score}</div>
                      <button class="btn-step-plus" data-student="${s.id}">+</button>
                    </div>
                  </div>
                `;
              }).join('')}
            `}
          </div>

          <!-- Cuadro de Honor -->
          <div class="honor-card">
            <div class="badge">
              <svg class="icon" viewBox="0 0 24 24" width="18" height="18" stroke="#f7e9ec">
                <path d="M8 21h8M12 17v4M6 4h12l-1 6a5 5 0 0 1-10 0z"/>
                <path d="M6 6H4a2 2 0 0 0 2 4M18 6h2a2 2 0 0 1-2 4"/>
              </svg>
            </div>
            <div class="htext">
              <div class="h1">Cuadro de honor (${fundamentals.find(f => f.id === activeFundId)?.name})</div>
              <div class="h2">${topScore > 0 ? `${topName} · ${topScore}/10` : 'En evaluación'}</div>
            </div>
          </div>
        `;

        // Eventos de Pestañas de Fundamentos
        container.querySelectorAll('.fund-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            activeFundId = tab.dataset.fund;
            if (navigator.vibrate) navigator.vibrate(8);
            renderScreen();
          });
        });

        // Eventos Stepper (+ y -)
        container.querySelectorAll('.btn-step-minus').forEach(btn => {
          btn.addEventListener('click', () => {
            updateStudentScore(btn.dataset.student, -1);
          });
        });

        container.querySelectorAll('.btn-step-plus').forEach(btn => {
          btn.addEventListener('click', () => {
            updateStudentScore(btn.dataset.student, 1);
          });
        });
      };

      const updateStudentScore = (studentId, delta) => {
        if (!evaluations[studentId]) evaluations[studentId] = { scores: {} };
        if (!evaluations[studentId].scores) evaluations[studentId].scores = {};

        let current = evaluations[studentId].scores[activeFundId];
        if (current === undefined) current = 7;
        current += delta;
        if (current < 1) current = 1;
        if (current > 10) current = 10;

        evaluations[studentId].scores[activeFundId] = current;

        // Auto-guardado
        store.saveExercisePlan({
          id: todayPlan.id,
          evaluations
        });

        if (navigator.vibrate) navigator.vibrate(8);
        renderScreen();
      };

      renderScreen();
    }
  };
}
