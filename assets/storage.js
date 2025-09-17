const FilignsStorage = (() => {
  const STORAGE_KEY = 'filigns_center_cms_v1';

  const defaultLogo = `data:image/svg+xml;base64,${btoa(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="28" fill="#1e88e5"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="82" font-family="Poppins, Arial" fill="#fff">F</text><text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" font-size="24" font-family="Poppins, Arial" fill="#bbdefb">Center</text></svg>`)}`;

  const defaultData = {
    postSizes: [
      { id: 'insta-square', platform: 'Instagram', label: 'Square Post', width: 1080, height: 1080 },
      { id: 'insta-story', platform: 'Instagram', label: 'Story', width: 1080, height: 1920 },
      { id: 'yt-thumb', platform: 'YouTube', label: 'Thumbnail', width: 1280, height: 720 },
      { id: 'fb-cover', platform: 'Facebook', label: 'Page Cover', width: 1640, height: 924 }
    ],
    categories: [
      { id: 'cat-social', name: 'Social Media Posts', description: 'Square and story creatives for Instagram & Facebook.', postSizeIds: ['insta-square', 'insta-story'] },
      { id: 'cat-video', name: 'Video Platforms', description: 'Thumbnails for YouTube and other platforms.', postSizeIds: ['yt-thumb'] }
    ],
    templates: [
      {
        id: 'temp-fashion',
        title: 'Fashion Sale Promo',
        categoryId: 'cat-social',
        postSizeId: 'insta-square',
        description: 'Bold gradients and placeholders for store info.',
        accent: '#ff6b6b',
        fonts: ['Poppins', 'Montserrat', 'Nunito'],
        thumbnailColor: ['#ff6b6b', '#ffa36c'],
        placeholders: ['name', 'phone', 'email', 'address', 'logo'],
        htmlContent: `<div class="fc-canvas fc-square" style="--accent-color:#ff6b6b; --secondary-color:#ffe66d;">
  <div class="fc-header">
    <div class="fc-logo-wrapper">
      <img data-placeholder="logo" src="${defaultLogo}" alt="Brand Logo" class="fc-logo" />
    </div>
    <div class="fc-headline">
      <p class="fc-tag" data-editable="true">Exclusive Offer</p>
      <h1 data-placeholder="name" data-editable="true">Filigns Center</h1>
      <p data-editable="true">Bring your creative ideas to life!</p>
    </div>
  </div>
  <div class="fc-body">
    <div class="fc-sale-block">
      <span class="fc-sale-label" data-editable="true">FLAT</span>
      <span class="fc-sale-value" data-editable="true">50% OFF</span>
    </div>
    <div class="fc-contact">
      <p><span class="fc-contact-label">Call:</span> <span data-placeholder="phone" data-editable="true">+91 98765 43210</span></p>
      <p><span class="fc-contact-label">Email:</span> <span data-placeholder="email" data-editable="true">hello@filignscenter.com</span></p>
      <p><span class="fc-contact-label">Visit:</span> <span data-placeholder="address" data-editable="true">123 Creative Street, Mumbai</span></p>
    </div>
  </div>
  <div class="fc-footer" data-editable="true">
    Customize fonts, colors, and logo to match your brand instantly.
  </div>
</div>`
      },
      {
        id: 'temp-youtube',
        title: 'YouTube Episode Highlight',
        categoryId: 'cat-video',
        postSizeId: 'yt-thumb',
        description: 'Dynamic layout with bold typography for video thumbnails.',
        accent: '#673ab7',
        fonts: ['Bebas Neue', 'Poppins', 'Roboto'],
        thumbnailColor: ['#673ab7', '#9575cd'],
        placeholders: ['name', 'logo', 'tagline'],
        htmlContent: `<div class="fc-canvas fc-yt" style="--accent-color:#673ab7; --secondary-color:#ffd54f;">
  <div class="fc-yt-left">
    <div class="fc-yt-badge" data-editable="true">NEW EPISODE</div>
    <h2 data-placeholder="name" data-editable="true">Filigns Center Podcast</h2>
    <p data-placeholder="tagline" data-editable="true">Design strategies & marketing hacks</p>
    <div class="fc-yt-meta" data-editable="true">
      Streaming this Friday • Don’t miss it
    </div>
  </div>
  <div class="fc-yt-right">
    <div class="fc-yt-circle"></div>
    <img data-placeholder="logo" src="${defaultLogo}" alt="Channel Logo" class="fc-yt-logo" />
  </div>
</div>`
      }
    ],
    users: [
      { id: 'admin', name: 'Super Admin', role: 'admin', password: 'admin123' },
      {
        id: 'demo',
        name: 'Demo User',
        role: 'user',
        password: 'demo123',
        profile: {
          name: 'Filigns Center',
          email: 'hello@filignscenter.com',
          phone: '+91 98765 43210',
          address: '123 Creative Street, Mumbai',
          tagline: 'Your design partner',
          colorPrimary: '#1e88e5',
          colorSecondary: '#f9a825',
          logo: defaultLogo
        },
        savedTemplates: []
      }
    ],
    settings: {
      fonts: ['Poppins', 'Montserrat', 'Nunito', 'Inter', 'Bebas Neue', 'Roboto', 'Lato']
    }
  };

  function ensureData() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    }
  }

  function loadData() {
    ensureData();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      console.error('Failed to parse data store, resetting.', error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function updateData(updater) {
    const data = loadData();
    const cloned = structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data));
    updater(cloned);
    saveData(cloned);
    return cloned;
  }

  function generateId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  return {
    ensureData,
    loadData,
    saveData,
    updateData,
    generateId,
    defaultLogo
  };
})();
