import React, { useState } from 'react';
import './ProductOptionsModal.css';
import { calculateItemPrice } from '../data/productCatalog';

const ProductOptionsModal = ({ product, onAdd, onClose }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

  const handleOptionChange = (optionType, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: value
    }));
  };

  const handleAdd = () => {
    onAdd(product, selectedOptions, quantity);
  };

  const currentPrice = calculateItemPrice(product, selectedOptions);
  const totalPrice = currentPrice * quantity;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product.name}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="price-display">
            ₹{currentPrice.toFixed(2)} | VAT: (= ₹ 0.00)
          </div>

          {/* Render options */}
          {product.options && Object.entries(product.options).map(([optionType, options]) => (
            <div key={optionType} className="option-group">
              <label className="option-label">
                {optionType.charAt(0).toUpperCase() + optionType.slice(1)}
              </label>
              <div className="option-buttons">
                {options.map(option => {
                  const isSelected = selectedOptions[optionType] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleOptionChange(optionType, option.value)}
                    >
                      <span className="option-label-text">{option.label}</span>
                      {option.price > 0 && (
                        <span className="option-price">+ ₹{option.price.toFixed(2)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity selector */}
          <div className="quantity-section">
            <label className="option-label">Quantity</label>
            <div className="quantity-controls-large">
              <button 
                type="button" 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button 
                type="button" 
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary btn-lg" 
            onClick={onClose}
          >
            Discard
          </button>
          <button 
            type="button" 
            className="btn btn-success btn-lg" 
            onClick={handleAdd}
          >
            Add (₹{totalPrice.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductOptionsModal;

