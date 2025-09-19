import { AuthAPI, UsersAPI, CategoriesAPI, SizesAPI, TemplatesAPI, UploadsAPI, RendersAPI } from './api.js';
import { showToast, formToJSON, renderLayers, bindColorInputs } from './app.js';
import { drawPreview, exportPNG } from './canvas.js';
import { getFamilies, getWeights } from './fonts.js';

const loginForm = document.getElementById('user-login-form');
const logoutBtn = document.getElementById('user-logout-btn');
const sessionInfo = document.getElementById('user-session-info');
const authPanel = document.getElementById('user-auth-panel');
const dashboard = document.getElementById('user-dashboard');
const templateListPanel = document.getElementById('template-list');
const editorPanel = document.getElementById('user-editor');
const profileForm = document.getElementById('profile-form');
const logoInput = document.getElementById('profile-logo');
const templatesContainer = document.getElementById('templates-container');
const filterCategory = document.getElementById('filter-category');
const filterSize = document.getElementById('filter-size');
const userCanvas = document.getElementById('user-canvas');
const userLayers = document.getElementById('user-layers');
const userLayerForm = document.getElementById('user-layer-form');

const state = {
  session: null,
  categories: [],
  sizes: [],
  templates: [],
  profile: {},
  currentTemplate: null,
  overrides: {},
  activePlaceholderId: null
};

const PREVIEW_SCALE = 0.25;

async function init() {
  bindAuth();
  bindProfile();
  bindEditor();
  await refreshSession();
}

