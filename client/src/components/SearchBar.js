import React, { useRef, useEffect, useCallback, memo } from 'react';
import './SearchBar.css';

const SearchBar = memo(({ value, onChange, placeholder, isSearching, searchField, onFieldChange, onSearchClick }) => {
  const inputRef = useRef(null);
  const isTypingRef = useRef(false);

  // Only update input value when cleared externally (not while typing)
  useEffect(() => {
    if (!isTypingRef.current && inputRef.current && value === '') {
      inputRef.current.value = '';
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    isTypingRef.current = true;
    // Just notify parent - input manages its own value
    onChange(e.target.value);
    // Reset typing flag after a delay
    setTimeout(() => {
      isTypingRef.current = false;
    }, 100);
  }, [onChange]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && inputRef.current?.value.trim()) {
      onSearchClick();
    }
  }, [onSearchClick]);

  const getPlaceholder = useCallback(() => {
    const placeholders = {
      all: 'Search in all fields...',
      ticketNumber: 'Enter ticket number (e.g., 2510-253-00077)',
      customerId: 'Enter customer ID (e.g., CUST001)',
      customerName: 'Enter customer name',
      phoneNumber: 'Enter phone number (e.g., +91 98765 43210)'
    };
    return placeholders[searchField] || placeholders.all;
  }, [searchField]);

  return (
    <div className="search-bar-advanced">
      <div className="search-field-selector">
        <label htmlFor="search-field">Search by:</label>
        <select 
          id="search-field"
          value={searchField}
          onChange={(e) => onFieldChange(e.target.value)}
          className="field-select"
        >
          <option value="all">🔍 All Fields</option>
          <option value="ticketNumber">🎫 Ticket Number</option>
          <option value="customerId">👤 Customer ID</option>
          <option value="customerName">📝 Customer Name</option>
          <option value="phoneNumber">📞 Phone Number</option>
        </select>
      </div>

      <div className="search-bar-with-button">
        <div className="search-bar">
          <span className="search-icon">
            {isSearching ? (
              <span className="search-loading">⏳</span>
            ) : (
              '🔍'
            )}
          </span>
          <input
            ref={inputRef}
            type="text"
            defaultValue={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholder()}
            className="search-input"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        
        <button 
          className="search-button"
          onClick={onSearchClick}
          disabled={isSearching}
          type="button"
        >
          {isSearching ? '⏳ Searching...' : '🔍 Search'}
        </button>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;

