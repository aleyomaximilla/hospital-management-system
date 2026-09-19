// ============================================================
// Hospital Management System - API Client & Session Manager
// ============================================================

// Automatically connect to Node.js backend on port 5000, even if opened via VS Code Live Server (port 5500)
const API_BASE = (window.location.origin && window.location.origin.includes(':5000'))
  ? '/api'
  : 'http://localhost:5000/api';

/**
 * Get currently authenticated user object from localStorage
 */
function getCurrentUser() {
  const userJson = localStorage.getItem('hms_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

/**
 * Get JWT token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('hms_token');
}

/**
 * Check if the user is authenticated; redirect to login if not
 */
function requireAuth() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

/**
 * Log out user and clear storage
 */
function logout() {
  localStorage.removeItem('hms_token');
  localStorage.removeItem('hms_user');
  window.location.href = 'index.html';
}

/**
 * Central fetch wrapper with automatic JWT token attachment and error handling
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    // Handle unauthorized or expired session
    if (response.status === 401) {
      localStorage.removeItem('hms_token');
      localStorage.removeItem('hms_user');
      window.location.href = 'index.html';
      throw new Error('Session expired. Please log in again.');
    }

    let resData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      resData = await response.json();
    } else {
      const text = await response.text();
      resData = { message: text || `Request failed with status ${response.status}` };
    }

    if (!response.ok) {
      throw new Error(resData.message || `Request failed with status ${response.status}`);
    }

    return resData;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}

// Display notification toast/flash
function showFlash(message, type = 'success') {
  const container = document.querySelector('.content') || document.querySelector('.auth-box');
  if (!container) {
    alert(message);
    return;
  }

  // Remove existing flashes
  document.querySelectorAll('.flash').forEach(f => f.remove());

  const div = document.createElement('div');
  div.className = `flash flash-${type}`;
  div.textContent = message;
  container.insertBefore(div, container.firstChild);

  setTimeout(() => {
    div.style.transition = 'opacity 0.4s ease';
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 400);
  }, 4000);
}
