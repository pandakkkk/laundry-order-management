import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './SubscriptionsAdmin.css';

const STATUS_FILTERS = ['all', 'pending', 'active', 'paused', 'cancelled'];

function formatRupees(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const cls =
    status === 'active' ? 'sa-badge active'
    : status === 'paused' ? 'sa-badge paused'
    : status === 'pending' ? 'sa-badge pending'
    : 'sa-badge cancelled';
  return <span className={cls}>{status}</span>;
}

const SubscriptionsAdmin = () => {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listSubscriptions({ status, search: debouncedSearch || undefined, limit: 50 });
      setSubs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const wrapAction = async (id, action, fn) => {
    if (action === 'cancel' && !window.confirm('Cancel this subscription on the customer\'s behalf?')) return;
    setActingId(id);
    try {
      await fn();
      await fetchSubs();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action}`);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="sa-container">
      <div className="sa-header">
        <div>
          <h1>Subscriptions</h1>
          <p className="sa-subtitle">
            View and manage customer subscriptions. Pause/resume/cancel act on the customer's behalf — use for support requests.
          </p>
        </div>
        <div className="sa-toolbar">
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sa-search"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="sa-filter">
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="sa-loading">Loading…</p>}
      {error && <p className="sa-error">{error}</p>}

      {!loading && (
        <>
          <p className="sa-count">{total} subscription{total === 1 ? '' : 's'}</p>
          <div className="sa-list">
            {subs.map((sub) => {
              const customer = sub.customerId || {};
              const plan = sub.planSnapshot || {};
              const totalQuota = (sub.remainingQuota || []).reduce((n, q) => n + (q.quantity || 0), 0);
              const isExpanded = expanded === sub._id;
              return (
                <div key={sub._id} className={`sa-row ${sub.status}`}>
                  <div className="sa-row-summary" onClick={() => setExpanded(isExpanded ? null : sub._id)}>
                    <div className="sa-cell customer">
                      <p className="sa-customer-name">{customer.name || customer.phoneNumber || '—'}</p>
                      <p className="sa-customer-phone">+{customer.phoneNumber || ''} · {customer.email || 'no email'}</p>
                    </div>
                    <div className="sa-cell">
                      <p className="sa-plan-name">{plan.name}</p>
                      <p className="sa-plan-price">{formatRupees(plan.price)}/mo</p>
                    </div>
                    <StatusBadge status={sub.status} />
                    <div className="sa-cell">
                      <p className="sa-label">Next bill</p>
                      <p className="sa-value">{formatDate(sub.nextBillingDate)}</p>
                    </div>
                    <div className="sa-cell">
                      <p className="sa-label">Quota left</p>
                      <p className="sa-value">{totalQuota}</p>
                    </div>
                    <div className="sa-cell actions">
                      {sub.status === 'active' && (
                        <button
                          disabled={actingId === sub._id}
                          onClick={(e) => { e.stopPropagation(); wrapAction(sub._id, 'pause', () => api.pauseSubscriptionAsAdmin(sub._id)); }}
                          className="sa-btn-link"
                        >
                          Pause
                        </button>
                      )}
                      {sub.status === 'paused' && (
                        <button
                          disabled={actingId === sub._id}
                          onClick={(e) => { e.stopPropagation(); wrapAction(sub._id, 'resume', () => api.resumeSubscriptionAsAdmin(sub._id)); }}
                          className="sa-btn-link"
                        >
                          Resume
                        </button>
                      )}
                      {sub.status !== 'cancelled' && (
                        <button
                          disabled={actingId === sub._id}
                          onClick={(e) => { e.stopPropagation(); wrapAction(sub._id, 'cancel', () => api.cancelSubscriptionAsAdmin(sub._id)); }}
                          className="sa-btn-link danger"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="sa-details">
                      <div className="sa-details-grid">
                        <Detail label="Started" value={formatDate(sub.startedAt)} />
                        <Detail label="Current period" value={`${formatDate(sub.currentPeriodStart)} – ${formatDate(sub.currentPeriodEnd)}`} />
                        <Detail label="Last paid" value={formatDate(sub.lastPaidAt)} />
                        <Detail label="Paused until" value={formatDate(sub.pausedUntil)} />
                        <Detail label="Cancelled at" value={formatDate(sub.cancelledAt)} />
                        <Detail label="Last reminder sent" value={formatDate(sub.lastBillingReminderAt)} />
                      </div>
                      {sub.remainingQuota?.length > 0 && (
                        <div>
                          <h4>Remaining quota</h4>
                          <ul className="sa-quota">
                            {sub.remainingQuota.map((q, i) => (
                              <li key={i}>
                                <span>{q.description || q.productId}</span>
                                <strong>{q.quantity}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {subs.length === 0 && <p className="sa-empty">No subscriptions match your filters.</p>}
          </div>
        </>
      )}
    </div>
  );
};

function Detail({ label, value }) {
  return (
    <div className="sa-detail">
      <p className="sa-label">{label}</p>
      <p className="sa-value">{value}</p>
    </div>
  );
}

export default SubscriptionsAdmin;
