const FilignsApp = (() => {
  const STORAGE_SESSION_KEY = 'fc_active_user';

  const state = {
    currentUserId: null,
    currentUser: null,
    data: null,
    selectedTemplate: null,
    selectedElement: null,
    activeSavedDesignId: null
  };

  const selectors = {};

  const showToast = (message) => {
    const toast = document.getElementById('toast');
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

  const getDefaultProfile = (user) => ({
    name: user?.profile?.name || user?.name || user?.id || '',
    email: user?.profile?.email || '',
    phone: user?.profile?.phone || '',
    tagline: user?.profile?.tagline || '',
    address: user?.profile?.address || '',
    colorPrimary: user?.profile?.colorPrimary || '#1e88e5',
    colorSecondary: user?.profile?.colorSecondary || '#f9a825',
    logo: user?.profile?.logo || FilignsStorage.defaultLogo
  });

  const updateColorSwatches = (profile) => {
    const primary = document.getElementById('swatchPrimary');
    const secondary = document.getElementById('swatchSecondary');
    if (primary) primary.style.background = profile.colorPrimary || '#1e88e5';
    if (secondary) secondary.style.background = profile.colorSecondary || '#f9a825';
  };

  const populateProfileForm = () => {
    const profile = getDefaultProfile(state.currentUser);
    selectors.profileName.value = profile.name;
    selectors.profileEmail.value = profile.email;
    selectors.profilePhone.value = profile.phone;
    selectors.profileTagline.value = profile.tagline;
    selectors.profileAddress.value = profile.address;
    selectors.brandPrimary.value = profile.colorPrimary || '#1e88e5';
    selectors.brandSecondary.value = profile.colorSecondary || '#f9a825';
    updateColorSwatches(profile);
  };

  const saveProfile = async (options = {}) => {
    const logoUpload = document.getElementById('logoUpload');
    let logo = state.currentUser.profile?.logo || FilignsStorage.defaultLogo;
    if (options.reset) {
      logo = FilignsStorage.defaultLogo;
    } else if (logoUpload.files && logoUpload.files[0]) {
      logo = (await readFileAsDataURL(logoUpload.files[0]).catch(() => null)) || logo;
    }

    const updatedProfile = {
      name: selectors.profileName.value.trim(),
      email: selectors.profileEmail.value.trim(),
      phone: selectors.profilePhone.value.trim(),
      tagline: selectors.profileTagline.value.trim(),
      address: selectors.profileAddress.value.trim(),
      colorPrimary: selectors.brandPrimary.value || '#1e88e5',
      colorSecondary: selectors.brandSecondary.value || '#f9a825',
      logo
    };

    state.data = FilignsStorage.updateData((data) => {
      const user = data.users.find((item) => item.id === state.currentUserId);
      if (!user) return;
      user.profile = updatedProfile;
      state.currentUser = user;
    });
    if (logoUpload) logoUpload.value = '';
    updateColorSwatches(updatedProfile);
    if (state.selectedTemplate) {
      applyProfileToCanvas(state.selectedTemplate.canvas, updatedProfile);
    }
    showToast('Profile saved.');
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    document.getElementById('appSection').classList.add('hidden');
    document.getElementById('authSection').classList.remove('hidden');
    state.currentUserId = null;
    state.currentUser = null;
    state.selectedTemplate = null;
    state.selectedElement = null;
    selectors.canvasStage.innerHTML = '<p class="muted">Select a template from the gallery to start editing.</p>';
  };

  const applyProfileToCanvas = (canvas, profile) => {
    if (!canvas) return;
    const values = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      tagline: profile.tagline
    };
    canvas.style.setProperty('--brand-primary', profile.colorPrimary || '#1e88e5');
    canvas.style.setProperty('--brand-secondary', profile.colorSecondary || '#f9a825');
    canvas.querySelectorAll('[data-placeholder]').forEach((node) => {
      const key = node.dataset.placeholder;
      if (!key) return;
      if (node.tagName.toLowerCase() === 'img') {
        node.src = profile.logo || FilignsStorage.defaultLogo;
        return;
      }
      if (values[key]) {
        node.textContent = values[key];
      }
    });
  };

  const deselectElement = () => {
    if (state.selectedElement) {
      state.selectedElement.classList.remove('selected-element');
    }
    state.selectedElement = null;
    selectors.fontFamily.disabled = true;
    selectors.fontSize.disabled = true;
    selectors.fontColor.disabled = true;
    selectors.boldBtn.disabled = true;
    selectors.italicBtn.disabled = true;
    selectors.alignmentButtons.forEach((btn) => btn.classList.remove('active'));
    selectors.imageControl.classList.add('hidden');
  };

  const selectElement = (element) => {
    if (state.selectedElement === element) return;
    if (state.selectedElement) {
      state.selectedElement.classList.remove('selected-element');
    }
    state.selectedElement = element;
    if (!element) {
      deselectElement();
      return;
    }
    element.classList.add('selected-element');

    const style = window.getComputedStyle(element);
    const fontName = style.fontFamily.split(',')[0].replace(/"/g, '').trim();
    ensureFontOption(fontName);
    selectors.fontFamily.value = fontName;
    selectors.fontSize.value = parseInt(style.fontSize, 10) || 32;
    selectors.fontSizeLabel.textContent = `${selectors.fontSize.value}px`;
    selectors.fontColor.value = rgbToHex(style.color || '#111827');
    selectors.fontFamily.disabled = false;
    selectors.fontSize.disabled = false;
    selectors.fontColor.disabled = false;
    selectors.boldBtn.disabled = false;
    selectors.italicBtn.disabled = false;

    const weight = parseInt(style.fontWeight, 10);
    selectors.boldBtn.classList.toggle('active', weight >= 600);
    selectors.italicBtn.classList.toggle('active', style.fontStyle === 'italic');

    const align = style.textAlign;
    selectors.alignmentButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.align === align);
      btn.disabled = false;
    });

    if (element.tagName.toLowerCase() === 'img') {
      selectors.imageControl.classList.remove('hidden');
      selectors.fontFamily.disabled = true;
      selectors.fontSize.disabled = true;
      selectors.fontColor.disabled = true;
      selectors.boldBtn.disabled = true;
      selectors.italicBtn.disabled = true;
      selectors.alignmentButtons.forEach((btn) => (btn.disabled = true));
    } else {
      selectors.imageControl.classList.add('hidden');
    }
  };

  const rgbToHex = (rgb) => {
    if (!rgb) return '#111827';
    if (rgb.startsWith('#')) return rgb;
    const values = rgb.match(/\d+/g);
    if (!values || values.length < 3) return '#111827';
    const [r, g, b] = values.map((val) => Number(val));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const prepareEditableElements = (canvas) => {
    deselectElement();
    const editableNodes = canvas.querySelectorAll('[data-editable], [data-placeholder]');
    editableNodes.forEach((node) => {
      if (node.tagName.toLowerCase() !== 'img') {
        node.setAttribute('contenteditable', 'true');
        node.addEventListener('focus', (event) => {
          event.stopPropagation();
          selectElement(node);
        });
        node.addEventListener('click', (event) => {
          event.stopPropagation();
          selectElement(node);
        });
      } else {
        node.addEventListener('click', (event) => {
          event.stopPropagation();
          selectElement(node);
        });
      }
    });
    canvas.addEventListener('click', () => deselectElement());
  };

  const loadTemplate = (templateId, options = {}) => {
    const template = state.data.templates.find((item) => item.id === templateId);
    if (!template) return;
    const profile = getDefaultProfile(state.currentUser);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = (options.htmlOverride || template.htmlContent || '').trim();
    const canvas = wrapper.firstElementChild;
    if (!canvas) {
      showToast('Template markup is empty.');
      return;
    }

    if (options.useProfile === false) {
      canvas.style.setProperty('--brand-primary', profile.colorPrimary || '#1e88e5');
      canvas.style.setProperty('--brand-secondary', profile.colorSecondary || '#f9a825');
    } else {
      applyProfileToCanvas(canvas, profile);
    }

    prepareEditableElements(canvas);

    selectors.canvasStage.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'canvas-wrapper';
    container.appendChild(canvas);
    selectors.canvasStage.appendChild(container);

    state.selectedTemplate = {
      template,
      canvas,
      container,
      fonts: template.fonts || [],
      savedDesignId: options.savedDesignId || null
    };
    state.activeSavedDesignId = options.savedDesignId || null;
    deselectElement();
    populateFontControl(template.fonts);
    showToast(`${template.title} loaded. Start customizing!`);
  };

  const populateFontControl = (templateFonts = []) => {
    const globalFonts = state.data.settings?.fonts || [];
    const fonts = Array.from(new Set([...templateFonts, ...globalFonts]));
    selectors.fontFamily.innerHTML = fonts
      .map((font) => `<option value="${font}">${font}</option>`)
      .join('');
    selectors.fontFamily.disabled = true;
    selectors.fontSize.disabled = true;
    selectors.fontColor.disabled = true;
    selectors.boldBtn.disabled = true;
    selectors.italicBtn.disabled = true;
    selectors.alignmentButtons.forEach((btn) => (btn.disabled = true));
  };

  const ensureFontOption = (font) => {
    if (!font) return;
    const hasOption = Array.from(selectors.fontFamily.options || []).some((option) => option.value === font);
    if (!hasOption) {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      selectors.fontFamily.appendChild(option);
    }
  };

  const renderCategoryFilters = () => {
    const container = document.getElementById('categoryFilters');
    const categories = state.data.categories;
    container.innerHTML = categories
      .map((cat) => `<div class="pill" data-filter="${cat.id}">${cat.name}</div>`)
      .join('');
  };

  const renderSizeFilter = () => {
    selectors.sizeFilter.innerHTML = '<option value="all">All post sizes</option>';
    state.data.postSizes.forEach((size) => {
      const option = document.createElement('option');
      option.value = size.id;
      option.textContent = `${size.platform} · ${size.label}`;
      selectors.sizeFilter.appendChild(option);
    });
  };

  const renderTemplates = () => {
    const list = document.getElementById('templateList');
    const filters = {
      category: selectors.currentCategoryFilter || 'all',
      size: selectors.sizeFilter.value || 'all',
      search: selectors.searchTemplate.value.trim().toLowerCase()
    };

    const categoryMap = new Map(state.data.categories.map((cat) => [cat.id, cat]));
    const sizeMap = new Map(state.data.postSizes.map((size) => [size.id, size]));

    const filtered = state.data.templates.filter((template) => {
      if (filters.category !== 'all' && template.categoryId !== filters.category) return false;
      if (filters.size !== 'all' && template.postSizeId !== filters.size) return false;
      if (filters.search && !template.title.toLowerCase().includes(filters.search)) return false;
      return true;
    });

    if (!filtered.length) {
      list.innerHTML = '<p class="muted">No templates found. Adjust filters.</p>';
      return;
    }

    list.innerHTML = filtered
      .map((template) => {
        const category = categoryMap.get(template.categoryId);
        const size = sizeMap.get(template.postSizeId);
        const gradient = template.thumbnailColor
          ? `linear-gradient(135deg, ${template.thumbnailColor[0]}, ${template.thumbnailColor[1]})`
          : `linear-gradient(135deg, ${template.accent || '#4f46e5'}, rgba(79, 70, 229, 0.32))`;
        return `
          <div class="template-card" data-template="${template.id}" style="background:${gradient};">
            <h3>${template.title}</h3>
            <p>${template.description || ''}</p>
            <span class="badge">${category ? category.name : 'Category'} · ${size ? `${size.platform} ${size.label}` : 'Size'}</span>
          </div>
        `;
      })
      .join('');
  };

  const renderSavedDesigns = () => {
    const list = document.getElementById('savedDesignsList');
    const saved = state.currentUser.savedTemplates || [];
    if (!saved.length) {
      list.innerHTML = '<p class="muted">No saved designs yet. Customize a template and save it.</p>';
      return;
    }
    const templateMap = new Map(state.data.templates.map((template) => [template.id, template]));
    list.innerHTML = saved
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .map((design) => {
        const template = templateMap.get(design.templateId);
        const title = template ? template.title : design.name;
        return `
          <div class="saved-card" data-design="${design.id}">
            <div>
              <h4>${title}</h4>
              <p class="muted">Saved on ${new Date(design.updatedAt || design.createdAt).toLocaleString()}</p>
            </div>
            <div class="control-row">
              <button type="button" class="secondary" data-action="open-design" data-design="${design.id}">Open</button>
              <button type="button" class="secondary" data-action="delete-design" data-design="${design.id}">Delete</button>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const handleSavedDesignAction = (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const designId = button.dataset.design;
    const design = (state.currentUser.savedTemplates || []).find((item) => item.id === designId);
    if (!design) return;
    if (button.dataset.action === 'open-design') {
      loadTemplate(design.templateId, { htmlOverride: design.htmlContent, useProfile: false, savedDesignId: design.id });
      showToast('Saved design loaded.');
    }
    if (button.dataset.action === 'delete-design') {
      state.data = FilignsStorage.updateData((data) => {
        const user = data.users.find((item) => item.id === state.currentUserId);
        if (!user) return;
        user.savedTemplates = (user.savedTemplates || []).filter((item) => item.id !== designId);
        state.currentUser = user;
      });
      renderSavedDesigns();
      showToast('Saved design deleted.');
    }
  };

  const bindAuth = () => {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const username = selectors.loginUser.value.trim();
      const password = selectors.loginPass.value.trim();
      const data = FilignsStorage.loadData();
      const user = data.users.find((item) => item.id === username && item.password === password && item.role === 'user');
      if (!user) {
        showToast('Invalid credentials or not a user account.');
        return;
      }
      state.currentUserId = user.id;
      state.currentUser = user;
      state.data = data;
      localStorage.setItem(STORAGE_SESSION_KEY, user.id);
      document.getElementById('authSection').classList.add('hidden');
      document.getElementById('appSection').classList.remove('hidden');
      initializeWorkspace();
      showToast(`Welcome ${user.name || user.id}!`);
    });
  };

  const initializeWorkspace = () => {
    state.data = FilignsStorage.loadData();
    state.currentUser = state.data.users.find((user) => user.id === state.currentUserId);
    populateProfileForm();
    renderCategoryFilters();
    renderSizeFilter();
    selectors.searchTemplate.value = '';
    selectors.currentCategoryFilter = 'all';
    document.getElementById('filterAll').classList.add('active');
    renderTemplates();
    renderSavedDesigns();
    populateFontControl();
  };

  const bindProfileHandlers = () => {
    selectors.saveProfileBtn.addEventListener('click', () => saveProfile());
    selectors.resetProfileBtn.addEventListener('click', async () => {
      selectors.profileName.value = state.currentUser.name || state.currentUser.id;
      selectors.profileEmail.value = '';
      selectors.profilePhone.value = '';
      selectors.profileTagline.value = '';
      selectors.profileAddress.value = '';
      selectors.brandPrimary.value = '#1e88e5';
      selectors.brandSecondary.value = '#f9a825';
      updateColorSwatches({ colorPrimary: '#1e88e5', colorSecondary: '#f9a825' });
      document.getElementById('logoUpload').value = '';
      await saveProfile({ reset: true });
      showToast('Profile reset to defaults.');
    });
    selectors.brandPrimary.addEventListener('input', () => {
      updateColorSwatches({ colorPrimary: selectors.brandPrimary.value, colorSecondary: selectors.brandSecondary.value });
      if (state.selectedTemplate) {
        state.selectedTemplate.canvas.style.setProperty('--brand-primary', selectors.brandPrimary.value);
      }
    });
    selectors.brandSecondary.addEventListener('input', () => {
      updateColorSwatches({ colorPrimary: selectors.brandPrimary.value, colorSecondary: selectors.brandSecondary.value });
      if (state.selectedTemplate) {
        state.selectedTemplate.canvas.style.setProperty('--brand-secondary', selectors.brandSecondary.value);
      }
    });
  };

  const bindTemplateFilters = () => {
    document.getElementById('categoryFilters').addEventListener('click', (event) => {
      const pill = event.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#categoryFilters .pill').forEach((node) => node.classList.remove('active'));
      document.getElementById('filterAll').classList.remove('active');
      pill.classList.add('active');
      selectors.currentCategoryFilter = pill.dataset.filter;
      renderTemplates();
    });

    document.getElementById('filterAll').addEventListener('click', () => {
      selectors.currentCategoryFilter = 'all';
      document.querySelectorAll('#categoryFilters .pill').forEach((node) => node.classList.remove('active'));
      document.getElementById('filterAll').classList.add('active');
      renderTemplates();
    });

    selectors.sizeFilter.addEventListener('change', renderTemplates);
    selectors.searchTemplate.addEventListener('input', renderTemplates);

    document.getElementById('templateList').addEventListener('click', (event) => {
      const card = event.target.closest('.template-card');
      if (!card) return;
      loadTemplate(card.dataset.template);
    });
  };

  const bindEditorControls = () => {
    selectors.fontFamily.addEventListener('change', () => {
      if (!state.selectedElement) return;
      const font = selectors.fontFamily.value;
      state.selectedElement.style.fontFamily = `'${font}', sans-serif`;
    });

    selectors.fontSize.addEventListener('input', () => {
      if (!state.selectedElement) return;
      const size = selectors.fontSize.value;
      selectors.fontSizeLabel.textContent = `${size}px`;
      state.selectedElement.style.fontSize = `${size}px`;
    });

    selectors.fontColor.addEventListener('input', () => {
      if (!state.selectedElement) return;
      state.selectedElement.style.color = selectors.fontColor.value;
    });

    selectors.boldBtn.addEventListener('click', () => {
      if (!state.selectedElement) return;
      const isActive = selectors.boldBtn.classList.toggle('active');
      state.selectedElement.style.fontWeight = isActive ? '700' : '400';
    });

    selectors.italicBtn.addEventListener('click', () => {
      if (!state.selectedElement) return;
      const isActive = selectors.italicBtn.classList.toggle('active');
      state.selectedElement.style.fontStyle = isActive ? 'italic' : 'normal';
    });

    selectors.alignmentButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!state.selectedElement) return;
        selectors.alignmentButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        state.selectedElement.style.textAlign = button.dataset.align;
      });
    });

    selectors.resetTemplateBtn.addEventListener('click', () => {
      if (!state.selectedTemplate) return;
      loadTemplate(state.selectedTemplate.template.id);
    });

    selectors.saveDraftBtn.addEventListener('click', () => {
      if (!state.selectedTemplate) {
        showToast('Select a template first.');
        return;
      }
      const htmlContent = state.selectedTemplate.container.innerHTML;
      const design = {
        id: FilignsStorage.generateId('design'),
        templateId: state.selectedTemplate.template.id,
        name: state.selectedTemplate.template.title,
        htmlContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.data = FilignsStorage.updateData((data) => {
        const user = data.users.find((item) => item.id === state.currentUserId);
        if (!user) return;
        user.savedTemplates = user.savedTemplates || [];
        user.savedTemplates.push(design);
        state.currentUser = user;
      });
      renderSavedDesigns();
      showToast('Design saved. Find it in "My saved designs".');
    });

    selectors.exportBtn.addEventListener('click', async () => {
      if (!state.selectedTemplate) {
        showToast('Select a template to export.');
        return;
      }
      const target = state.selectedTemplate.canvas;
      if (!window.html2canvas) {
        showToast('Export library not loaded.');
        return;
      }
      const canvas = await window.html2canvas(target, { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      const fileName = `${state.selectedTemplate.template.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('PNG downloaded.');
    });

    selectors.elementImageUpload.addEventListener('change', async () => {
      if (!state.selectedElement || state.selectedElement.tagName.toLowerCase() !== 'img') return;
      const file = selectors.elementImageUpload.files[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file).catch(() => null);
      if (dataUrl) {
        state.selectedElement.src = dataUrl;
        showToast('Image updated.');
      }
      selectors.elementImageUpload.value = '';
    });
  };

  const bindSavedDesigns = () => {
    document.getElementById('savedDesignsList').addEventListener('click', handleSavedDesignAction);
  };

  const restoreSession = () => {
    const userId = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!userId) return;
    const data = FilignsStorage.loadData();
    const user = data.users.find((item) => item.id === userId && item.role === 'user');
    if (!user) return;
    state.currentUserId = user.id;
    state.currentUser = user;
    state.data = data;
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    initializeWorkspace();
    showToast(`Welcome back, ${user.name || user.id}!`);
  };

  const init = () => {
    FilignsStorage.ensureData();
    selectors.loginUser = document.getElementById('loginUser');
    selectors.loginPass = document.getElementById('loginPass');
    selectors.profileName = document.getElementById('profileName');
    selectors.profileEmail = document.getElementById('profileEmail');
    selectors.profilePhone = document.getElementById('profilePhone');
    selectors.profileTagline = document.getElementById('profileTagline');
    selectors.profileAddress = document.getElementById('profileAddress');
    selectors.brandPrimary = document.getElementById('brandPrimary');
    selectors.brandSecondary = document.getElementById('brandSecondary');
    selectors.saveProfileBtn = document.getElementById('saveProfileBtn');
    selectors.resetProfileBtn = document.getElementById('resetProfileBtn');
    selectors.logoutBtn = document.getElementById('logoutBtn');
    selectors.sizeFilter = document.getElementById('sizeFilter');
    selectors.searchTemplate = document.getElementById('searchTemplate');
    selectors.canvasStage = document.getElementById('canvasStage');
    selectors.fontFamily = document.getElementById('fontFamilyControl');
    selectors.fontSize = document.getElementById('fontSizeControl');
    selectors.fontColor = document.getElementById('fontColorControl');
    selectors.fontSizeLabel = document.getElementById('fontSizeLabel');
    selectors.boldBtn = document.getElementById('boldBtn');
    selectors.italicBtn = document.getElementById('italicBtn');
    selectors.alignmentButtons = Array.from(document.querySelectorAll('[data-align]'));
    selectors.resetTemplateBtn = document.getElementById('resetTemplateBtn');
    selectors.saveDraftBtn = document.getElementById('saveDraftBtn');
    selectors.exportBtn = document.getElementById('exportBtn');
    selectors.elementImageUpload = document.getElementById('elementImageUpload');
    selectors.imageControl = document.getElementById('imageControl');
    if (selectors.imageControl) selectors.imageControl.classList.add('hidden');

    bindAuth();
    bindProfileHandlers();
    bindTemplateFilters();
    bindEditorControls();
    bindSavedDesigns();
    selectors.logoutBtn.addEventListener('click', logout);

    restoreSession();
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  FilignsApp.init();
});
