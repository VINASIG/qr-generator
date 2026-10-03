/** A styled select-only combobox. The hidden select retains form state. */
export function installSelects(root: ParentNode = document): void {
  for (const select of root.querySelectorAll<HTMLSelectElement>(
    'select[data-custom-select]',
  )) {
    if (select.dataset['enhanced']) continue;
    select.dataset['enhanced'] = 'true';
    const existingTrigger = document.getElementById(select.id + '-control');
    const trigger =
      existingTrigger instanceof HTMLButtonElement
        ? existingTrigger
        : document.createElement('button');
    trigger.replaceChildren();
    trigger.type = 'button';
    trigger.id = select.id + '-control';
    trigger.className = 'select-control';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const value = document.createElement('span');
    trigger.append(value);
    // Lucide chevron-down geometry. The icon is decorative.
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [name, setting] of Object.entries({
      viewBox: '0 0 24 24',
      width: '20',
      height: '20',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    }))
      icon.setAttribute(name, setting);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', 'm6 9 6 6 6-6');
    icon.append(line);
    trigger.append(icon);
    const existingPanel = document.getElementById(select.id + '-options');
    const panel =
      existingPanel instanceof HTMLDivElement
        ? existingPanel
        : document.createElement('div');
    panel.replaceChildren();
    panel.id = select.id + '-options';
    panel.className = 'select-options';
    panel.hidden = true;
    panel.setAttribute('role', 'listbox');
    trigger.setAttribute('aria-controls', panel.id);
    const labels = [...document.querySelectorAll('label')].filter(
      (label) => label.htmlFor === select.id || label.htmlFor === trigger.id,
    );
    const labelIds = labels
      .map((label, index) => {
        if (!label.id) label.id = select.id + '-label-' + String(index);
        label.htmlFor = trigger.id;
        return label.id;
      })
      .join(' ');
    if (labelIds) {
      trigger.setAttribute('aria-labelledby', labelIds);
      panel.setAttribute(
        'aria-label',
        labels.map((label) => label.textContent.trim()).join(' ') + ' options',
      );
    } else {
      trigger.setAttribute(
        'aria-label',
        select.getAttribute('aria-label') ?? select.name,
      );
      panel.setAttribute(
        'aria-label',
        trigger.getAttribute('aria-label') ?? '',
      );
    }
    select.after(trigger);
    document.body.append(panel);
    select.hidden = true;
    let active = select.selectedIndex;
    let search = '';
    let searchTime = 0;
    const options = [...select.options];
    const rows = options.map((option, index) => {
      const row = document.createElement('div');
      row.id = panel.id + '-' + String(index);
      row.className = 'select-option';
      row.setAttribute('role', 'option');
      row.dataset['value'] = option.value;
      row.textContent = option.textContent.trim();
      panel.append(row);
      row.addEventListener('click', () => {
        if (option.disabled) return;
        active = index;
        commit();
        close();
        trigger.focus({ preventScroll: true });
      });
      return row;
    });
    function sync(): void {
      value.textContent = select.selectedOptions[0]?.textContent.trim() ?? '';
      trigger.disabled = select.matches(':disabled');
      for (const attribute of ['aria-describedby', 'aria-invalid']) {
        const setting = select.getAttribute(attribute);
        if (setting) trigger.setAttribute(attribute, setting);
        else trigger.removeAttribute(attribute);
      }
      rows.forEach((row, index) => {
        row.setAttribute(
          'aria-selected',
          String(index === select.selectedIndex),
        );
        row.setAttribute(
          'aria-disabled',
          String(options[index]?.disabled ?? false),
        );
        row.dataset['active'] = String(index === active);
      });
      if (trigger.disabled) close();
    }
    function position(): void {
      const bounds = trigger.getBoundingClientRect();
      const margin = 12;
      const width = Math.min(
        Math.max(bounds.width, 200),
        innerWidth - margin * 2,
      );
      panel.style.width = String(width) + 'px';
      const below = innerHeight - bounds.bottom - margin - 6;
      const above = bounds.top - margin - 6;
      const down = below >= Math.min(240, panel.scrollHeight) || below >= above;
      panel.style.maxHeight =
        String(Math.max(44, Math.min(320, down ? below : above))) + 'px';
      panel.style.left =
        String(
          Math.max(margin, Math.min(bounds.left, innerWidth - width - margin)),
        ) + 'px';
      panel.style.top =
        String(
          down
            ? bounds.bottom + 6
            : Math.max(
                margin,
                bounds.top - panel.getBoundingClientRect().height - 6,
              ),
        ) + 'px';
    }
    function highlight(index: number): void {
      active = index;
      rows.forEach((row, i) => {
        row.dataset['active'] = String(i === active);
      });
      const row = rows[active];
      if (row) {
        trigger.setAttribute('aria-activedescendant', row.id);
        row.scrollIntoView({ block: 'nearest' });
      }
    }
    function close(): void {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      search = '';
    }
    function open(): void {
      if (select.matches(':disabled')) return;
      // WebKit does not focus buttons on pointer activation by default.
      trigger.focus({ preventScroll: true });
      document.dispatchEvent(
        new CustomEvent('vinasig-select-open', { detail: select.id }),
      );
      active = select.selectedIndex;
      sync();
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position();
      highlight(active);
    }
    function commit(): void {
      if (active < 0 || options[active]?.disabled) return;
      if (select.selectedIndex !== active) {
        select.selectedIndex = active;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
    }
    function move(offset: number): void {
      let index = active;
      do {
        index += offset;
      } while (options[index]?.disabled);
      if (options[index]) highlight(index);
    }
    trigger.addEventListener('click', () => {
      if (panel.hidden) open();
      else close();
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        close();
        event.preventDefault();
        return;
      }
      if (event.key === 'Tab') {
        if (!panel.hidden) commit();
        close();
        return;
      }
      if (event.key === ' ' && search && Date.now() - searchTime < 750) {
        event.preventDefault();
        search += ' ';
        searchTime = Date.now();
        return;
      }
      if (['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (panel.hidden) open();
        else {
          commit();
          close();
        }
        return;
      }
      if (
        ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        const closed = panel.hidden;
        if (closed) open();
        if (event.key === 'Home')
          highlight(options.findIndex((option) => !option.disabled));
        else if (event.key === 'End')
          highlight(options.findLastIndex((option) => !option.disabled));
        else if (!closed)
          move(
            event.key === 'ArrowDown'
              ? 1
              : event.key === 'ArrowUp'
                ? -1
                : event.key === 'PageDown'
                  ? Math.min(10, options.length - 1 - active)
                  : -Math.min(10, active),
          );
        return;
      }
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        if (panel.hidden) open();
        const now = Date.now();
        search = now - searchTime > 750 ? event.key : search + event.key;
        searchTime = now;
        const repeated = search === event.key.repeat(search.length);
        const prefix = (repeated ? event.key : search).toLocaleLowerCase();
        for (let step = 1; step <= options.length; step++) {
          const index = (active + step) % options.length;
          const option = options[index];
          if (
            option &&
            !option.disabled &&
            option.text.trim().toLocaleLowerCase().startsWith(prefix)
          ) {
            highlight(index);
            break;
          }
        }
      }
    });
    panel.addEventListener('pointerdown', (event) => {
      event.preventDefault();
    });
    trigger.addEventListener('blur', () => {
      if (!panel.hidden) {
        commit();
        close();
      }
    });
    // A fieldset can enable or disable a select without emitting input/change.
    const stateObserver = new MutationObserver(sync);
    stateObserver.observe(select, {
      attributes: true,
      subtree: true,
      attributeFilter: ['disabled', 'aria-invalid', 'aria-describedby'],
    });
    for (let owner = select.parentElement; owner; owner = owner.parentElement) {
      if (owner instanceof HTMLFieldSetElement)
        stateObserver.observe(owner, {
          attributes: true,
          attributeFilter: ['disabled'],
        });
    }
    select.addEventListener('change', sync);
    select.addEventListener('input', sync);
    select.addEventListener('vinasig-select-sync', sync);
    select.form?.addEventListener('reset', () => {
      close();
      // Native reset follows the event. Read the restored values in the next task.
      window.setTimeout(() => {
        active = select.selectedIndex;
        sync();
      }, 0);
    });
    document.addEventListener('vinasig-select-open', (event) => {
      if (event instanceof CustomEvent && event.detail !== select.id) close();
    });
    document.addEventListener('pointerdown', (event) => {
      if (
        event.target instanceof Node &&
        !trigger.contains(event.target) &&
        !panel.contains(event.target)
      )
        close();
    });
    document.addEventListener(
      'scroll',
      (event) => {
        if (event.target instanceof Node && panel.contains(event.target))
          return;
        if (panel.hidden) return;
        const bounds = trigger.getBoundingClientRect();
        if (bounds.bottom <= 0 || bounds.top >= innerHeight) close();
        else position();
      },
      true,
    );
    window.addEventListener('resize', close);
    sync();
  }
}

export function focusControl(element: HTMLElement): void {
  const proxy =
    element instanceof HTMLSelectElement
      ? document.getElementById(element.id + '-control')
      : null;
  (proxy ?? element).focus();
}
