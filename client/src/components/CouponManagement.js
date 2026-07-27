import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './CouponManagement.css';

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage off' },
  { value: 'flat', label: 'Flat amount off' },
  { value: 'first_order', label: 'First-order discount (percentage)' },
  { value: 'referral', label: 'Referral (percentage)' },
];

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perUserLimit: '',
  validFrom: '',
  validTo: '',
  isActive: true,
};

function isoToDateInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toNumberOrNull(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatRupees(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listCoupons();
      if (response.success) setCoupons(response.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filtered = coupons.filter((c) => {
    if (filterStatus === 'active' && !c.isActive) return false;
    if (filterStatus === 'inactive' && c.isActive) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.code.toLowerCase().includes(q) && !(c.description || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedCoupon(null);
    setSaveError(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setModalMode('edit');
    setSelectedCoupon(coupon);
    setSaveError(null);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: String(coupon.value ?? ''),
      minOrderAmount: coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : '',
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
      perUserLimit: coupon.perUserLimit != null ? String(coupon.perUserLimit) : '',
      validFrom: isoToDateInput(coupon.validFrom),
      validTo: isoToDateInput(coupon.validTo),
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const buildPayload = () => {
    const payload = {
      description: formData.description.trim(),
      type: formData.type,
      value: Number(formData.value),
      minOrderAmount: toNumberOrNull(formData.minOrderAmount) ?? 0,
      maxDiscount: toNumberOrNull(formData.maxDiscount),
      usageLimit: toNumberOrNull(formData.usageLimit),
      perUserLimit: toNumberOrNull(formData.perUserLimit),
      isActive: formData.isActive,
    };
    if (formData.validFrom) payload.validFrom = new Date(formData.validFrom).toISOString();
    if (formData.validTo) payload.validTo = new Date(formData.validTo).toISOString();
    return payload;
  };

  const validate = () => {
    if (!formData.code.trim()) return 'Code is required';
    if (!formData.value || Number(formData.value) <= 0) return 'Value must be > 0';
    if (formData.type !== 'flat' && Number(formData.value) > 100) return 'Percentage cannot exceed 100';
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    const problem = validate();
    if (problem) { setSaveError(problem); return; }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await api.createCoupon({ code: formData.code.trim().toUpperCase(), ...buildPayload() });
      } else {
        await api.updateCoupon(selectedCoupon.code, buildPayload());
      }
      await fetchCoupons();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (coupon) => {
    if (!window.confirm(`Deactivate ${coupon.code}? Customers won't be able to apply it anymore.`)) return;
    try {
      await api.deactivateCoupon(coupon.code);
      await fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to deactivate');
    }
  };

  return (
    <div className="coupon-management">
      <div className="coupon-header">
        <div>
          <h1>Coupons</h1>
          <p className="coupon-subtitle">Create and manage discount codes for customers.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>+ New coupon</button>
      </div>

      <div className="coupon-toolbar">
        <input
          type="text"
          className="coupon-search"
          placeholder="Search code or description…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="coupon-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <p className="coupon-loading">Loading…</p>}
      {error && <p className="coupon-error">{error}</p>}

      {!loading && !error && (
        <div className="coupon-table-wrap">
          <table className="coupon-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min order</th>
                <th>Max discount</th>
                <th>Usage</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.code}>
                  <td className="coupon-code">{c.code}</td>
                  <td>{TYPE_OPTIONS.find((t) => t.value === c.type)?.label || c.type}</td>
                  <td>{c.type === 'flat' ? formatRupees(c.value) : `${c.value}%`}</td>
                  <td>{formatRupees(c.minOrderAmount)}</td>
                  <td>{formatRupees(c.maxDiscount)}</td>
                  <td>{c.usageCount || 0}{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}</td>
                  <td>{formatDate(c.validTo)}</td>
                  <td>
                    <span className={`coupon-status ${c.isActive ? 'active' : 'inactive'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="coupon-actions">
                    <button className="btn-link" onClick={() => openEditModal(c)}>Edit</button>
                    {c.isActive && (
                      <button className="btn-link danger" onClick={() => handleDeactivate(c)}>Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="coupon-empty">No coupons match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="coupon-modal-backdrop" onClick={() => !saving && setShowModal(false)}>
          <div className="coupon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h2>{modalMode === 'create' ? 'New coupon' : `Edit ${selectedCoupon?.code}`}</h2>
              <button className="btn-close" onClick={() => !saving && setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="coupon-form">
              <div className="form-row">
                <label>
                  Code
                  <input
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={modalMode === 'edit'}
                    placeholder="FIRST20"
                    autoCapitalize="characters"
                  />
                </label>
                <label>
                  Type
                  <select name="type" value={formData.type} onChange={handleInputChange}>
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Description
                <input
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Shown to admins only"
                />
              </label>

              <div className="form-row">
                <label>
                  {formData.type === 'flat' ? 'Discount (₹)' : 'Discount (%)'}
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.type === 'flat' ? '10' : '1'}
                  />
                </label>
                <label>
                  Minimum order (₹)
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="50"
                  />
                </label>
                <label>
                  Max discount (₹)
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    min="0"
                    step="50"
                    placeholder="No cap"
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Total uses cap
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Unlimited"
                  />
                </label>
                <label>
                  Per-user cap
                  <input
                    type="number"
                    name="perUserLimit"
                    value={formData.perUserLimit}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Unlimited"
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Valid from
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Valid to
                  <input
                    type="date"
                    name="validTo"
                    value={formData.validTo}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                <span>Active</span>
              </label>

              {saveError && <p className="coupon-error">{saveError}</p>}

              <div className="coupon-modal-actions">
                <button type="button" className="btn-secondary" disabled={saving} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modalMode === 'create' ? 'Create coupon' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
