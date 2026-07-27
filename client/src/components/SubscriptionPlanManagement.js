import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './SubscriptionPlanManagement.css';

const EMPTY_FORM = {
  slug: '',
  name: '',
  description: '',
  price: '',
  pickupsPerMonth: 2,
  includedItems: [],
  features: [],
  carryForwardAllowed: false,
  isActive: true,
};

const EMPTY_ITEM = { productId: '', description: '', quantity: 1 };

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatRupees(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

const SubscriptionPlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.listSubscriptionPlans();
      if (response.success) setPlans(response.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPlan(null);
    setSaveError(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setModalMode('edit');
    setSelectedPlan(plan);
    setSaveError(null);
    setFormData({
      slug: plan.slug,
      name: plan.name || '',
      description: plan.description || '',
      price: String(plan.price ?? ''),
      pickupsPerMonth: plan.pickupsPerMonth ?? 2,
      includedItems: (plan.includedItems || []).map((it) => ({
        productId: it.productId || '',
        description: it.description || '',
        quantity: it.quantity || 1,
      })),
      features: [...(plan.features || [])],
      carryForwardAllowed: !!plan.carryForwardAllowed,
      isActive: plan.isActive !== false,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && modalMode === 'create' && !prev.slug) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const updateItem = (idx, patch) => {
    setFormData((prev) => ({
      ...prev,
      includedItems: prev.includedItems.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  };

  const removeItem = (idx) => {
    setFormData((prev) => ({
      ...prev,
      includedItems: prev.includedItems.filter((_, i) => i !== idx),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, includedItems: [...prev.includedItems, { ...EMPTY_ITEM }] }));
  };

  const updateFeature = (idx, value) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === idx ? value : f)),
    }));
  };

  const removeFeature = (idx) => {
    setFormData((prev) => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  };

  const addFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const validate = () => {
    if (!formData.slug.trim()) return 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(formData.slug)) return 'Slug must be lowercase letters, digits, or hyphens';
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.price || Number(formData.price) < 0) return 'Price must be ≥ 0';
    if (formData.pickupsPerMonth < 1) return 'Pickups per month must be ≥ 1';
    for (const [i, item] of formData.includedItems.entries()) {
      if (!item.description.trim()) return `Included item #${i + 1}: description is required`;
      if (!item.quantity || Number(item.quantity) < 1) return `Included item #${i + 1}: quantity must be ≥ 1`;
    }
    return null;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    description: formData.description.trim(),
    price: Number(formData.price),
    pickupsPerMonth: Number(formData.pickupsPerMonth),
    includedItems: formData.includedItems.map((it) => ({
      productId: it.productId.trim() || undefined,
      description: it.description.trim(),
      quantity: Number(it.quantity),
    })),
    features: formData.features.map((f) => f.trim()).filter(Boolean),
    carryForwardAllowed: !!formData.carryForwardAllowed,
    isActive: !!formData.isActive,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    const problem = validate();
    if (problem) { setSaveError(problem); return; }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await api.createSubscriptionPlan({ slug: formData.slug.trim(), ...buildPayload() });
      } else {
        await api.updateSubscriptionPlan(selectedPlan.slug, buildPayload());
      }
      await fetchPlans();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSaveError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan) => {
    try {
      await api.updateSubscriptionPlan(plan.slug, { isActive: !plan.isActive });
      await fetchPlans();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle');
    }
  };

  return (
    <div className="plan-management">
      <div className="plan-header">
        <div>
          <h1>Monthly plans</h1>
          <p className="plan-subtitle">
            Recurring subscription plans customers can pick from `/subscriptions`. Snapshots are copied
            to each subscription at signup, so edits here won't retroactively change existing subs.
          </p>
        </div>
        <button className="plan-btn-primary" onClick={openCreateModal}>+ New plan</button>
      </div>

      {loading && <p className="plan-loading">Loading…</p>}
      {error && <p className="plan-error">{error}</p>}

      {!loading && !error && (
        <div className="plan-grid">
          {plans.map((plan) => (
            <div key={plan.slug} className={`plan-card ${plan.isActive ? '' : 'inactive'}`}>
              <div className="plan-card-head">
                <div>
                  <h3>{plan.name}</h3>
                  <p className="plan-slug">{plan.slug}</p>
                </div>
                <span className={`plan-status ${plan.isActive ? 'active' : 'inactive'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="plan-price">
                {formatRupees(plan.price)}<span>/mo</span>
              </div>
              <p className="plan-description">{plan.description || '—'}</p>
              <div className="plan-meta">
                <span>🚚 {plan.pickupsPerMonth} pickups</span>
                {plan.carryForwardAllowed && <span>🔁 Carry forward</span>}
              </div>
              {plan.includedItems?.length > 0 && (
                <ul className="plan-items">
                  {plan.includedItems.map((it, i) => (
                    <li key={i}>
                      {it.quantity} × {it.description}
                    </li>
                  ))}
                </ul>
              )}
              {plan.features?.length > 0 && (
                <ul className="plan-features">
                  {plan.features.map((f, i) => (<li key={i}>✓ {f}</li>))}
                </ul>
              )}
              <div className="plan-card-actions">
                <button className="plan-btn-link" onClick={() => openEditModal(plan)}>Edit</button>
                <button
                  className={`plan-btn-link ${plan.isActive ? 'danger' : ''}`}
                  onClick={() => handleToggleActive(plan)}
                >
                  {plan.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <p className="plan-empty">No plans yet. Create one to let customers subscribe.</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="plan-modal-backdrop" onClick={() => !saving && setShowModal(false)}>
          <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="plan-modal-header">
              <h2>{modalMode === 'create' ? 'New plan' : `Edit ${selectedPlan?.name}`}</h2>
              <button className="plan-btn-close" onClick={() => !saving && setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="plan-form">
              <div className="plan-row">
                <label>
                  Name
                  <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Family" />
                </label>
                <label>
                  Slug
                  <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    disabled={modalMode === 'edit'}
                    placeholder="family"
                  />
                </label>
              </div>

              <label>
                Description
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="One-line pitch shown to customers"
                />
              </label>

              <div className="plan-row">
                <label>
                  Price (₹ / month)
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" step="50" />
                </label>
                <label>
                  Pickups / month
                  <input type="number" name="pickupsPerMonth" value={formData.pickupsPerMonth} onChange={handleInputChange} min="1" />
                </label>
              </div>

              <div className="plan-repeater">
                <div className="plan-repeater-head">
                  <h3>Included items</h3>
                  <button type="button" className="plan-btn-link" onClick={addItem}>+ Add item</button>
                </div>
                {formData.includedItems.length === 0 && (
                  <p className="plan-repeater-empty">No included items yet.</p>
                )}
                {formData.includedItems.map((it, idx) => (
                  <div key={idx} className="plan-repeater-row">
                    <input
                      placeholder="Product ID (optional, e.g. shirt)"
                      value={it.productId}
                      onChange={(e) => updateItem(idx, { productId: e.target.value })}
                    />
                    <input
                      placeholder="Description (e.g. Shirt / T-Shirt)"
                      value={it.description}
                      onChange={(e) => updateItem(idx, { description: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      className="plan-qty-input"
                    />
                    <button type="button" className="plan-btn-link danger" onClick={() => removeItem(idx)}>×</button>
                  </div>
                ))}
              </div>

              <div className="plan-repeater">
                <div className="plan-repeater-head">
                  <h3>Marketing features</h3>
                  <button type="button" className="plan-btn-link" onClick={addFeature}>+ Add feature</button>
                </div>
                {formData.features.length === 0 && (
                  <p className="plan-repeater-empty">No features listed. Shown as bullet points on the plan card.</p>
                )}
                {formData.features.map((f, idx) => (
                  <div key={idx} className="plan-repeater-row">
                    <input
                      placeholder="e.g. Priority scheduling"
                      value={f}
                      onChange={(e) => updateFeature(idx, e.target.value)}
                    />
                    <button type="button" className="plan-btn-link danger" onClick={() => removeFeature(idx)}>×</button>
                  </div>
                ))}
              </div>

              <div className="plan-row">
                <label className="plan-checkbox">
                  <input
                    type="checkbox"
                    name="carryForwardAllowed"
                    checked={formData.carryForwardAllowed}
                    onChange={handleInputChange}
                  />
                  <span>Unused quota carries forward to next month</span>
                </label>
                <label className="plan-checkbox">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                  <span>Active</span>
                </label>
              </div>

              {saveError && <p className="plan-error">{saveError}</p>}

              <div className="plan-modal-actions">
                <button type="button" className="plan-btn-secondary" disabled={saving} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="plan-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : modalMode === 'create' ? 'Create plan' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlanManagement;
