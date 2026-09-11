// Módulo de Componentes de Interfaz Personalizados — VolleyTrack
// Reemplaza los selects, calendarios y alertas nativas del sistema por modales oscuros elegantes

export const AppUI = {
  // Cierra cualquier modal abierto en el DOM
  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  },

  // Vincula el cierre de un modal en un solo toque (touch/pointer/click)
  bindModalClose(modal, onClose) {
    let isClosing = false;
    const doClose = (e) => {
      if (isClosing) return;
      isClosing = true;
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Ocultar teclado virtual desenfocando el elemento activo
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      modal.classList.add('closing');
      setTimeout(() => {
        modal.remove();
        if (onClose) onClose();
      }, 150);
    };

    // Botón cerrar (X)
    const closeBtns = modal.querySelectorAll('.modal-close-btn, [data-modal-close]');
    closeBtns.forEach(btn => {
      ['pointerdown', 'click'].forEach(evt => {
        btn.addEventListener(evt, doClose, { passive: false });
      });
    });

    // Clic o toque en el fondo oscuro (overlay)
    ['pointerdown', 'click'].forEach(evt => {
      modal.addEventListener(evt, (e) => {
        if (e.target === modal) {
          doClose(e);
        }
      }, { passive: false });
    });

    return doClose;
  },

  // =========================================================================
  // SELECT PERSONALIZADO (Bottom Sheet con radio buttons oscuros)
  // =========================================================================
  showSelectSheet({ title, subtitle = 'Selecciona una opción', options = [], currentValue, onSelect }) {
    // Cerrar previos
    document.querySelectorAll('#customSelectSheet').forEach(m => m.remove());

    const html = `
      <div class="modal-overlay select-sheet-overlay" id="customSelectSheet">
        <div class="modal-sheet">
          <div class="modal-header">
            <div>
              <div class="modal-title">${title}</div>
              <div class="modal-subtitle">${subtitle}</div>
            </div>
            <button class="modal-close-btn" type="button" aria-label="Cerrar">&times;</button>
          </div>
          <div class="sheet-options-list">
            ${options.map(opt => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lab = typeof opt === 'object' ? opt.label : opt;
              const isSelected = String(val) === String(currentValue);
              return `
                <div class="sheet-option-item ${isSelected ? 'selected' : ''}" data-value="${val}">
                  <span class="opt-label">${lab}</span>
                  <div class="radio-ring ${isSelected ? 'active' : ''}">
                    <div class="radio-dot"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = html;
    const modal = div.firstElementChild;
    document.body.appendChild(modal);

    const closeModal = this.bindModalClose(modal);

    modal.querySelectorAll('.sheet-option-item').forEach(item => {
      ['pointerdown', 'click'].forEach(evt => {
        item.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (navigator.vibrate) navigator.vibrate(10);
          const val = item.dataset.value;
          const label = item.querySelector('.opt-label')?.textContent || val;
          closeModal();
          if (onSelect) onSelect(val, label);
        }, { passive: false });
      });
    });
  },

  // =========================================================================
  // SELECTOR DE FECHA PERSONALIZADO (Dark Calendar Sheet)
  // =========================================================================
  showDatePicker({ initialDate, title = 'Fecha de Nacimiento', onSelect }) {
    document.querySelectorAll('#customDatePickerSheet').forEach(m => m.remove());

    // Parsear fecha inicial
    let selectedDate = null;
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const parts = initialDate.split('-');
      selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      // Por defecto para nacimientos de jugadoras: año 2013
      selectedDate = new Date(2013, 0, 15);
    }

    let viewYear = selectedDate.getFullYear();
    let viewMonth = selectedDate.getMonth();
    let showYearPicker = false;

    const MONTH_NAMES = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const DAY_NAMES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    const formatHeaderDate = (d) => {
      const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()];
      const monthAbbr = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'][d.getMonth()];
      return `${dayName}, ${d.getDate()} de ${monthAbbr} de ${d.getFullYear()}`;
    };

    const toYMD = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const modal = document.createElement('div');
    modal.className = 'modal-overlay select-sheet-overlay';
    modal.id = 'customDatePickerSheet';

    const renderCalendar = () => {
      const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

      let daysHtml = '';

      // Días del mes anterior
      for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const dNum = daysInPrevMonth - i;
        daysHtml += `<div class="dp-day dp-day-muted">${dNum}</div>`;
      }

      // Días del mes actual
      for (let day = 1; day <= daysInMonth; day++) {
        const isSelected = selectedDate &&
          selectedDate.getFullYear() === viewYear &&
          selectedDate.getMonth() === viewMonth &&
          selectedDate.getDate() === day;

        daysHtml += `
          <button type="button" class="dp-day ${isSelected ? 'selected' : ''}" data-day="${day}">
            ${day}
          </button>
        `;
      }

      // Rellenar resto de la semana
      const totalCells = firstDayOfMonth + daysInMonth;
      const nextDays = (7 - (totalCells % 7)) % 7;
      for (let day = 1; day <= nextDays; day++) {
        daysHtml += `<div class="dp-day dp-day-muted">${day}</div>`;
      }

      // Grid de años rápidos (desde 2005 hasta 2026)
      const currentYear = new Date().getFullYear();
      let yearChipsHtml = '';
      for (let y = currentYear; y >= 2005; y--) {
        yearChipsHtml += `
          <button type="button" class="dp-year-chip ${y === viewYear ? 'selected' : ''}" data-year="${y}">
            ${y}
          </button>
        `;
      }

      modal.innerHTML = `
        <div class="modal-sheet dp-modal-sheet">
          <div class="dp-header-card">
            <div class="dp-header-year" id="btnHeaderYearToggle">${viewYear}</div>
            <div class="dp-header-date">${formatHeaderDate(selectedDate)}</div>
          </div>

          <div class="dp-body">
            <!-- Barra de navegación de mes y año -->
            <div class="dp-month-nav">
              <button type="button" class="dp-nav-btn" id="dpPrevMonth" aria-label="Mes anterior">
                <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button type="button" class="dp-month-label" id="btnMonthYearToggle">
                ${MONTH_NAMES[viewMonth]} ${viewYear}
                <svg class="icon" viewBox="0 0 24 24" width="14" height="14" style="margin-left:4px;"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <button type="button" class="dp-nav-btn" id="dpNextMonth" aria-label="Mes siguiente">
                <svg class="icon" viewBox="0 0 24 24" width="16" height="16"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            <!-- Vista de selector de años -->
            <div class="dp-year-grid" id="dpYearPicker" style="${showYearPicker ? 'display:grid;' : 'display:none;'}">
              ${yearChipsHtml}
            </div>

            <!-- Vista de calendario mensual -->
            <div id="dpCalendarGrid" style="${showYearPicker ? 'display:none;' : 'display:block;'}">
              <div class="dp-weekdays">
                ${DAY_NAMES.map(d => `<span>${d}</span>`).join('')}
              </div>
              <div class="dp-days-grid">
                ${daysHtml}
              </div>
            </div>
          </div>

          <div class="dp-actions">
            <button type="button" class="btn-ghost dp-btn-clear" id="dpBtnClear">Borrar</button>
            <button type="button" class="btn-ghost" id="dpBtnCancel">Cancelar</button>
            <button type="button" class="btn-primary dp-btn-apply" id="dpBtnApply">Establecer</button>
          </div>
        </div>
      `;

      // Re-vincular eventos
      bindEvents();
    };

    const bindEvents = () => {
      // Toggle selector de años
      const toggleYear = () => {
        showYearPicker = !showYearPicker;
        renderCalendar();
      };
      modal.querySelector('#btnHeaderYearToggle')?.addEventListener('click', toggleYear);
      modal.querySelector('#btnMonthYearToggle')?.addEventListener('click', toggleYear);

      // Selección de año
      modal.querySelectorAll('.dp-year-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (navigator.vibrate) navigator.vibrate(8);
          viewYear = parseInt(chip.dataset.year, 10);
          selectedDate.setFullYear(viewYear);
          showYearPicker = false;
          renderCalendar();
        });
      });

      // Navegación meses
      modal.querySelector('#dpPrevMonth')?.addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        renderCalendar();
      });

      modal.querySelector('#dpNextMonth')?.addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        renderCalendar();
      });

      // Selección de día
      modal.querySelectorAll('.dp-day[data-day]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (navigator.vibrate) navigator.vibrate(8);
          const day = parseInt(btn.dataset.day, 10);
          selectedDate = new Date(viewYear, viewMonth, day);
          renderCalendar();
        });
      });

      // Acciones inferiores
      modal.querySelector('#dpBtnClear')?.addEventListener('click', () => {
        closeModal();
        if (onSelect) onSelect('');
      });

      modal.querySelector('#dpBtnCancel')?.addEventListener('click', () => {
        closeModal();
      });

      modal.querySelector('#dpBtnApply')?.addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(10);
        closeModal();
        if (onSelect) onSelect(toYMD(selectedDate));
      });
    };

    document.body.appendChild(modal);
    const closeModal = this.bindModalClose(modal);
    renderCalendar();
  },

  // =========================================================================
  // DIÁLOGO DE CONFIRMACIÓN ELEGANTE (Reemplaza confirm() nativo)
  // =========================================================================
  confirm({ title = '¿Estás seguro?', message = '', confirmText = 'Aceptar', cancelText = 'Cancelar', isDanger = true, onConfirm }) {
    document.querySelectorAll('#customConfirmModal').forEach(m => m.remove());

    const html = `
      <div class="modal-overlay" id="customConfirmModal" style="align-items:center; z-index:110;">
        <div class="custom-confirm-card">
          <div class="confirm-icon-box ${isDanger ? 'danger' : 'info'}">
            ${isDanger
              ? `<svg class="icon" viewBox="0 0 24 24" width="26" height="26" stroke="#ef4444"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
              : `<svg class="icon" viewBox="0 0 24 24" width="26" height="26" stroke="var(--accent)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
            }
          </div>
          <div class="confirm-title">${title}</div>
          <div class="confirm-message">${message}</div>
          <div class="confirm-actions">
            <button type="button" class="btn-ghost" id="btnConfirmCancel">${cancelText}</button>
            <button type="button" class="${isDanger ? 'btn-danger' : 'btn-primary'}" id="btnConfirmOk">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = html;
    const modal = div.firstElementChild;
    document.body.appendChild(modal);

    const closeModal = this.bindModalClose(modal);

    modal.querySelector('#btnConfirmCancel')?.addEventListener('click', closeModal);
    modal.querySelector('#btnConfirmOk')?.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(12);
      closeModal();
      if (onConfirm) onConfirm();
    });
  },

  // =========================================================================
  // ALERTA ELEGANTE (Reemplaza alert() nativo)
  // =========================================================================
  alert({ title = 'Atención', message = '', buttonText = 'Entendido', onOk }) {
    document.querySelectorAll('#customAlertModal').forEach(m => m.remove());

    const html = `
      <div class="modal-overlay" id="customAlertModal" style="align-items:center; z-index:110;">
        <div class="custom-confirm-card">
          <div class="confirm-title" style="margin-top:0;">${title}</div>
          <div class="confirm-message">${message}</div>
          <div class="confirm-actions">
            <button type="button" class="btn-primary" id="btnAlertOk" style="width:100%;">${buttonText}</button>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = html;
    const modal = div.firstElementChild;
    document.body.appendChild(modal);

    const closeModal = this.bindModalClose(modal);
    modal.querySelector('#btnAlertOk')?.addEventListener('click', () => {
      closeModal();
      if (onOk) onOk();
    });
  }
};
