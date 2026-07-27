import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './LeadManagement.css';

const TYPE_LABELS = {
  callback: 'Callback',
  pickup: 'Pickup',
  booking: 'Booking',
  b2b_quote: 'B2B Quote',
  franchise: 'Franchise',
  contact: 'Contact',
  other: 'Other',
};

const STATUS_FILTERS = ['all', 'new', 'contacted', 'converted', 'closed'];
const TYPE_FILTERS = ['all', ...Object.keys(TYPE_LABELS)];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function StatusBadge({ status }) {
  const cls =
    status === 'new' ? 'lm-badge new'
    : status === 'contacted' ? 'lm-badge contacted'
    : status === 'converted' ? 'lm-badge converted'
    : 'lm-badge closed';
  return <span className={cls}>{status}</span>;
}

const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('new');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 50 };
      if (type !== 'all') params.type = type;
      if (status !== 'all') params.status = status;
      const res = await api.listLeads(params);
      setLeads(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [type, status]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const setLeadStatus = async (lead, nextStatus) => {
    setActingId(lead._id);
    try {
      await api.updateLead(lead._id, { status: nextStatus });
      await fetchLeads();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    } finally {
      setActingId(null);
    }
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${digits}`, '_blank');
  };

  const callPhone = (phone) => {
    if (!phone) return;
    window.location.href = `tel:+${phone.replace(/\D/g, '')}`;
  };

  return (
    <div className="lm-container">
      <div className="lm-header">
        <div>
          <h1>Leads</h1>
          <p className="lm-subtitle">
            Every inquiry from the website. Track from first contact through conversion.
          </p>
        </div>
        <div className="lm-toolbar">
          <select value={type} onChange={(e) => setType(e.target.value)} className="lm-filter">
            {TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All types' : TYPE_LABELS[t] || t}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="lm-filter">
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
            ))}
          </select>
          <button className="lm-btn-refresh" onClick={fetchLeads}>↻</button>
        </div>
      </div>

      {loading && <p className="lm-loading">Loading…</p>}
      {error && <p className="lm-error">{error}</p>}

      {!loading && (
        <>
          <p className="lm-count">{total} lead{total === 1 ? '' : 's'}</p>
          <div className="lm-list">
            {leads.map((lead) => {
              const isExpanded = expanded === lead._id;
              return (
                <div key={lead._id} className={`lm-row ${lead.status}`}>
                  <div className="lm-row-summary" onClick={() => setExpanded(isExpanded ? null : lead._id)}>
                    <span className="lm-type">{TYPE_LABELS[lead.type] || lead.type}</span>
                    <div className="lm-cell">
                      <p className="lm-name">{lead.name || 'Unnamed'}</p>
                      <p className="lm-phone">+{lead.phoneNumber}{lead.email ? ` · ${lead.email}` : ''}</p>
                    </div>
                    <p className="lm-message">{lead.message || <em style={{ color: '#94a3b8' }}>No message</em>}</p>
                    <StatusBadge status={lead.status} />
                    <p className="lm-time">{formatDate(lead.createdAt)}</p>
                    <div className="lm-quick-actions">
                      <button className="lm-icon-btn" title="Call" onClick={(e) => { e.stopPropagation(); callPhone(lead.phoneNumber); }}>📞</button>
                      <button className="lm-icon-btn" title="WhatsApp" onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phoneNumber); }}>💬</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="lm-details">
                      <div className="lm-details-grid">
                        {lead.address && <Detail label="Address" value={lead.address} />}
                        {lead.city && <Detail label="City" value={lead.city} />}
                        {lead.pincode && <Detail label="Pincode" value={lead.pincode} />}
                        {lead.handledBy && <Detail label="Handled by" value={`${lead.handledBy} · ${formatDate(lead.handledAt)}`} />}
                      </div>

                      {lead.payload && Object.keys(lead.payload).length > 0 && (
                        <>
                          <h4>Form payload</h4>
                          <pre className="lm-payload">{JSON.stringify(lead.payload, null, 2)}</pre>
                        </>
                      )}

                      <div className="lm-actions">
                        {lead.status === 'new' && (
                          <button
                            disabled={actingId === lead._id}
                            className="lm-btn-primary"
                            onClick={() => setLeadStatus(lead, 'contacted')}
                          >
                            Mark contacted
                          </button>
                        )}
                        {['new', 'contacted'].includes(lead.status) && (
                          <button
                            disabled={actingId === lead._id}
                            className="lm-btn-primary"
                            onClick={() => setLeadStatus(lead, 'converted')}
                          >
                            Mark converted
                          </button>
                        )}
                        {lead.status !== 'closed' && (
                          <button
                            disabled={actingId === lead._id}
                            className="lm-btn-secondary"
                            onClick={() => setLeadStatus(lead, 'closed')}
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {leads.length === 0 && <p className="lm-empty">No leads match your filters.</p>}
          </div>
        </>
      )}
    </div>
  );
};

function Detail({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.4 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontWeight: 500, color: '#0f172a', fontSize: 13 }}>{value}</p>
    </div>
  );
}

export default LeadManagement;
