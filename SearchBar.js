import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim()) {
      onSearch(term);
    }
  };

  return (
    <div className="container" style={{ margin: '20px auto' }}>
      <form onSubmit={handleSubmit} className="input-group">
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search for news (e.g., Election, NASA, Oscars)..." 
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          style={{ borderRadius: 0, height: '45px', border: '1px solid #000' }}
        />
        <span className="input-group-btn">
          <button className="btn btn-default" type="submit" style={{ borderRadius: 0, height: '45px', backgroundColor: '#000', color: '#fff' }}>
            SEARCH
          </button>
        </span>
      </form>
    </div>
  );
};

export default SearchBar;