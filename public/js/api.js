import { apiFetch } from './app.js';

export const AuthAPI = {
  seed(payload) {
    return apiFetch('/auth/seed-admin', { method: 'POST', body: JSON.stringify(payload) });
  },
  register(payload) {
    return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  login(payload) {
    return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  logout() {
    return apiFetch('/auth/logout', { method: 'POST' });
  },
  me() {
    return apiFetch('/auth/me', { method: 'GET' });
  }
};

export const UsersAPI = {
  list() {
    return apiFetch('/users', { method: 'GET' }).then((res) => res.users || []);
  },
  updateStatus(uid, status) {
    return apiFetch(`/users/${uid}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },
  rename(uid, username) {
    return apiFetch(`/users/${uid}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ username })
    });
  },
  remove(uid) {
    return apiFetch(`/users/${uid}`, { method: 'DELETE' });
  },
  saveProfile(payload) {
    return apiFetch('/users/me/profile', { method: 'PATCH', body: JSON.stringify(payload) });
  }
};

export const CategoriesAPI = {
  list() {
    return apiFetch('/categories', { method: 'GET' });
  },
  create(payload) {
    return apiFetch('/categories', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id, payload) {
    return apiFetch(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id) {
    return apiFetch(`/categories/${id}`, { method: 'DELETE' });
  }
};

export const SizesAPI = {
  list() {
    return apiFetch('/sizes', { method: 'GET' });
  },
  create(payload) {
    return apiFetch('/sizes', { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id, payload) {
    return apiFetch(`/sizes/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id) {
    return apiFetch(`/sizes/${id}`, { method: 'DELETE' });
  }
};

export const TemplatesAPI = {
  list() {
    return apiFetch('/templates', { method: 'GET' });
  },
  create(payload) {
    return apiFetch('/templates', { method: 'POST', body: JSON.stringify(payload) });
  },
  uploadBase(id, file) {
    const body = new FormData();
    body.append('file', file);
    return apiFetch(`/templates/${id}/base`, { method: 'POST', body });
  },
  update(id, payload) {
    return apiFetch(`/templates/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  remove(id) {
    return apiFetch(`/templates/${id}`, { method: 'DELETE' });
  }
};

export const UploadsAPI = {
  uploadLogo(file) {
    const body = new FormData();
    body.append('file', file);
    return apiFetch('/uploads/logo', { method: 'POST', body });
  }
};

export const RendersAPI = {
  create(payload) {
    return apiFetch('/renders', { method: 'POST', body: JSON.stringify(payload) });
  },
  listMine() {
    return apiFetch('/renders?mine=1', { method: 'GET' });
  },
  get(id) {
    return apiFetch(`/renders/${id}`, { method: 'GET' });
  }
};

