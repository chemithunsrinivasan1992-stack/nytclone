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
  const [category, setCategory] = useState('home'); // Default to home
  const [showScroll, setShowScroll] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const MAX_ARTICLES = 200;

  // --- 1. The Core Fetcher ---
  const loadData = useCallback(async () => {
    // Stop if we hit 200, if API is exhausted, or if already loading
    if (articles.length >= MAX_ARTICLES || !hasMore || loading) return;

    setLoading(true);
    try {
      const result = await fetchArticles({ category, searchTerm, page });
      
      if (result && result.articles) {
        setArticles(prev => {
          const combined = page === 0 ? result.articles : [...prev, ...result.articles];
          
          // Hard cap at 200
          if (combined.length >= MAX_ARTICLES) {
            setHasMore(false);
            return combined.slice(0, MAX_ARTICLES);
          }
          return combined;
        });

        // Check if API has more pages
        const apiHasMore = result.hasMore && result.articles.length > 0;
        if (!apiHasMore) setHasMore(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, searchTerm]); 

  // Trigger load whenever page/category/search changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 2. Intersection Observer (Infinite Scroll) ---
  const observer = useRef();
  const lastArticleRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // If the last card appears on screen, fetch the next page
      if (entries[0].isIntersecting && hasMore && articles.length < MAX_ARTICLES) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, articles.length]);

  // --- 3. Scroll UI Logic ---
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScroll(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 4. Navigation Reseters ---
  const handleCategoryChange = (newCat, e) => {
    if (e) e.preventDefault();
    setArticles([]);    // Reset list
    setPage(0);         // Reset to first page
    setHasMore(true);   // Re-enable fetching
    setSearchTerm('');  // Clear search
    setCategory(newCat);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;
    setArticles([]);
    setPage(0);
    setHasMore(true);
    setCategory(''); 
  };

  return (
    <div className="App" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Newspaper Top Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#eee', zIndex: 9999 }}>
        <div style={{ width: `${scrollProgress}%`, height: '100%', backgroundColor: '#000', transition: 'width 0.2s' }} />
      </div>

      <header className="text-center" style={{ padding: '40px 0', borderBottom: '4px double #000' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '70px', fontWeight: 'bold', margin: 0 }}>DAY 2 DAY</h1>
        <p style={{ letterSpacing: '4px', margin: '10px 0', fontWeight: 'bold' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Main Navigation */}
      <nav className="navbar navbar-default" style={{ border: 'none', borderBottom: '1px solid #000', borderRadius: 0, marginBottom: '20px' }}>
        <div className="container">
          <ul className="nav navbar-nav" style={{ width: '100%', display: 'flex', justifyContent: 'center', fontWeight: 'bold' }}>
            {['home', 'world', 'politics', 'technology'].map(cat => (
              <li key={cat} className={category === cat ? 'active' : ''}>
                <button 
                  onClick={(e) => handleCategoryChange(cat, e)} 
                  className="btn btn-link" 
                  style={{ 
                    color: '#000', 
                    textTransform: 'uppercase', 
                    padding: '15px 25px', 
                    textDecoration: 'none', 
                    borderBottom: category === cat ? '3px solid #000' : 'none',
                    fontWeight: 'bold'
                  }}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          <div className="col-md-9" style={{ borderRight: '1px solid #eee' }}>
            <h2 style={{ fontFamily: 'Georgia', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
              {searchTerm ? `Search: ${searchTerm}` : `${category} Edition`}
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

            {loading && (
              <div className="text-center" style={{ padding: '40px' }}>
                <div className="spinner-border" role="status"></div>
                <h4>Loading more from the archives...</h4>
              </div>
            )}
            
            {!hasMore && articles.length >= MAX_ARTICLES && (
              <div className="text-center" style={{ padding: '60px', borderTop: '2px solid #000', marginTop: '30px', backgroundColor: '#fcfcfc' }}>
                <p style={{ fontFamily: 'Georgia', fontSize: '20px', fontStyle: 'italic' }}>
                  You have viewed the full 200-article limit for the {category || 'search'} section.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar Tracking */}
          <div className="col-md-3">
            <div style={{ position: 'sticky', top: '20px', padding: '15px', backgroundColor: '#fff' }}>
              <h4 style={{ fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '5px' }}>FEED PROGRESS</h4>
              <p style={{ fontSize: '16px' }}>Articles Loaded: <strong>{articles.length}</strong> / 200</p>
              <div style={{ background: '#eee', height: '12px', width: '100%', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ 
                  background: '#000', 
                  height: '100%', 
                  width: `${(articles.length / 200) * 100}%`,
                  transition: 'width 0.3s ease-in-out'
                }} />
              </div>
              <hr />
              <p className="small text-muted">Scroll down to load more stories automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {showScroll && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          style={{ 
            position: 'fixed', bottom: '30px', right: '30px', 
            borderRadius: '50%', width: '55px', height: '55px', 
            backgroundColor: '#000', color: '#fff', border: 'none', 
            fontSize: '24px', cursor: 'pointer', zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
