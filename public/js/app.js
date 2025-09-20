const toastHost = typeof document !== 'undefined' ? document.getElementById('toast-container') : null;

export async function apiFetch(path, options = {}) {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const opts = {
    credentials: 'include',
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    },
    ...options
  };
  if (isForm) {
    delete opts.headers['Content-Type'];
  }
  const res = await fetch(path.startsWith('/api') ? path : `/api${path}`, opts);
  const contentType = res.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await res.json();
  } else {
    payload = await res.text();
  }
  if (!res.ok) {
    const message = payload && payload.error ? payload.error : res.statusText;
    throw new Error(message || 'Request failed');
  }
  return payload;
}

export function showToast(message, type = 'info', timeout = 4000) {
  if (!toastHost) return;
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.textContent = message;
  toastHost.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, timeout);
}

export function formToJSON(form) {
  const data = new FormData(form);
  const obj = {};
  for (const [key, value] of data.entries()) {
    if (value === '') continue;
    obj[key] = value;
  }
  return obj;
}

export function setFormValues(form, values) {
  Object.entries(values || {}).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = Boolean(value);
    } else if (input.type === 'radio') {
      const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      input.value = value ?? '';
    }
  });
}

export function createOption(select, options, { placeholder } = {}) {
  select.innerHTML = '';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  options.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.label;
    select.appendChild(opt);
  });
}

export function renderLayers(container, layers, activeId, onSelect) {
  container.innerHTML = '';
  if (!layers.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No layers yet.';
    container.appendChild(empty);
    return;
  }
  layers.forEach((layer) => {
    const item = document.createElement('div');
    item.className = `layer-item ${activeId === layer.id ? 'active' : ''}`;
    item.innerHTML = `<span>${layer.key.toUpperCase()}</span><span class="badge-pill">${layer.type}</span>`;
    item.addEventListener('click', () => onSelect(layer));
    container.appendChild(item);
  });
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).toUpperCase();
}

export function bindColorInputs(colorInput, hexInput) {
  const sync = (value) => {
    colorInput.value = value;
    hexInput.value = value.replace('#', '').toUpperCase();
  };
  colorInput.addEventListener('input', () => sync(colorInput.value));
  hexInput.addEventListener('input', () => {
    const v = hexInput.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    hexInput.value = v.toUpperCase();
    if (v.length === 6) colorInput.value = `#${v}`;
  });
  return sync;
}

export function ensureLoggedIn(session, roles = []) {
  if (!session) {
    showToast('Please sign in to continue.', 'error');
    return false;
  }
  if (roles.length && !roles.includes(session.role)) {
    showToast('Insufficient permissions.', 'error');
    return false;
  }
  return true;
}

