import {
  dateValue,
  monthGrid,
  moveDays,
  moveMonths,
  parseDate,
  utcDate,
} from '../lib/calendar.ts';
import type { CalendarDate } from '../lib/calendar.ts';

function installDate(inputId: string): void {
  function node<T extends HTMLElement>(id: string, type: { new (): T }): T {
    const element = document.getElementById(
      id === 'measurement-date'
        ? inputId
        : inputId + '-' + id.replace('date-', ''),
    );
    if (!(element instanceof type)) throw new Error(`Missing ${id}`);
    return element;
  }
  const c = { dateError: 'Enter a real date in year-month-day format.' };
  const input = node('measurement-date', HTMLInputElement);
  const opener = node('date-open', HTMLButtonElement);
  const dialog = node('date-dialog', HTMLDialogElement);
  const days = node('date-days', HTMLTableSectionElement);
  const error = node('date-error', HTMLParagraphElement);
  const previous = node('date-previous', HTMLButtonElement);
  const next = node('date-next', HTMLButtonElement);
  const locale = 'en-GB';
  const monthFormat = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  function today(): CalendarDate {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  }
  let focused = today();
  let restoreFocus: HTMLElement = opener;
  function clearError(): void {
    input.removeAttribute('aria-invalid');
    error.hidden = true;
    error.textContent = '';
  }
  function validate(): boolean {
    clearError();
    if (!input.value || parseDate(input.value)) return true;
    error.textContent = c.dateError;
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    return false;
  }
  function render(): void {
    node('date-month', HTMLParagraphElement).textContent = monthFormat.format(
      utcDate(focused),
    );
    previous.disabled = moveMonths(focused, -1) === null;
    next.disabled = moveMonths(focused, 1) === null;
    days.replaceChildren();
    let row = document.createElement('tr');
    for (const [index, date] of monthGrid(focused).entries()) {
      if (index % 7 === 0) {
        row = document.createElement('tr');
        days.append(row);
      }
      const cell = document.createElement('td');
      row.append(cell);
      if (!date) continue;
      const value = dateValue(date);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'date-day';
      button.textContent = String(date.day);
      button.dataset['date'] = value;
      button.dataset['outside'] = String(date.month !== focused.month);
      button.tabIndex = value === dateValue(focused) ? 0 : -1;
      button.setAttribute('aria-label', dayFormat.format(utcDate(date)));
      cell.setAttribute('aria-selected', String(value === input.value));
      if (value === dateValue(today()))
        button.setAttribute('aria-current', 'date');
      cell.append(button);
    }
  }
  function focusDay(): void {
    const target = days.querySelector<HTMLButtonElement>('[tabindex="0"]');
    target?.focus();
  }
  function move(date: CalendarDate | null): void {
    if (!date) return;
    focused = date;
    render();
    focusDay();
  }
  function choose(value: string): void {
    input.value = value;
    clearError();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    dialog.close();
  }
  function open(invoker: HTMLElement): void {
    restoreFocus = invoker;
    focused = parseDate(input.value) ?? today();
    render();
    if (!dialog.open) dialog.showModal();
    focusDay();
  }
  opener.addEventListener('click', () => {
    open(opener);
  });
  input.addEventListener('input', clearError);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      open(input);
    }
  });
  node('date-close', HTMLButtonElement).addEventListener('click', () => {
    dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open) restoreFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const targets = [
      ...dialog.querySelectorAll<HTMLButtonElement>('button'),
    ].filter((button) => !button.disabled && button.tabIndex >= 0);
    const index = targets.findIndex(
      (button) => button === document.activeElement,
    );
    const nextIndex = event.shiftKey
      ? (index - 1 + targets.length) % targets.length
      : (index + 1) % targets.length;
    event.preventDefault();
    targets[nextIndex]?.focus();
  });
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!dialog.open) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        dialog.close();
    },
    { capture: true },
  );
  previous.addEventListener('click', () => {
    move(moveMonths(focused, -1));
  });
  next.addEventListener('click', () => {
    move(moveMonths(focused, 1));
  });
  node('date-today', HTMLButtonElement).addEventListener('click', () => {
    choose(dateValue(today()));
  });
  node('date-clear', HTMLButtonElement).addEventListener('click', () => {
    choose('');
  });
  days.addEventListener('click', (event) => {
    const button =
      event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>('button[data-date]')
        : null;
    if (button?.dataset['date']) choose(button.dataset['date']);
  });
  days.addEventListener('focusin', (event) => {
    const button = event.target;
    if (!(button instanceof HTMLButtonElement)) return;
    const date = parseDate(button.dataset['date'] ?? '');
    if (!date) return;
    focused = date;
    for (const day of days.querySelectorAll<HTMLButtonElement>('button'))
      day.tabIndex = day === button ? 0 : -1;
  });
  days.addEventListener('keydown', (event) => {
    const weekday = utcDate(focused).getUTCDay();
    let target: CalendarDate | null;
    switch (event.key) {
      case 'ArrowLeft':
        target = moveDays(focused, -1);
        break;
      case 'ArrowRight':
        target = moveDays(focused, 1);
        break;
      case 'ArrowUp':
        target = moveDays(focused, -7);
        break;
      case 'ArrowDown':
        target = moveDays(focused, 7);
        break;
      case 'Home':
        target = moveDays(focused, -weekday);
        break;
      case 'End':
        target = moveDays(focused, 6 - weekday);
        break;
      case 'PageUp':
        target = moveMonths(focused, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        target = moveMonths(focused, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    move(target);
  });
  opener.disabled = false;
  input.addEventListener('blur', validate);
  input.form?.addEventListener('reset', () => {
    clearError();
    if (dialog.open) dialog.close();
  });
}

export function installDates(): void {
  for (const input of document.querySelectorAll<HTMLInputElement>(
    'input[data-date-picker]',
  ))
    installDate(input.id);
  for (const preset of document.querySelectorAll<HTMLSelectElement>(
    'select[data-time-for]',
  )) {
    const input = document.getElementById(preset.dataset['timeFor'] ?? '');
    if (!(input instanceof HTMLInputElement)) continue;
    input.addEventListener('input', () => {
      preset.value = [...preset.options].some(
        (option) => option.value === input.value,
      )
        ? input.value
        : '';
      preset.dispatchEvent(new Event('vinasig-select-sync'));
    });
    preset.addEventListener('change', () => {
      if (!preset.value) return;
      input.value = preset.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
