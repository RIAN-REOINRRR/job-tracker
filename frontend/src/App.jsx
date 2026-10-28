import React, { useState, useEffect } from 'react';
import { fetchApplications, createApplication, updateApplication, updateAppStatus, deleteApplication } from './api';

const statusWorkflow = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Accepted: [],
  Declined: [],
  Rejected: []
};

export default function App() {
  const [apps, setApps] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    company: '', jobRole: '', jobType: 'Full-time', appliedDate: todayStr, expectedSalary: '', notes: ''
  });

  const loadApps = async () => {
    const res = await fetchApplications(filterStatus, search);
    if (res.success) {
      setApps(res.data.applications);
      setCounts(res.data.counts);
    }
  };

  useEffect(() => { loadApps(); }, [search, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    let res;
    if (formData._id) {
      res = await updateApplication(formData._id, formData);
    } else {
      res = await createApplication(formData);
    }

    if (res.success) {
      setFormData({ company: '', jobRole: '', jobType: 'Full-time', appliedDate: todayStr, expectedSalary: '', notes: '' });
      loadApps();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    const res = await updateAppStatus(id, nextStatus);
    if (res.success) loadApps();
    else alert(res.message);
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Are you sure you want to delete application ${app.applicationId}?`)) return;
    const res = await deleteApplication(app._id);
    if (res.success) loadApps();
    else alert(res.message);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: 'auto' }}>
      <h1>Job Application Tracker</h1>

      {/* Counts Header */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([st, count]) => (
          <div key={st} style={{ border: '1px solid #ccc', padding: '10px 15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
            <strong>{st}:</strong> {count}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>{formData._id ? 'Edit Application' : 'Add New Application'}</h3>
        {errorMsg && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Company Name" required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
          <input placeholder="Job Role" required value={formData.jobRole} onChange={e => setFormData({ ...formData, jobRole: e.target.value })} />
          <select value={formData.jobType} onChange={e => setFormData({ ...formData, jobType: e.target.value })}>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <input type="date" max={todayStr} disabled={!!formData._id} required value={formData.appliedDate ? formData.appliedDate.split('T')[0] : ''} onChange={e => setFormData({ ...formData, appliedDate: e.target.value })} />
          <input type="number" placeholder="Expected Salary (Optional)" value={formData.expectedSalary} onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })} />
          <input placeholder="Notes (Optional)" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          {formData._id ? 'Update' : 'Add Application'}
        </button>
        {formData._id && <button type="button" onClick={() => setFormData({ company: '', jobRole: '', jobType: 'Full-time', appliedDate: todayStr, expectedSalary: '', notes: '' })} style={{ marginLeft: '10px' }}>Cancel</button>}
      </form>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input placeholder="Search by Company" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '8px', width: '250px' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px' }}>
          <option value="">All Statuses</option>
          {['Applied', 'Interview', 'Offer', 'Accepted', 'Declined', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Applications List */}
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>ID</th><th>Company</th><th>Role</th><th>Status</th><th>Applied Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apps.map(app => (
            <tr key={app._id}>
              <td><strong>{app.applicationId}</strong></td>
              <td>{app.company}</td>
              <td>{app.jobRole} ({app.jobType})</td>
              <td>
                <span style={{ padding: '4px 8px', borderRadius: '4px', background: app.status === 'Accepted' ? '#d4edda' : app.status === 'Rejected' ? '#f8d7da' : '#e2e3e5' }}>
                  {app.status}
                </span>
                {app.isOverdue && <span style={{ marginLeft: '5px', padding: '2px 6px', background: 'red', color: 'white', fontSize: '12px', borderRadius: '3px' }}>Follow-up Overdue</span>}
              </td>
              <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
              <td>
                {/* Workflow Dropdown */}
                {statusWorkflow[app.status]?.length > 0 && (
                  <select onChange={e => { if (e.target.value) handleStatusChange(app._id, e.target.value); }} defaultValue="">
                    <option value="" disabled>Change Status</option>
                    {statusWorkflow[app.status].map(next => <option key={next} value={next}>{next}</option>)}
                  </select>
                )}

                <button onClick={() => setFormData(app)} style={{ marginLeft: '5px' }}>Edit</button>
                <button onClick={() => setSelectedApp(app)} style={{ marginLeft: '5px' }}>History</button>
                <button 
                  onClick={() => handleDelete(app)} 
                  disabled={['Interview', 'Offer'].includes(app.status)}
                  style={{ marginLeft: '5px', color: ['Interview', 'Offer'].includes(app.status) ? '#ccc' : 'red' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* History Timeline Modal */}
      {selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
            <h3>Status History ({selectedApp.applicationId})</h3>
            <ul>
              {selectedApp.statusHistory.map((h, i) => (
                <li key={i}><strong>{h.status}</strong> - {new Date(h.changedAt).toLocaleString()}</li>
              ))}
            </ul>
            <button onClick={() => setSelectedApp(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}