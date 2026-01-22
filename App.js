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

  const MAX_ARTICLES = 200;

  // --- 1. Fetching Logic ---
  const loadData = useCallback(async () => {
    // Stop if we hit 200 or there's no more data from API
    if (articles.length >= MAX_ARTICLES || !hasMore) return;

    setLoading(true);
    try {
      // Pass category, searchTerm, and current page to the API
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

        // Determine if more fetching is possible
        const canFetchMore = result.hasMore && result.articles.length > 0;
        if (!canFetchMore) setHasMore(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 2. Infinite Scroll Observer ---
  const observer = useRef();
  const lastArticleRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // Trigger next page when the last card is visible
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
      const scrollPercent = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(scrollPercent);
      setShowScroll(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 4. Menu / Search Handlers (The "Reseters") ---
  const handleCategoryChange = (newCat, e) => {
    if (e) e.preventDefault();
    setArticles([]);    // Clear old articles
    setPage(0);         // Reset to page 1
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
    setCategory(''); // Clear category when searching
  };

  return (
    <div className="App" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Newspaper Style Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#eee', zIndex: 9999 }}>
        <div style={{ width: `${scrollProgress}%`, height: '100%', backgroundColor: '#000', transition: 'width 0.2s' }} />
      </div>

      <header className="text-center" style={{ padding: '30px 0', borderBottom: '4px double #000', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '65px', fontWeight: 'bold', margin: 0 }}>DAY 2 DAY</h1>
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', display: 'inline-block', padding: '5px 20px', margin: '10px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <nav className="navbar navbar-default" style={{ border: 'none', borderBottom: '1px solid #000', background: 'transparent' }}>
        <div className="container">
          <ul className="nav navbar-nav" style={{ display: 'flex', justifyContent: 'center', width: '100%', fontWeight: 'bold' }}>
            {['home', 'world', 'politics', 'technology'].map(cat => (
              <li key={cat} className={category === cat ? 'active' : ''}>
                <button onClick={(e) => handleCategoryChange(cat, e)} className="btn btn-link" style={{ color: '#000', textTransform: 'uppercase', padding: '15px 20px', textDecoration: category === cat ? 'underline' : 'none' }}>
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          <div className="col-md-9" style={{ borderRight: '1px solid #ddd' }}>
            <h3 style={{ fontFamily: 'Georgia', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
              {searchTerm ? `Search: ${searchTerm}` : `${category} news`}
            </h3>

            <div className="row">
              {articles.map((article, index) => (
                <NewsCard
                  key={`${article.id || index}`}
                  ref={articles.length === index + 1 ? lastArticleRef : null}
                  article={article}
                />
              ))}
            </div>

            {loading && <div className="text-center" style={{ padding: '50px' }}><h4>Loading more articles...</h4></div>}
            
            {!hasMore && articles.length >= MAX_ARTICLES && (
              <div className="text-center" style={{ padding: '40px', backgroundColor: '#f9f9f9', marginTop: '20px' }}>
                <p style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}>End of the {category} feed. You've viewed 200 articles.</p>
              </div>
            )}
          </div>

          <div className="col-md-3">
            <div style={{ position: 'sticky', top: '20px' }}>
              <h4 style={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>STATUS</h4>
              <p>Loaded: <strong>{articles.length}</strong> / 200</p>
              <progress value={articles.length} max="200" style={{ width: '100%' }}></progress>
            </div>
          </div>
        </div>
      </div>

      {showScroll && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                style={{ position: 'fixed', bottom: '30px', right: '30px', borderRadius: '50%', width: '50px', height: '50px', backgroundColor: '#000', color: '#fff', border: 'none', fontSize: '20px', cursor: 'pointer', zIndex: 1000 }}>
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
