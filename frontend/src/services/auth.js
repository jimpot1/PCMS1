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
  if (!user) {
    clearPcmsAuthState();
    return;
  }

  const useLocalStorage =
    localStorage.getItem(CURRENT_USER_KEY) !== null ||
    sessionStorage.getItem(CURRENT_USER_KEY) === null;
  persistSessionUser(user, useLocalStorage);
}

function persistSessionUser(user, remember = false) {
  if (remember) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem(CURRENT_USER_KEY);
  } else {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  window.dispatchEvent(new Event('pcms:auth-changed'));
}

function clearPcmsAuthState() {
  localStorage.removeItem(CURRENT_USER_KEY);
  sessionStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event('pcms:auth-changed'));
}

export function getStoredUser() {
  try {
    const rawUser =
      localStorage.getItem(CURRENT_USER_KEY) ||
      sessionStorage.getItem(CURRENT_USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    localStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

function apiRoot() {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

function xsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('XSRF-TOKEN='));

  return cookie ? decodeURIComponent(cookie.substring('XSRF-TOKEN='.length)) : '';
}

async function getCsrfCookie() {
  const response = await fetch(`${apiRoot()}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Unable to initialize the security session.');
  }
}

export async function signInWithEmail(email, password, remember = false) {
  await getCsrfCookie();

  const token = xsrfToken();
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    },
    body: JSON.stringify({ email, password, remember })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: null,
      error: { message: payload.message || 'Invalid email or password.' }
    };
  }

  if (payload.requires_otp) {
    return {
      data: {
        requires_otp: true,
        user: normalizeProfile(payload.user || {}),
        masked_email: payload.masked_email || payload.user?.email || '',
        expires_in_seconds: payload.expires_in_seconds || 300,
        resend_cooldown_seconds: payload.resend_cooldown_seconds || 60,
        remember
      },
      error: null
    };
  }

  const user = normalizeProfile(payload.user);
  persistSessionUser(user, remember);

  return {
    data: { user },
    error: null
  };
}

export async function verifyOtp(userId, otp, remember = false) {
  await getCsrfCookie();

  const token = xsrfToken();
  const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    },
    body: JSON.stringify({ user_id: userId, otp, remember })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: null,
      error: { message: payload.message || 'Invalid or expired verification code.' }
    };
  }

  const user = normalizeProfile(payload.user || {});
  persistSessionUser(user, remember);

  return {
    data: { user },
    error: null
  };
}

export async function resendOtp(userId) {
  await getCsrfCookie();

  const token = xsrfToken();
  const response = await fetch(`${API_BASE_URL}/auth/otp/resend`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { 'X-XSRF-TOKEN': token } : {})
    },
    body: JSON.stringify({ user_id: userId })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      data: null,
      error: { message: payload.message || 'Unable to resend the verification code.' }
    };
  }

  return {
    data: {
      masked_email: payload.masked_email || '',
      expires_in_seconds: payload.expires_in_seconds || 300,
      resend_cooldown_seconds: payload.resend_cooldown_seconds || 60,
      message: payload.message || 'A new verification code has been sent.'
    },
    error: null
  };
}

export async function signOut() {
  const token = xsrfToken();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(token ? { 'X-XSRF-TOKEN': token } : {})
      }
    });
  } finally {
    clearPcmsAuthState();
  }

  return { error: null };
}

export async function getCurrentSession() {
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