function bindAuth() {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(loginForm);
    try {
      await AuthAPI.login(payload);
      showToast('Welcome back!');
      await refreshSession();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await AuthAPI.logout();
      showToast('Logged out.');
      await refreshSession();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function bindProfile() {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = formToJSON(profileForm);
    try {
      await UsersAPI.saveProfile(payload);
      state.profile = { ...state.profile, ...payload };
      showToast('Profile saved.');
      if (state.currentTemplate) refreshCanvas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  logoInput.addEventListener('change', async () => {
    if (!logoInput.files.length) return;
    const file = logoInput.files[0];
    try {
      const { logoUrl } = await UploadsAPI.uploadLogo(file);
      state.profile.logoUrl = logoUrl;
      await UsersAPI.saveProfile({ logoUrl });
      showToast('Logo uploaded.');
      if (state.currentTemplate) refreshCanvas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function bindEditor() {
  document.getElementById('user-close-editor').addEventListener('click', () => {
    editorPanel.hidden = true;
    templateListPanel.hidden = false;
    dashboard.hidden = false;
  });

  document.getElementById('user-export').addEventListener('click', async () => {
    if (!state.currentTemplate) return;
    try {
      const size = state.sizes.find((s) => s.id === state.currentTemplate.sizeId);
      const { blob, width, height } = await exportPNG(state.currentTemplate, {
        overrides: state.overrides,
        profile: state.profile,
        dimensions: size
      });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      const base64 = btoa(binary);
      const render = await RendersAPI.create({
        templateId: state.currentTemplate.id,
        overrides: state.overrides,
        width,
        height,
        imageBase64: base64
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.currentTemplate.name || 'render'}.png`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('PNG exported.');
      console.log('Render stored', render);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  userCanvas.addEventListener('pointerdown', onCanvasPointerDown);
}

async function refreshSession() {
  try {
    const me = await AuthAPI.me();
    state.session = me.user;
    state.profile = me.profile || {};
    sessionInfo.textContent = `${me.user.username} (${me.user.role})`;
  } catch (err) {
    state.session = null;
    state.profile = {};
    sessionInfo.textContent = 'Not signed in.';
  }
  updateVisibility();
  if (state.session) {
    await Promise.all([loadCategories(), loadSizes(), loadTemplates()]);
    populateFilters();
    renderTemplates();
    populateProfileForm();
  }
}

function updateVisibility() {
  const signedIn = Boolean(state.session);
  authPanel.hidden = signedIn;
  dashboard.hidden = !signedIn;
  templateListPanel.hidden = !signedIn;
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

function populateFilters() {
  filterCategory.innerHTML = '<option value="">All Categories</option>' +
    state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  filterSize.innerHTML = '<option value="">All Sizes</option>' +
    state.sizes.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  filterCategory.addEventListener('change', renderTemplates);
  filterSize.addEventListener('change', renderTemplates);
}

function populateProfileForm() {
  profileForm.querySelector('[name="name"]').value = state.profile.name || '';
  profileForm.querySelector('[name="phone"]').value = state.profile.phone || '';
  profileForm.querySelector('[name="email"]').value = state.profile.email || '';
  profileForm.querySelector('[name="address"]').value = state.profile.address || '';
  profileForm.querySelector('[name="custom"]').value = state.profile.custom || '';
}

function renderTemplates() {
  const categoryId = filterCategory.value;
  const sizeId = filterSize.value;
  templatesContainer.innerHTML = '';
  const templates = state.templates.filter((tpl) => {
    if (categoryId && tpl.categoryId !== categoryId) return false;
    if (sizeId && tpl.sizeId !== sizeId) return false;
    return true;
  });
  if (!templates.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No templates available.';
    templatesContainer.appendChild(empty);
    return;
  }
  templates.forEach((tpl) => {
    const size = state.sizes.find((s) => s.id === tpl.sizeId);
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div>
        <strong>${tpl.name}</strong>
        <div class="muted">${size ? `${size.w}×${size.h}` : ''}</div>
      </div>
      <button class="btn btn-outline">Open</button>
    `;
    item.querySelector('button').addEventListener('click', () => openTemplate(tpl));
    templatesContainer.appendChild(item);
  });
}

async function openTemplate(template) {
  state.currentTemplate = JSON.parse(JSON.stringify(template));
  state.overrides = {};
  state.activePlaceholderId = null;
  templateListPanel.hidden = true;
  dashboard.hidden = true;
  editorPanel.hidden = false;
  updateLayerList();
  userLayerForm.innerHTML = '<p>Select a layer to customize.</p>';
  await refreshCanvas();
}

async function refreshCanvas() {
  if (!state.currentTemplate) return;
  const size = state.sizes.find((s) => s.id === state.currentTemplate.sizeId);
  await drawPreview(userCanvas, state.currentTemplate, {
    overrides: state.overrides,
    profile: state.profile,
    dimensions: size,
    scale: PREVIEW_SCALE
  });
}

function updateLayerList() {
  if (!state.currentTemplate) return;
  renderLayers(userLayers, state.currentTemplate.placeholders, state.activePlaceholderId, (layer) => {
    selectLayer(layer.id);
  });
}

function selectLayer(id) {
  state.activePlaceholderId = id;
  updateLayerList();
  renderLayerForm();
}

function getMergedPlaceholder(placeholder) {
  const override = state.overrides[placeholder.id] || {};
  return { ...placeholder, ...override };
}

function renderLayerForm() {
  const placeholder = state.currentTemplate?.placeholders.find((p) => p.id === state.activePlaceholderId);
  if (!placeholder) {
    userLayerForm.innerHTML = '<p>Select a layer to customize.</p>';
    return;
  }
  const merged = getMergedPlaceholder(placeholder);
  const isText = placeholder.type === 'text';
  userLayerForm.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    ${isText ? '<div class="form-row"><label>Text Value</label><textarea name="value" rows="2"></textarea></div>' : ''}
    <div class="small-grid">
      <div class="form-row"><label>X</label><input type="number" name="x" /></div>
      <div class="form-row"><label>Y</label><input type="number" name="y" /></div>
      <div class="form-row"><label>Width</label><input type="number" name="w" /></div>
      <div class="form-row"><label>Height</label><input type="number" name="h" /></div>
    </div>
  `;
  if (isText) {
    wrapper.innerHTML += `
      <div class="form-row"><label>Font Group</label><select name="fontGroup"></select></div>
      <div class="form-row"><label>Font Family</label><select name="fontFamily"></select></div>
      <div class="form-row"><label>Weight</label><select name="fontWeight"></select></div>
      <div class="form-row"><label>Font Size</label><input type="number" name="fontSize" /></div>
      <div class="form-row"><label>Italic</label><select name="italic"><option value="false">No</option><option value="true">Yes</option></select></div>
      <div class="form-row"><label>Text Align</label><select name="textAlign"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
      <div class="form-row"><label>Color</label><div class="color-inputs"><input type="color" name="color-picker" /><input type="text" name="color-hex" maxlength="6" /></div></div>
    `;
  } else {
    wrapper.innerHTML += `
      <div class="form-row"><label>Scale</label><input type="range" name="scale" min="0.1" max="3" step="0.05" /></div>
    `;
  }
  userLayerForm.appendChild(wrapper);

  const values = {
    ...merged,
    value: state.overrides[placeholder.id]?.value ?? state.profile[placeholder.key] ?? merged.value ?? ''
  };
  userLayerForm.querySelector('[name="x"]').value = values.x || 0;
  userLayerForm.querySelector('[name="y"]').value = values.y || 0;
  userLayerForm.querySelector('[name="w"]').value = values.w || 0;
  userLayerForm.querySelector('[name="h"]').value = values.h || 0;
  if (isText) {
    userLayerForm.querySelector('[name="value"]').value = values.value || '';
    const groupSelect = userLayerForm.querySelector('[name="fontGroup"]');
    groupSelect.innerHTML = ['sans', 'serif', 'script']
      .map((group) => `<option value="${group}">${group.toUpperCase()}</option>`)
      .join('');
    groupSelect.value = values.fontGroup;
    populateFontFamily(groupSelect, values.fontFamily);
    populateFontWeights(groupSelect.value, values.fontFamily, values.fontWeight);
    userLayerForm.querySelector('[name="fontSize"]').value = values.fontSize;
    userLayerForm.querySelector('[name="italic"]').value = values.italic ? 'true' : 'false';
    userLayerForm.querySelector('[name="textAlign"]').value = values.textAlign || 'left';
    const colorPicker = userLayerForm.querySelector('[name="color-picker"]');
    const colorHex = userLayerForm.querySelector('[name="color-hex"]');
    const sync = bindColorInputs(colorPicker, colorHex);
    sync(values.color || '#000000');
    const applyColor = (val) => {
      ensureOverride(placeholder.id).color = val;
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
      populateFontWeights(groupSelect.value, nextFamily, weights[0]);
      userLayerForm.querySelector('[name="fontFamily"]').value = nextFamily;
      userLayerForm.querySelector('[name="fontWeight"]').value = weights[0];
      handleChange();
    });
    userLayerForm.querySelector('[name="fontFamily"]').addEventListener('change', (e) => {
      const weights = getWeights(groupSelect.value, e.target.value);
      const nextWeight = weights.includes(Number(values.fontWeight)) ? Number(values.fontWeight) : weights[0];
      populateFontWeights(groupSelect.value, e.target.value, nextWeight);
      userLayerForm.querySelector('[name="fontWeight"]').value = nextWeight;
      handleChange();
    });
  } else {
    userLayerForm.querySelector('[name="scale"]').value = values.scale || 1;
  }

  userLayerForm.querySelectorAll('input, textarea, select').forEach((el) => {
    if (['color-picker', 'color-hex'].includes(el.name)) return;
    el.addEventListener('input', handleChange);
    el.addEventListener('change', handleChange);
  });

  function populateFontFamily(groupSelect, selected) {
    const familySelect = userLayerForm.querySelector('[name="fontFamily"]');
    familySelect.innerHTML = getFamilies(groupSelect.value)
      .map((family) => `<option value="${family}">${family}</option>`)
      .join('');
    familySelect.value = selected;
  }

  function populateFontWeights(group, family, selected) {
    const weightSelect = userLayerForm.querySelector('[name="fontWeight"]');
    weightSelect.innerHTML = getWeights(group, family)
      .map((w) => `<option value="${w}">${w}</option>`)
      .join('');
    weightSelect.value = selected;
  }

  function handleChange() {
    const data = formToJSON(userLayerForm);
    const override = ensureOverride(placeholder.id);
    override.x = Number(data.x);
    override.y = Number(data.y);
    override.w = Number(data.w);
    override.h = Number(data.h);
    if (isText) {
      override.value = data.value ?? '';
      override.fontGroup = data.fontGroup;
      override.fontFamily = data.fontFamily;
      override.fontWeight = Number(data.fontWeight);
      override.fontSize = Number(data.fontSize);
      override.italic = data.italic === 'true';
      override.textAlign = data.textAlign;
    } else {
      override.scale = Number(data.scale || 1);
    }
    refreshCanvas();
  }
}

function ensureOverride(id) {
  if (!state.overrides[id]) state.overrides[id] = {};
  return state.overrides[id];
}

let dragState = null;

function onCanvasPointerDown(event) {
  if (!state.currentTemplate) return;
  const rect = userCanvas.getBoundingClientRect();
  const scaleX = userCanvas.width / rect.width;
  const scaleY = userCanvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX / PREVIEW_SCALE;
  const y = (event.clientY - rect.top) * scaleY / PREVIEW_SCALE;
  const placeholders = state.currentTemplate.placeholders.map((p) => getMergedPlaceholder(p));
  const target = placeholders.find((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
  if (target) {
    selectLayer(target.id);
    const override = ensureOverride(target.id);
    dragState = {
      id: target.id,
      offsetX: x - (override.x ?? target.x),
      offsetY: y - (override.y ?? target.y)
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }
}

function onPointerMove(event) {
  if (!dragState) return;
  const rect = userCanvas.getBoundingClientRect();
  const scaleX = userCanvas.width / rect.width;
  const scaleY = userCanvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX / PREVIEW_SCALE;
  const y = (event.clientY - rect.top) * scaleY / PREVIEW_SCALE;
  const override = ensureOverride(dragState.id);
  override.x = Math.round(x - dragState.offsetX);
  override.y = Math.round(y - dragState.offsetY);
  refreshCanvas();
  renderLayerForm();
}

function onPointerUp() {
  dragState = null;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
}

init();

