import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchArticles } from './api/nytApi';
import NewsCard from './components/NewsCard';
import './App.css';

function App() {
  // --- State Management ---
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState('home');
  const [showScroll, setShowScroll] = useState(false);

  // --- Search History State ---
  const [history, setHistory] = useState([]);

  // --- Infinite Scroll Observer ---
  const observer = useRef();
  const lastArticleRef = useCallback(node => {
    if (loading) return; // Don't trigger if already fetching
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // entry[0].isIntersecting means the last card is now visible on screen
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1); // This "applies" the next page
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  // 1. Add this state at the top of your App component
  const [scrollProgress, setScrollProgress] = useState(0);

  // 2. Update your scroll useEffect
  useEffect(() => {
    const handleScroll = () => {
      // Calculate Scroll Progress
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const windowScroll = window.pageYOffset;
      const scrollPercent = (windowScroll / totalHeight) * 100;
      setScrollProgress(scrollPercent);

      // Back to top button visibility
      setShowScroll(windowScroll > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // --- Main Data Fetching ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // We pass category, searchTerm, and page to our API layer
        const result = await fetchArticles({ category, searchTerm, page });

        setArticles(prev => (page === 0 ? result.articles : [...prev, ...result.articles]));
        setHasMore(result.hasMore && result.articles.length > 0);
      } catch (err) {
        console.error("API Error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [page, category]); // Triggers whenever page or category changes

  // --- Scroll Monitoring ---
  useEffect(() => {
    const checkScrollTop = () => {
      setShowScroll(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, []);

  // --- Event Handlers ---
  const addToHistory = (term) => {
    if (!term || history.includes(term)) return;
    setHistory(prev => [term, ...prev].slice(0, 5)); // Keep last 5 searches
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    addToHistory(searchTerm);
    setCategory(''); // Clear category when searching specifically
    setArticles([]);
    setPage(0);
  };

  const handleCategoryChange = (cat, e) => {
    if (e) e.preventDefault();
    setSearchTerm(''); // Clear search when switching categories
    setCategory(cat);
    setArticles([]);
    setPage(0);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="App" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Newspaper Header */}
      {/* Progress Bar Container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '5px',
        backgroundColor: '#f0f0f0',
        zIndex: 9999
      }}>
        {/* Actual Progress Fill */}
        <div style={{
          width: `${scrollProgress}%`,
          height: '100%',
          backgroundColor: '#000', // Black to match the newspaper theme
          transition: 'width 0.1s ease-out'
        }} />
      </div>
      <header className="text-center" style={{ padding: '40px 0', borderBottom: '3px double #000' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '80px', margin: '0', fontWeight: 'bold' }}>DAY 2 DAY</h1>
        <p style={{ letterSpacing: '3px', fontWeight: 'bold' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      {/* Navigation */}
      <nav className="navbar navbar-default" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #000' }}>
        <div className="container">
          <ul className="nav navbar-nav" style={{ fontWeight: 'bold' }}>
            <li><a href="/" onClick={(e) => handleCategoryChange('home', e)}>Home</a></li>
            <li><a href="/" onClick={(e) => handleCategoryChange('world', e)}>World</a></li>
            <li><a href="/" onClick={(e) => handleCategoryChange('politics', e)}>Politics</a></li>
            <li><a href="/" onClick={(e) => handleCategoryChange('technology', e)}>Tech</a></li>
          </ul>
          <form className="navbar-form navbar-right" onSubmit={handleSearchSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="input-group-btn">
                <button className="btn btn-default" type="submit">Search</button>
              </div>
            </div>
          </form>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          {/* Main Feed */}
          <div className="col-md-8" style={{ borderRight: '1px solid #eee' }}>
            <h2 style={{ fontFamily: 'Georgia', textTransform: 'capitalize', marginBottom: '20px' }}>
              {searchTerm ? `Results for: ${searchTerm}` : `${category} News`}
            </h2>

            <div className="row">
              {articles.map((article, index) => (
                <NewsCard
                  key={`${article.id}-${index}`}
                  ref={articles.length === index + 1 ? lastArticleRef : null}
                  article={article}
                />
              ))}
            </div>

            {loading && <div className="text-center" style={{ padding: '20px' }}>Loading stories...</div>}
          </div>

          {/* Sidebar */}
          <div className="col-md-4">
            <div style={{ position: 'sticky', top: '20px' }}>

              {/* Search History Section */}
              {history.length > 0 && (
                <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                  <h4 style={{ fontFamily: 'Georgia', fontWeight: 'bold', marginTop: 0 }}>Recent Searches</h4>
                  <ul className="list-unstyled">
                    {history.map((term, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>
                        <button
                          onClick={() => { setSearchTerm(term); setPage(0); setArticles([]); }}
                          className="btn btn-link btn-xs"
                          style={{ color: '#555', padding: 0 }}
                        >
                          <i className="glyphicon glyphicon-time"></i> {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <h3 style={{ fontFamily: 'Georgia', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                TRENDING
              </h3>
              {articles.slice(0, 5).map((article, index) => (
                <div key={`side-${index}`} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <a href={article.url} target="_blank" rel="noreferrer" style={{ color: '#333', fontWeight: 'bold', textDecoration: 'none' }}>
                    {article.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating UI Elements */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {page > 0 && <div style={{ background: '#000', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '12px' }}>Page {page + 1}</div>}
        {showScroll && (
          <button onClick={scrollToTop} className="btn btn-default" style={{ borderRadius: '50%', width: '45px', height: '45px', border: '2px solid #000' }}>
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

export default App;