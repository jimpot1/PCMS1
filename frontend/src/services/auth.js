const CURRENT_USER_KEY = 'pcms_current_user';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function normalizeProfile(profile = {}) {
  const fullName = profile.full_name || profile.name || profile.email || '';
  const [firstName = '', ...lastParts] = fullName.split(' ').filter(Boolean);

  return {
    id: profile.id,
    email: profile.email,
    employee_id: profile.employee_id || null,
    first_name: profile.first_name || firstName,
    middle_name: profile.middle_name || null,
    last_name: profile.last_name || lastParts.join(' '),
    full_name: fullName,
    role: profile.role || 'Employee',
    department: profile.department || null,
    status: profile.status || 'active'
  };
}

function persistCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  window.dispatchEvent(new Event('pcms:auth-changed'));
}

export function getStoredUser() {
  try {
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export async function signInWithEmail(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: null,
      error: { message: payload.message || 'Invalid email or password.' }
    };
  }

  const user = normalizeProfile(payload.user);
  persistCurrentUser(user);

  return {
    data: { user },
    error: null
  };
}

export async function signOut() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });

  persistCurrentUser(null);
  return { error: null };
}

export async function getCurrentSession() {
  if (!getStoredUser()) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    persistCurrentUser(null);
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!payload) {
    persistCurrentUser(null);
    return null;
  }

  const user = normalizeProfile(payload.user || payload);
  persistCurrentUser(user);
  return user;
}

export function onAuthStateChange(callback) {
  const handler = () => callback();
  window.addEventListener('pcms:auth-changed', handler);
  return () => window.removeEventListener('pcms:auth-changed', handler);
}

export async function getCurrentUserProfile() {
  return getCurrentSession();
}

export async function createUserProfile(profile) {
  const response = await fetch('/api/users', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(profile)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || 'Unable to create user profile.');
  }

  return payload;
}