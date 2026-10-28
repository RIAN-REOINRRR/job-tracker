const API_URL = 'http://localhost:5000/api/applications';

export const fetchApplications = async (statusFilter = '', searchQuery = '') => {
  try {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    if (searchQuery) params.append('company', searchQuery);
    
    const res = await fetch(`${API_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Backend Connection Error:", err);
    return { success: false, message: 'Could not connect to backend server', data: { applications: [], counts: {} } };
  }
};

export const createApplication = async (data) => {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Failed to create application. Is the backend running?' };
  }
};

export const updateApplication = async (id, data) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Failed to update application.' };
  }
};

export const updateAppStatus = async (id, nextStatus) => {
  try {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nextStatus })
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Failed to update status.' };
  }
};

export const deleteApplication = async (id) => {
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Failed to delete application.' };
  }
};