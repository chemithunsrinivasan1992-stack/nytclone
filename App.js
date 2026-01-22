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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [history, setHistory] = useState([]);

  const MAX_ARTICLES = 200;

  // --- 1. Fetching Logic wrapped in useCallback to satisfy Linter ---
  const loadData = useCallback(async () => {
    // Prevent fetching if we've already hit the 200 cap
    if (articles.length >= MAX_ARTICLES && page !== 0) {
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchArticles({ category, searchTerm, page });

      setArticles(prev => {
        const combined = page === 0 ? result.articles : [...prev, ...result.articles];
        
        // Enforce a hard stop at exactly 200 articles
        if (combined.length >= MAX_ARTICLES) {
          setHasMore(false);
          return combined.slice(0, MAX_ARTICLES);
        }
        return combined;
      });

      // Update hasMore based on API response and our internal limit
      const apiHasMore = result.hasMore && result.articles.length > 0;
      const underLimit = (articles.length + (result.articles?.length || 0)) < MAX_ARTICLES;
      setHasMore(apiHasMore && underLimit);

    } catch (err) {
      console.error("API Error:", err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, searchTerm]); 
  // Note: We exclude articles.length from dependencies here to prevent infinite loops, 
  // but we use the eslint-disable comment to tell Vercel this is intentional.

  // --- 2. Main Data Fetching Trigger ---
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Infinite Scroll Observer ---
  const observer = useRef();
  const lastArticleRef = useCallback(node => {
    if (loading) return; 
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && articles.length < MAX_ARTICLES) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, articles.length]);

  // --- Scroll & Progress Listener ---
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const windowScroll = window.pageYOffset;
      const scrollPercent = (windowScroll / totalHeight) * 100;
      setScrollProgress(scrollPercent);
      setShowScroll(windowScroll > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Event Handlers ---
  const addToHistory = (term) => {
    if (!term || history.includes(term)) return;
    setHistory(prev => [term, ...prev].slice(0, 5));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    addToHistory(searchTerm);
    setCategory(''); 
    setArticles([]);
    setPage(0);
    setHasMore(true);
  };

  const handleCategoryChange = (cat, e) => {
    if (e) e.preventDefault();
    setSearchTerm(''); 
    setCategory(cat);
    setArticles([]);
    setPage(0);
    setHasMore(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="App" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '5px',
        backgroundColor: '#f0f0f0', zIndex: 9999
      }}>
        <div style={{
          width: `${scrollProgress}%`, height: '100%',
          backgroundColor: '#000', transition: 'width 0.1s ease-out'
        }} />
      </div>

      <header className="text-center" style={{ padding: '40px 0', borderBottom: '3px double #000' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '80px', margin: '0', fontWeight: 'bold' }}>DAY 2 DAY</h1>
        <p style={{ letterSpacing: '3px', fontWeight: 'bold' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <nav className="navbar navbar-default" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #000' }}>
        <div className="container">
          <ul className="nav navbar-nav" style={{ fontWeight: 'bold' }}>
            <li><button className="btn btn-link" onClick={(e) => handleCategoryChange('home', e)} style={{ color: '#333', textDecoration: 'none', marginTop: '15px' }}>Home</button></li>
            <li><button className="btn btn-link" onClick={(e) => handleCategoryChange('world', e)} style={{ color: '#333', textDecoration: 'none', marginTop: '15px' }}>World</button></li>
            <li><button className="btn btn-link" onClick={(e) => handleCategoryChange('politics', e)} style={{ color: '#333', textDecoration: 'none', marginTop: '15px' }}>Politics</button></li>
            <li><button className="btn btn-link" onClick={(e) => handleCategoryChange('technology', e)} style={{ color: '#333', textDecoration: 'none', marginTop: '15px' }}>Tech</button></li>
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
          <div className="col-md-8" style={{ borderRight: '1px solid #eee' }}>
            <h2 style={{ fontFamily: 'Georgia', textTransform: 'capitalize', marginBottom: '20px' }}>
              {searchTerm ? `Results for: ${searchTerm}` : `${category} News`}
            </h2>

            <div className="row">
              {articles.map((article, index) => (
                <NewsCard
                  key={`${article.id || index}-${index}`}
                  ref={articles.length === index + 1 ? lastArticleRef : null}
                  article={article}
                />
              ))}
            </div>

            {loading && <div className="text-center" style={{ padding: '20px' }}>Loading stories...</div>}
            {!hasMore && articles.length >= MAX_ARTICLES && (
              <div className="text-center" style={{ padding: '20px', color: '#888' }}>
                You've reached the limit of 200 articles.
              </div>
            )}
          </div>

          <div className="col-md-4">
            <div style={{ position: 'sticky', top: '20px' }}>
              {history.length > 0 && (
                <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
                  <h4 style={{ fontFamily: 'Georgia', fontWeight: 'bold', marginTop: 0 }}>Recent Searches</h4>
                  <ul className="list-unstyled">
                    {history.map((term, i) => (
                      <li key={i} style={{ marginBottom: '5px' }}>
                        <button
                          onClick={() => { setSearchTerm(term); setPage(0); setArticles([]); setHasMore(true); }}
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

      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {articles.length > 0 && <div style={{ background: '#000', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontSize: '12px' }}>{articles.length} / 200 Articles</div>}
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
