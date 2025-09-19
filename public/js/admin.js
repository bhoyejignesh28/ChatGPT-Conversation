import {
  AuthAPI,
  UsersAPI,
  CategoriesAPI,
  SizesAPI,
  TemplatesAPI
} from './api.js';
import {
  showToast,
  formToJSON,
  setFormValues,
  renderLayers,
  uuid,
  bindColorInputs
} from './app.js';
import { drawPreview } from './canvas.js';
import { getFontLibrary, getFamilies, getWeights } from './fonts.js';

const authPanel = document.getElementById('auth-panel');
const dashboard = document.getElementById('admin-dashboard');
const templateEditor = document.getElementById('template-editor');
const tabContent = document.getElementById('tab-content');
const layersContainer = document.getElementById('layers');
const placeholderForm = document.getElementById('placeholder-form');
const templateCanvas = document.getElementById('template-canvas');

const state = {
  session: null,
  users: [],
  categories: [],
  sizes: [],
  templates: [],
  currentTemplate: null,
  activePlaceholderId: null
};

const PREVIEW_SCALE = 0.25;

async function init() {
  bindAuth();
  bindTemplateEditorActions();
  await refreshSession();
}

function bindAuth() {
  document.getElementById('seed-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(e.currentTarget);
    try {
      await AuthAPI.seed(payload);
      showToast('Admin seeded successfully.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(e.currentTarget);
    try {
      await AuthAPI.login(payload);
      showToast('Logged in!');
      await refreshSession();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await AuthAPI.logout();
      showToast('Logged out.');
      await refreshSession();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  dashboard.querySelectorAll('.tab-bar button').forEach((btn) => {
    btn.addEventListener('click', () => renderTab(btn.dataset.tab));
  });
}

async function refreshSession() {
  try {
    const me = await AuthAPI.me();
    state.session = me.user;
    document.getElementById('session-info').textContent = `${me.user.username} (${me.user.role})`;
  } catch (err) {
    state.session = null;
    document.getElementById('session-info').textContent = 'Not signed in.';
  }
  updateVisibility();
  if (state.session?.role === 'admin') {
    await Promise.all([loadUsers(), loadCategories(), loadSizes(), loadTemplates()]);
    renderTab('users');
  }
}

function updateVisibility() {
  const isAdmin = state.session?.role === 'admin';
  dashboard.hidden = !isAdmin;
  templateEditor.hidden = true;
}

async function loadUsers() {
  try {
    state.users = await UsersAPI.list();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadCategories() {
  try {
    state.categories = await CategoriesAPI.list();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadSizes() {
  try {
    state.sizes = await SizesAPI.list();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadTemplates() {
  try {
    state.templates = await TemplatesAPI.list();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderTab(tab) {
  switch (tab) {
    case 'users':
      renderUsersTab();
      break;
    case 'categories':
      renderCategoriesTab();
      break;
    case 'sizes':
      renderSizesTab();
      break;
    case 'templates':
      renderTemplatesTab();
      break;
    case 'settings':
      renderSettingsTab();
      break;
    default:
      tabContent.textContent = '';
  }
}

function renderUsersTab() {
  const container = document.createElement('div');
  const createForm = document.createElement('form');
  createForm.className = 'small-grid';
  createForm.innerHTML = `
    <div>
      <label>Email</label>
      <input name="email" type="email" required />
    </div>
    <div>
      <label>Username</label>
      <input name="username" required />
    </div>
    <div>
      <label>Password</label>
      <input name="password" type="password" required />
    </div>
    <button class="btn btn-primary" type="submit">Create User</button>
  `;
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(createForm);
    try {
      await AuthAPI.register(payload);
      showToast('User created.');
      createForm.reset();
      await loadUsers();
      renderUsersTab();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  container.appendChild(createForm);

  if (!state.users.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No users yet.';
    container.appendChild(empty);
  } else {
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Status</th>
          <th>Role</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    state.users.forEach((user) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.status}</td>
        <td>${user.role}</td>
        <td>
          <div class="toolbar">
            <button class="btn btn-outline" data-action="toggle">${
              user.status === 'active' ? 'Deactivate' : 'Activate'
            }</button>
            <button class="btn btn-outline" data-action="rename">Rename</button>
            <button class="btn btn-outline" data-action="delete">Delete</button>
          </div>
        </td>
      `;
      row.querySelector('[data-action="toggle"]').addEventListener('click', async () => {
        const next = user.status === 'active' ? 'inactive' : 'active';
        try {
          await UsersAPI.updateStatus(user.id, next);
          showToast('Status updated.');
          await loadUsers();
          renderUsersTab();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
      row.querySelector('[data-action="rename"]').addEventListener('click', async () => {
        const username = prompt('New username', user.username);
        if (!username) return;
        try {
          await UsersAPI.rename(user.id, username);
          showToast('Username updated.');
          await loadUsers();
          renderUsersTab();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
      row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm('Delete this user?')) return;
        try {
          await UsersAPI.remove(user.id);
          showToast('User removed.');
          await loadUsers();
          renderUsersTab();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
      tbody.appendChild(row);
    });
    container.appendChild(table);
  }
  tabContent.innerHTML = '';
  tabContent.appendChild(container);
}

function renderCategoriesTab() {
  const container = document.createElement('div');
  const form = document.createElement('form');
  form.className = 'toolbar';
  form.innerHTML = `
    <div style="flex:1">
      <label>Name</label>
      <input name="name" required />
    </div>
    <button class="btn btn-primary" type="submit">Add Category</button>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(form);
    try {
      await CategoriesAPI.create(payload);
      showToast('Category added.');
      form.reset();
      await loadCategories();
      renderCategoriesTab();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  container.appendChild(form);

  const list = document.createElement('div');
  list.className = 'list';
  state.categories.forEach((cat) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${cat.name}</strong>
      <div class="toolbar">
        <button class="btn btn-outline" data-action="rename">Rename</button>
        <button class="btn btn-outline" data-action="delete">Delete</button>
      </div>
    `;
    item.querySelector('[data-action="rename"]').addEventListener('click', async () => {
      const name = prompt('Category name', cat.name);
      if (!name) return;
      try {
        await CategoriesAPI.update(cat.id, { name });
        showToast('Category renamed.');
        await loadCategories();
        renderCategoriesTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      try {
        await CategoriesAPI.remove(cat.id);
        showToast('Category deleted.');
        await loadCategories();
        renderCategoriesTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    list.appendChild(item);
  });
  container.appendChild(list);
  tabContent.innerHTML = '';
  tabContent.appendChild(container);
}

function renderSizesTab() {
  const container = document.createElement('div');
  const form = document.createElement('form');
  form.className = 'small-grid';
  form.innerHTML = `
    <div>
      <label>Name</label>
      <input name="name" required />
    </div>
    <div>
      <label>Width (px)</label>
      <input name="w" type="number" required />
    </div>
    <div>
      <label>Height (px)</label>
      <input name="h" type="number" required />
    </div>
    <button class="btn btn-primary" type="submit">Add Size</button>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(form);
    payload.w = Number(payload.w);
    payload.h = Number(payload.h);
    try {
      await SizesAPI.create(payload);
      showToast('Size added.');
      form.reset();
      await loadSizes();
      renderSizesTab();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  container.appendChild(form);

  const list = document.createElement('div');
  list.className = 'list';
  state.sizes.forEach((size) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <strong>${size.name}</strong>
      <span>${size.w} × ${size.h}</span>
      <div class="toolbar">
        <button class="btn btn-outline" data-action="resize">Edit</button>
        <button class="btn btn-outline" data-action="delete">Delete</button>
      </div>
    `;
    item.querySelector('[data-action="resize"]').addEventListener('click', async () => {
      const name = prompt('Size name', size.name);
      const w = Number(prompt('Width', size.w));
      const h = Number(prompt('Height', size.h));
      if (!name || !w || !h) return;
      try {
        await SizesAPI.update(size.id, { name, w, h });
        showToast('Size updated.');
        await loadSizes();
        renderSizesTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Delete this size?')) return;
      try {
        await SizesAPI.remove(size.id);
        showToast('Size deleted.');
        await loadSizes();
        renderSizesTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    list.appendChild(item);
  });
  container.appendChild(list);
  tabContent.innerHTML = '';
  tabContent.appendChild(container);
}

function renderTemplatesTab() {
  const container = document.createElement('div');
  const form = document.createElement('form');
  form.className = 'small-grid';
  form.innerHTML = `
    <div>
      <label>Name</label>
      <input name="name" required />
    </div>
    <div>
      <label>Category</label>
      <select name="categoryId" required>${state.categories
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join('')}</select>
    </div>
    <div>
      <label>Size</label>
      <select name="sizeId" required>${state.sizes
        .map((s) => `<option value="${s.id}">${s.name} (${s.w}×${s.h})</option>`)
        .join('')}</select>
    </div>
    <div>
      <label>Base Image</label>
      <input name="base" type="file" accept="image/png,image/jpeg" required />
    </div>
    <button class="btn btn-primary" type="submit">Create Template</button>
  `;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    try {
      const payload = {
        name: data.get('name'),
        categoryId: data.get('categoryId'),
        sizeId: data.get('sizeId')
      };
      const template = await TemplatesAPI.create(payload);
      const file = data.get('base');
      if (file && file.size) {
        await TemplatesAPI.uploadBase(template.id, file);
      }
      showToast('Template created.');
      form.reset();
      await loadTemplates();
      renderTemplatesTab();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  container.appendChild(form);

  const list = document.createElement('div');
  list.className = 'list';
  state.templates.forEach((tpl) => {
    const cat = state.categories.find((c) => c.id === tpl.categoryId);
    const size = state.sizes.find((s) => s.id === tpl.sizeId);
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <strong>${tpl.name}</strong>
        <div class="muted">${cat ? cat.name : 'Uncategorized'} • ${size ? `${size.w}×${size.h}` : ''}</div>
      </div>
      <div class="toolbar">
        <button class="btn btn-outline" data-action="edit">Edit</button>
        <button class="btn btn-outline" data-action="delete">Delete</button>
      </div>
    `;
    item.querySelector('[data-action="edit"]').addEventListener('click', () => {
      openTemplateEditor(tpl.id);
    });
    item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (!confirm('Delete this template?')) return;
      try {
        await TemplatesAPI.remove(tpl.id);
        showToast('Template deleted.');
        await loadTemplates();
        renderTemplatesTab();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    list.appendChild(item);
  });
  container.appendChild(list);
  tabContent.innerHTML = '';
  tabContent.appendChild(container);
}

function renderSettingsTab() {
  const container = document.createElement('div');
  container.innerHTML = `
    <h3>Font Library</h3>
    <pre>${JSON.stringify(getFontLibrary(), null, 2)}</pre>
  `;
  tabContent.innerHTML = '';
  tabContent.appendChild(container);
}

function bindTemplateEditorActions() {
  document.getElementById('close-editor').addEventListener('click', () => {
    templateEditor.hidden = true;
    dashboard.hidden = false;
    renderTemplatesTab();
  });

  document.getElementById('add-text').addEventListener('click', () => {
    if (!state.currentTemplate) return;
    const placeholder = createDefaultPlaceholder('text');
    state.currentTemplate.placeholders.push(placeholder);
    selectPlaceholder(placeholder.id);
    updateLayers();
    refreshCanvas();
  });

  document.getElementById('add-logo').addEventListener('click', () => {
    if (!state.currentTemplate) return;
    const placeholder = createDefaultPlaceholder('logo');
    state.currentTemplate.placeholders.push(placeholder);
    selectPlaceholder(placeholder.id);
    updateLayers();
    refreshCanvas();
  });

  document.getElementById('delete-layer').addEventListener('click', () => {
    if (!state.currentTemplate || !state.activePlaceholderId) return;
    const idx = state.currentTemplate.placeholders.findIndex((p) => p.id === state.activePlaceholderId);
    if (idx >= 0) {
      state.currentTemplate.placeholders.splice(idx, 1);
      state.activePlaceholderId = null;
      placeholderForm.innerHTML = '';
      updateLayers();
      refreshCanvas();
    }
  });

  document.getElementById('save-template').addEventListener('click', async () => {
    if (!state.currentTemplate) return;
    try {
      await TemplatesAPI.update(state.currentTemplate.id, {
        placeholders: state.currentTemplate.placeholders
      });
      showToast('Template saved.');
      await loadTemplates();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  templateCanvas.addEventListener('pointerdown', onCanvasPointerDown);
}

function createDefaultPlaceholder(type) {
  return {
    id: uuid(),
    type,
    key: type === 'logo' ? 'logo' : 'name',
    x: 40,
    y: 40,
    w: 240,
    h: 80,
    fontGroup: 'sans',
    fontFamily: 'Inter',
    fontWeight: 600,
    italic: false,
    fontSize: 32,
    color: '#1a2a4a',
    textAlign: 'left'
  };
}

async function openTemplateEditor(templateId) {
  const template = state.templates.find((t) => t.id === templateId);
  if (!template) return;
  state.currentTemplate = JSON.parse(JSON.stringify(template));
  state.activePlaceholderId = null;
  dashboard.hidden = true;
  templateEditor.hidden = false;
  updateLayers();
  placeholderForm.innerHTML = '<p>Select a layer to edit.</p>';
  await refreshCanvas();
}

async function refreshCanvas() {
  if (!state.currentTemplate) return;
  const size = state.sizes.find((s) => s.id === state.currentTemplate.sizeId);
  await drawPreview(templateCanvas, state.currentTemplate, {
    scale: PREVIEW_SCALE,
    dimensions: size
  });
}

function updateLayers() {
  if (!state.currentTemplate) return;
  renderLayers(layersContainer, state.currentTemplate.placeholders, state.activePlaceholderId, (layer) => {
    selectPlaceholder(layer.id);
  });
}

function selectPlaceholder(id) {
  state.activePlaceholderId = id;
  updateLayers();
  renderPlaceholderForm();
}

function renderPlaceholderForm() {
  const placeholder = state.currentTemplate?.placeholders.find((p) => p.id === state.activePlaceholderId);
  if (!placeholder) {
    placeholderForm.innerHTML = '<p>Select a layer to edit.</p>';
    return;
  }
  const isText = placeholder.type === 'text';
  placeholderForm.innerHTML = '';
  const form = document.createElement('div');
  form.innerHTML = `
    <div class="form-row">
      <label>Field Key</label>
      <select name="key">
        <option value="name">NAME</option>
        <option value="phone">PHONE</option>
        <option value="email">EMAIL</option>
        <option value="address">ADDRESS</option>
        <option value="custom">CUSTOM</option>
        <option value="logo">LOGO</option>
      </select>
    </div>
    <div class="small-grid">
      <div class="form-row">
        <label>X</label>
        <input type="number" name="x" />
      </div>
      <div class="form-row">
        <label>Y</label>
        <input type="number" name="y" />
      </div>
      <div class="form-row">
        <label>Width</label>
        <input type="number" name="w" />
      </div>
      <div class="form-row">
        <label>Height</label>
        <input type="number" name="h" />
      </div>
    </div>
  `;
  if (isText) {
    form.innerHTML += `
      <div class="form-row">
        <label>Font Group</label>
        <select name="fontGroup"></select>
      </div>
      <div class="form-row">
        <label>Font Family</label>
        <select name="fontFamily"></select>
      </div>
      <div class="form-row">
        <label>Weight</label>
        <select name="fontWeight"></select>
      </div>
      <div class="form-row">
        <label>Font Size</label>
        <input type="number" name="fontSize" />
      </div>
      <div class="form-row">
        <label>Italic</label>
        <select name="italic">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>
      <div class="form-row">
        <label>Text Align</label>
        <select name="textAlign">
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div class="form-row">
        <label>Color</label>
        <div class="color-inputs">
          <input type="color" name="color-picker" />
          <input type="text" name="color-hex" maxlength="6" />
        </div>
      </div>
    `;
  } else {
    form.innerHTML += `
      <div class="form-row">
        <label>Scale</label>
        <input type="range" name="scale" min="0.1" max="3" step="0.05" />
      </div>
    `;
  }
  placeholderForm.appendChild(form);
  setFormValues(placeholderForm, placeholder);
  placeholderForm.querySelector('[name="key"]').value = placeholder.key;
  placeholderForm.querySelector('[name="x"]').value = placeholder.x || 0;
  placeholderForm.querySelector('[name="y"]').value = placeholder.y || 0;
  placeholderForm.querySelector('[name="w"]').value = placeholder.w || 0;
  placeholderForm.querySelector('[name="h"]').value = placeholder.h || 0;
  if (isText) {
    const groupSelect = placeholderForm.querySelector('[name="fontGroup"]');
    groupSelect.innerHTML = Object.keys(getFontLibrary())
      .map((group) => `<option value="${group}">${group.toUpperCase()}</option>`)
      .join('');
    groupSelect.value = placeholder.fontGroup;
    populateFontFamily(groupSelect, placeholder.fontFamily);
    populateFontWeights(groupSelect.value, placeholder.fontFamily, placeholder.fontWeight);
    placeholderForm.querySelector('[name="fontSize"]').value = placeholder.fontSize;
    placeholderForm.querySelector('[name="italic"]').value = placeholder.italic ? 'true' : 'false';
    placeholderForm.querySelector('[name="textAlign"]').value = placeholder.textAlign || 'left';
    const colorPicker = placeholderForm.querySelector('[name="color-picker"]');
    const colorHex = placeholderForm.querySelector('[name="color-hex"]');
    const sync = bindColorInputs(colorPicker, colorHex);
    sync(placeholder.color || '#000000');
    const applyColor = (value) => {
      placeholder.color = value;
      refreshCanvas();
    };
    colorPicker.addEventListener('input', () => applyColor(colorPicker.value));
    colorHex.addEventListener('input', () => {
      const hex = colorHex.value;
      if (hex.length === 6) applyColor(`#${hex}`);
    });
    groupSelect.addEventListener('change', () => {
      const families = getFamilies(groupSelect.value);
      const nextFamily = families[0];
      populateFontFamily(groupSelect, nextFamily);
      const weights = getWeights(groupSelect.value, nextFamily);
      const nextWeight = weights[0];
      placeholderForm.querySelector('[name="fontFamily"]').value = nextFamily;
      populateFontWeights(groupSelect.value, nextFamily, nextWeight);
      placeholderForm.querySelector('[name="fontWeight"]').value = nextWeight;
      handleFieldChange();
    });
    placeholderForm.querySelector('[name="fontFamily"]').addEventListener('change', (e) => {
      const weights = getWeights(groupSelect.value, e.target.value);
      const nextWeight = weights.includes(Number(placeholder.fontWeight)) ? Number(placeholder.fontWeight) : weights[0];
      populateFontWeights(groupSelect.value, e.target.value, nextWeight);
      placeholderForm.querySelector('[name="fontWeight"]').value = nextWeight;
      handleFieldChange();
    });
  }

  placeholderForm.querySelectorAll('input, select').forEach((el) => {
    if (el.name === 'color-picker' || el.name === 'color-hex') return;
    el.addEventListener('input', handleFieldChange);
    el.addEventListener('change', handleFieldChange);
  });

  function populateFontFamily(groupSelect, selected) {
    const familySelect = placeholderForm.querySelector('[name="fontFamily"]');
    familySelect.innerHTML = getFamilies(groupSelect.value)
      .map((family) => `<option value="${family}">${family}</option>`)
      .join('');
    familySelect.value = selected;
  }

  function populateFontWeights(group, family, selected) {
    const weightSelect = placeholderForm.querySelector('[name="fontWeight"]');
    weightSelect.innerHTML = getWeights(group, family)
      .map((w) => `<option value="${w}">${w}</option>`)
      .join('');
    weightSelect.value = selected;
  }

  function handleFieldChange() {
    const values = formToJSON(placeholderForm);
    Object.assign(placeholder, {
      key: values.key,
      x: Number(values.x),
      y: Number(values.y),
      w: Number(values.w),
      h: Number(values.h)
    });
    if (isText) {
      Object.assign(placeholder, {
        fontGroup: values.fontGroup,
        fontFamily: values.fontFamily,
        fontWeight: Number(values.fontWeight),
        fontSize: Number(values.fontSize),
        italic: values.italic === 'true',
        textAlign: values.textAlign
      });
    } else {
      placeholder.scale = Number(values.scale || 1);
    }
    refreshCanvas();
  }
}

let dragState = null;

function onCanvasPointerDown(event) {
  if (!state.currentTemplate) return;
  const rect = templateCanvas.getBoundingClientRect();
  const scaleX = templateCanvas.width / rect.width;
  const scaleY = templateCanvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX / PREVIEW_SCALE;
  const y = (event.clientY - rect.top) * scaleY / PREVIEW_SCALE;
  const placeholder = state.currentTemplate.placeholders.find((p) =>
    x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h
  );
  if (placeholder) {
    selectPlaceholder(placeholder.id);
    dragState = {
      placeholder,
      offsetX: x - placeholder.x,
      offsetY: y - placeholder.y
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }
}

function onPointerMove(event) {
  if (!dragState) return;
  const rect = templateCanvas.getBoundingClientRect();
  const scaleX = templateCanvas.width / rect.width;
  const scaleY = templateCanvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX / PREVIEW_SCALE;
  const y = (event.clientY - rect.top) * scaleY / PREVIEW_SCALE;
  dragState.placeholder.x = Math.round(x - dragState.offsetX);
  dragState.placeholder.y = Math.round(y - dragState.offsetY);
  refreshCanvas();
  renderPlaceholderForm();
}

function onPointerUp() {
  dragState = null;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
}

init();

