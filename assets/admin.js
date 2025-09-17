const AdminApp = (() => {
  const state = {
    admin: null,
    editingTemplateId: null,
    currentData: null
  };

  const placeholderPresets = [
    { key: 'name', label: 'Name', snippet: '<span data-placeholder="name" data-editable="true">Brand name</span>' },
    { key: 'phone', label: 'Phone', snippet: '<span data-placeholder="phone" data-editable="true">+91 90000 00000</span>' },
    { key: 'email', label: 'Email', snippet: '<span data-placeholder="email" data-editable="true">mail@brand.com</span>' },
    { key: 'address', label: 'Address', snippet: '<span data-placeholder="address" data-editable="true">Business street, city</span>' },
    { key: 'tagline', label: 'Tagline', snippet: '<span data-placeholder="tagline" data-editable="true">Creative tagline</span>' },
    { key: 'logo', label: 'Logo', snippet: `<img data-placeholder="logo" src="${FilignsStorage.defaultLogo}" alt="Brand logo" class="fc-logo" />` }
  ];

  const selectors = {};

  const lightenColor = (hex, amount = 0.2) => {
    if (!hex) return '#ffffff';
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.min(255, Math.floor(((num >> 16) & 0xff) + 255 * amount));
    const g = Math.min(255, Math.floor(((num >> 8) & 0xff) + 255 * amount));
    const b = Math.min(255, Math.floor((num & 0xff) + 255 * amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const showToast = (message) => {
    const toast = document.getElementById('adminToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  };

  const readFileAsDataURL = (file) => {
    if (!file) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const renderStats = () => {
    const { currentData } = state;
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    const statTemplates = [
      {
        label: 'Total users',
        value: currentData.users.filter((u) => u.role !== 'admin').length,
        hint: 'Active creator accounts'
      },
      {
        label: 'Templates',
        value: currentData.templates.length,
        hint: 'Published layouts ready to use'
      },
      {
        label: 'Categories',
        value: currentData.categories.length,
        hint: 'Grouped by campaign type'
      },
      {
        label: 'Post sizes',
        value: currentData.postSizes.length,
        hint: 'Platform specific dimensions'
      }
    ];

    statsGrid.innerHTML = statTemplates
      .map(
        (stat) => `
          <div class="template-card" style="cursor: default;">
            <h3>${stat.value}</h3>
            <p>${stat.label}</p>
            <span class="badge">${stat.hint}</span>
          </div>
        `
      )
      .join('');
  };

  const renderUsers = () => {
    const list = document.getElementById('userList');
    if (!list) return;
    const { currentData } = state;
    if (!currentData.users.length) {
      list.innerHTML = '<p class="muted">No users created yet.</p>';
      return;
    }

    list.innerHTML = currentData.users
      .filter((u) => u.role !== 'admin')
      .map((user) => {
        const savedCount = user.savedTemplates ? user.savedTemplates.length : 0;
        return `
          <div class="saved-card" data-user="${user.id}">
            <div>
              <h4>${user.name || user.id}</h4>
              <p class="muted">ID: <code>${user.id}</code> • Saved designs: ${savedCount}</p>
            </div>
            <div class="control-row">
              <button type="button" class="secondary" data-action="reset" data-user="${user.id}">Reset password</button>
              <button type="button" class="secondary" data-action="delete" data-user="${user.id}">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const renderSizes = () => {
    const list = document.getElementById('sizeList');
    if (!list) return;
    const { currentData } = state;
    if (!currentData.postSizes.length) {
      list.innerHTML = '<p class="muted">No custom sizes yet.</p>';
      return;
    }

    list.innerHTML = currentData.postSizes
      .map(
        (size) => `
        <div class="saved-card" data-size="${size.id}">
          <div>
            <h4>${size.platform} · ${size.label}</h4>
            <p class="muted">${size.width} × ${size.height}px</p>
          </div>
          <button type="button" class="secondary" data-action="delete-size" data-size="${size.id}">Remove</button>
        </div>
      `
      )
      .join('');

    renderCategorySizeOptions();
  };

  const renderCategorySizeOptions = () => {
    const optionsWrapper = document.getElementById('categorySizeOptions');
    if (!optionsWrapper) return;
    const { currentData } = state;
    optionsWrapper.innerHTML = currentData.postSizes
      .map(
        (size) => `
        <label style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" value="${size.id}" />
          <span>${size.platform} · ${size.label} (${size.width}×${size.height})</span>
        </label>
      `
      )
      .join('');

    populateTemplateSelectors();
  };

  const renderCategories = () => {
    const list = document.getElementById('categoryList');
    if (!list) return;
    const { currentData } = state;
    if (!currentData.categories.length) {
      list.innerHTML = '<p class="muted">No categories created yet.</p>';
      return;
    }

    const sizeMap = new Map(currentData.postSizes.map((size) => [size.id, size]));

    list.innerHTML = currentData.categories
      .map((cat) => {
        const sizeBadges = (cat.postSizeIds || [])
          .map((id) => {
            const item = sizeMap.get(id);
            if (!item) return '';
            return `<span class="badge">${item.platform} · ${item.label}</span>`;
          })
          .join(' ');
        return `
          <div class="saved-card" data-category="${cat.id}">
            <div>
              <h4>${cat.name}</h4>
              <p class="muted">${cat.description || '—'}</p>
              <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">${sizeBadges}</div>
            </div>
            <button type="button" class="secondary" data-action="delete-category" data-category="${cat.id}">Delete</button>
          </div>
        `;
      })
      .join('');

    populateTemplateSelectors();
  };

  const renderTemplatePreview = () => {
    const preview = document.getElementById('templatePreview');
    const markup = selectors.templateMarkup.value.trim();
    if (!preview) return;
    if (!markup) {
      preview.innerHTML = '<p class="muted">Preview will appear here once you add HTML markup.</p>';
      return;
    }

    preview.innerHTML = markup;
  };

  const renderTemplates = () => {
    const list = document.getElementById('templateListAdmin');
    if (!list) return;
    const { currentData } = state;
    if (!currentData.templates.length) {
      list.innerHTML = '<p class="muted">No templates yet. Create one using the builder above.</p>';
      return;
    }

    const categoryMap = new Map(currentData.categories.map((cat) => [cat.id, cat]));
    const sizeMap = new Map(currentData.postSizes.map((size) => [size.id, size]));

    list.innerHTML = currentData.templates
      .map((template) => {
        const category = categoryMap.get(template.categoryId);
        const size = sizeMap.get(template.postSizeId);
        const gradient = template.thumbnailColor
          ? `linear-gradient(135deg, ${template.thumbnailColor[0]}, ${template.thumbnailColor[1] || lightenColor(template.accent, 0.3)})`
          : `linear-gradient(135deg, ${template.accent}, ${lightenColor(template.accent, 0.25)})`;
        return `
          <div class="saved-card" data-template="${template.id}" style="background: ${gradient}; color: #fff;">
            <div>
              <h4>${template.title}</h4>
              <p class="muted" style="color: rgba(255,255,255,0.8);">${category ? category.name : 'Unassigned'} • ${
          size ? `${size.platform} · ${size.label}` : 'Size missing'
        }</p>
            </div>
            <div class="control-row">
              <button type="button" class="secondary" data-action="edit-template" data-template="${template.id}">Edit</button>
              <button type="button" class="secondary" data-action="delete-template" data-template="${template.id}">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const populateTemplateSelectors = () => {
    if (!selectors.templateCategory || !selectors.templateSize) return;
    const { currentData } = state;
    selectors.templateCategory.innerHTML = currentData.categories
      .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
      .join('');
    selectors.templateSize.innerHTML = currentData.postSizes
      .map((size) => `<option value="${size.id}">${size.platform} · ${size.label}</option>`)
      .join('');
  };

  const insertAtCursor = (textarea, text) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.slice(0, start) + text + value.slice(end);
    const newCursor = start + text.length;
    textarea.setSelectionRange(newCursor, newCursor);
    textarea.focus();
    renderTemplatePreview();
  };

  const bindPlaceholderButtons = () => {
    const container = document.getElementById('placeholderButtons');
    if (!container) return;
    container.innerHTML = placeholderPresets
      .map((preset) => `<button type="button" class="secondary" data-placeholder="${preset.key}">${preset.label}</button>`)
      .join('');

    container.addEventListener('click', (event) => {
      const target = event.target.closest('button[data-placeholder]');
      if (!target) return;
      const preset = placeholderPresets.find((item) => item.key === target.dataset.placeholder);
      if (preset) {
        insertAtCursor(selectors.templateMarkup, preset.snippet);
      }
    });
  };

  const loadSampleTemplate = () => {
    const accent = selectors.templateAccent.value || '#ff6b6b';
    const lighter = lightenColor(accent, 0.3);
    const markup = `
<div class="fc-canvas fc-square" style="--accent-color:${accent}; --secondary-color:${lighter};">
  <div class="fc-header">
    <div class="fc-logo-wrapper">
      <img data-placeholder="logo" src="${FilignsStorage.defaultLogo}" alt="Logo" class="fc-logo" />
    </div>
    <div class="fc-headline">
      <p class="fc-tag" data-editable="true">Limited Time</p>
      <h1 data-placeholder="name" data-editable="true">Brand headline</h1>
      <p data-placeholder="tagline" data-editable="true">Add an optional supporting line</p>
    </div>
  </div>
  <div class="fc-body">
    <div class="fc-sale-block">
      <span class="fc-sale-label" data-editable="true">FLAT</span>
      <span class="fc-sale-value" data-editable="true">40% OFF</span>
    </div>
    <div class="fc-contact">
      <p><span class="fc-contact-label">Call:</span> <span data-placeholder="phone" data-editable="true">+91 90000 00000</span></p>
      <p><span class="fc-contact-label">Email:</span> <span data-placeholder="email" data-editable="true">hello@brand.com</span></p>
      <p><span class="fc-contact-label">Visit:</span> <span data-placeholder="address" data-editable="true">Business street, city</span></p>
    </div>
  </div>
  <div class="fc-footer" data-editable="true">Update fonts, colors, text & logo once uploaded.</div>
</div>`;
    selectors.templateMarkup.value = markup.trim();
    selectors.templateFonts.value = 'Poppins, Montserrat, Nunito';
    renderTemplatePreview();
  };

  const collectTemplateData = () => {
    const title = selectors.templateTitle.value.trim();
    const categoryId = selectors.templateCategory.value;
    const postSizeId = selectors.templateSize.value;
    const accent = selectors.templateAccent.value || '#ff6b6b';
    const fonts = selectors.templateFonts.value
      .split(',')
      .map((font) => font.trim())
      .filter(Boolean);
    const description = selectors.templateDescription.value.trim();
    const htmlContent = selectors.templateMarkup.value.trim();
    if (!title || !categoryId || !postSizeId || !htmlContent) {
      showToast('Please fill the required template fields.');
      return null;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlContent;
    const placeholderSet = new Set();
    wrapper.querySelectorAll('[data-placeholder]').forEach((node) => {
      if (node.dataset.placeholder) {
        placeholderSet.add(node.dataset.placeholder);
      }
    });

    const template = {
      id: state.editingTemplateId || FilignsStorage.generateId('temp'),
      title,
      categoryId,
      postSizeId,
      accent,
      fonts,
      description,
      htmlContent,
      placeholders: Array.from(placeholderSet),
      thumbnailColor: [accent, lightenColor(accent, 0.25)]
    };

    return template;
  };

  const resetTemplateForm = () => {
    state.editingTemplateId = null;
    selectors.templateForm.reset();
    selectors.templateMarkup.value = '';
    selectors.templateFonts.value = '';
    selectors.templateAccent.value = '#ff6b6b';
    renderTemplatePreview();
    selectors.saveTemplateBtn.textContent = 'Save template';
  };

  const hydrateTemplateForm = (template) => {
    state.editingTemplateId = template.id;
    selectors.templateTitle.value = template.title;
    selectors.templateCategory.value = template.categoryId;
    selectors.templateSize.value = template.postSizeId;
    selectors.templateAccent.value = template.accent || '#ff6b6b';
    selectors.templateFonts.value = (template.fonts || []).join(', ');
    selectors.templateDescription.value = template.description || '';
    selectors.templateMarkup.value = template.htmlContent;
    renderTemplatePreview();
    selectors.saveTemplateBtn.textContent = 'Update template';
  };

  const attachEventHandlers = () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');

    adminLoginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = document.getElementById('adminUser').value.trim();
      const password = document.getElementById('adminPass').value.trim();
      const data = FilignsStorage.loadData();
      const admin = data.users.find((user) => user.id === username && user.password === password && user.role === 'admin');
      if (!admin) {
        showToast('Invalid admin credentials.');
        return;
      }
      state.admin = admin;
      state.currentData = data;
      localStorage.setItem('fc_admin_session', username);
      document.getElementById('adminAuth').classList.add('hidden');
      document.getElementById('adminApp').classList.remove('hidden');
      selectors.templateFonts.value = data.settings?.fonts?.join(', ') || '';
      renderAll();
      showToast(`Welcome back, ${admin.name || admin.id}!`);
    });

    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => {
        state.admin = null;
        state.currentData = null;
        localStorage.removeItem('fc_admin_session');
        document.getElementById('adminAuth').classList.remove('hidden');
        document.getElementById('adminApp').classList.add('hidden');
      });
    }

    document.getElementById('generatePassBtn').addEventListener('click', () => {
      const random = Math.random().toString(36).slice(2, 10);
      document.getElementById('newUserPass').value = random;
    });

    document.getElementById('userList').addEventListener('click', (event) => {
      const resetBtn = event.target.closest('button[data-action="reset"]');
      const deleteBtn = event.target.closest('button[data-action="delete"]');
      if (resetBtn) {
        const userId = resetBtn.dataset.user;
        const newPassword = Math.random().toString(36).slice(2, 10);
        state.currentData = FilignsStorage.updateData((data) => {
          const user = data.users.find((u) => u.id === userId);
          if (user) {
            user.password = newPassword;
          }
          state.currentData = data;
        });
        renderUsers();
        showToast(`Password reset to ${newPassword}`);
      }
      if (deleteBtn) {
        const userId = deleteBtn.dataset.user;
        state.currentData = FilignsStorage.updateData((data) => {
          data.users = data.users.filter((u) => u.id !== userId);
          state.currentData = data;
        });
        renderUsers();
        renderStats();
        showToast('User deleted.');
      }
    });

    document.getElementById('userForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const id = document.getElementById('newUserId').value.trim();
      const name = document.getElementById('newUserName').value.trim();
      const password = document.getElementById('newUserPass').value.trim();
      const email = document.getElementById('newUserEmail').value.trim();
      const phone = document.getElementById('newUserPhone').value.trim();
      const tagline = document.getElementById('newUserTagline').value.trim();
      const address = document.getElementById('newUserAddress').value.trim();
      const color1 = document.getElementById('newUserColor1').value;
      const color2 = document.getElementById('newUserColor2').value;
      const logoInput = document.getElementById('newUserLogo');

      if (!id || !password) {
        showToast('User ID and password are required.');
        return;
      }

      if (state.currentData.users.some((user) => user.id === id)) {
        showToast('User ID already exists. Choose a unique ID.');
        return;
      }

      const logo = await readFileAsDataURL(logoInput.files[0]).catch(() => null);

      state.currentData = FilignsStorage.updateData((data) => {
        data.users.push({
          id,
          name: name || id,
          role: 'user',
          password,
          profile: {
            name: name || id,
            email,
            phone,
            tagline,
            address,
            colorPrimary: color1,
            colorSecondary: color2,
            logo: logo || FilignsStorage.defaultLogo
          },
          savedTemplates: []
        });
        state.currentData = data;
      });

      event.target.reset();
      renderUsers();
      renderStats();
      showToast(`User ${id} created.`);
    });

    document.getElementById('sizeForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const platform = document.getElementById('sizePlatform').value.trim();
      const label = document.getElementById('sizeLabel').value.trim();
      const width = Number(document.getElementById('sizeWidth').value);
      const height = Number(document.getElementById('sizeHeight').value);
      if (!platform || !label || !width || !height) {
        showToast('Please fill all post size fields.');
        return;
      }
      state.currentData = FilignsStorage.updateData((data) => {
        data.postSizes.push({
          id: FilignsStorage.generateId('size'),
          platform,
          label,
          width,
          height
        });
        state.currentData = data;
      });
      event.target.reset();
      renderSizes();
      renderStats();
      showToast('Post size added.');
    });

    document.getElementById('sizeList').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="delete-size"]');
      if (!button) return;
      const id = button.dataset.size;
      state.currentData = FilignsStorage.updateData((data) => {
        data.postSizes = data.postSizes.filter((size) => size.id !== id);
        state.currentData = data;
      });
      renderSizes();
      renderCategories();
      renderTemplates();
      renderStats();
      showToast('Post size removed.');
    });

    document.getElementById('categoryForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = document.getElementById('categoryName').value.trim();
      if (!name) {
        showToast('Category name is required.');
        return;
      }
      const description = document.getElementById('categoryDescription').value.trim();
      const selectedSizeIds = Array.from(document.querySelectorAll('#categorySizeOptions input:checked')).map(
        (input) => input.value
      );
      state.currentData = FilignsStorage.updateData((data) => {
        data.categories.push({
          id: FilignsStorage.generateId('cat'),
          name,
          description,
          postSizeIds: selectedSizeIds
        });
        state.currentData = data;
      });
      event.target.reset();
      renderCategories();
      renderStats();
      showToast('Category created.');
    });

    document.getElementById('categoryList').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action="delete-category"]');
      if (!button) return;
      const id = button.dataset.category;
      state.currentData = FilignsStorage.updateData((data) => {
        data.categories = data.categories.filter((cat) => cat.id !== id);
        state.currentData = data;
      });
      renderCategories();
      renderTemplates();
      renderStats();
      showToast('Category removed.');
    });

    document.getElementById('templateForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const template = collectTemplateData();
      if (!template) return;
      state.currentData = FilignsStorage.updateData((data) => {
        const index = data.templates.findIndex((item) => item.id === template.id);
        if (index >= 0) {
          data.templates[index] = template;
        } else {
          data.templates.push(template);
        }
        state.currentData = data;
      });
      renderTemplates();
      renderStats();
      resetTemplateForm();
      showToast('Template saved.');
    });

    document.getElementById('templateListAdmin').addEventListener('click', (event) => {
      const editBtn = event.target.closest('button[data-action="edit-template"]');
      const deleteBtn = event.target.closest('button[data-action="delete-template"]');
      if (editBtn) {
        const id = editBtn.dataset.template;
        const template = state.currentData.templates.find((item) => item.id === id);
        if (template) {
          hydrateTemplateForm(template);
        }
      }
      if (deleteBtn) {
        const id = deleteBtn.dataset.template;
        state.currentData = FilignsStorage.updateData((data) => {
          data.templates = data.templates.filter((item) => item.id !== id);
          state.currentData = data;
        });
        renderTemplates();
        renderStats();
        showToast('Template deleted.');
      }
    });

    selectors.templateMarkup.addEventListener('input', renderTemplatePreview);
    selectors.templateAccent.addEventListener('input', renderTemplatePreview);
    document.getElementById('loadBaseTemplateBtn').addEventListener('click', loadSampleTemplate);
    selectors.templateCategory.addEventListener('change', () => {
      selectors.templateForm.dataset.changed = 'true';
    });
  };

  const renderAll = () => {
    state.currentData = FilignsStorage.loadData();
    renderStats();
    renderUsers();
    renderSizes();
    renderCategories();
    renderTemplates();
    renderTemplatePreview();
  };

  const restoreAdminSession = () => {
    const sessionId = localStorage.getItem('fc_admin_session');
    if (!sessionId) return;
    const data = FilignsStorage.loadData();
    const admin = data.users.find((user) => user.id === sessionId && user.role === 'admin');
    if (!admin) return;
    state.admin = admin;
    state.currentData = data;
    document.getElementById('adminAuth').classList.add('hidden');
    document.getElementById('adminApp').classList.remove('hidden');
    renderAll();
    showToast(`Welcome back, ${admin.name || admin.id}!`);
  };

  const init = () => {
    FilignsStorage.ensureData();
    selectors.templateForm = document.getElementById('templateForm');
    selectors.templateTitle = document.getElementById('templateTitle');
    selectors.templateCategory = document.getElementById('templateCategory');
    selectors.templateSize = document.getElementById('templateSize');
    selectors.templateAccent = document.getElementById('templateAccent');
    selectors.templateFonts = document.getElementById('templateFonts');
    selectors.templateDescription = document.getElementById('templateDescription');
    selectors.templateMarkup = document.getElementById('templateMarkup');
    selectors.saveTemplateBtn = document.getElementById('saveTemplateBtn');

    bindPlaceholderButtons();
    attachEventHandlers();
    restoreAdminSession();
    renderTemplatePreview();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
