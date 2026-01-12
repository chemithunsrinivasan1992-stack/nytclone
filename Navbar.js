import React from 'react';

const Navbar = ({ setCategory }) => {
  const categories = ['home', 'world', 'politics', 'technology', 'science', 'health'];

  return (
    <nav className="navbar navbar-default" style={{ borderRadius: 0, backgroundColor: 'white', borderBottom: '1px solid #e2e2e2' }}>
      <div className="container">
        <div className="navbar-header">
          <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#nyt-navbar">
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
        </div>

        <div className="collapse navbar-collapse" id="nyt-navbar">
          <ul className="nav navbar-nav" style={{ display: 'flex', justifyContent: 'center', float: 'none' }}>
            {categories.map((cat) => (
              <li key={cat}>
                <a 
                  href="#" 
                  onClick={() => setCategory(cat)} 
                  style={{ textTransform: 'capitalize', color: '#000', fontWeight: 'bold' }}
                >
                  {cat}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;