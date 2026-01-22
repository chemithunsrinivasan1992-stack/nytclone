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

  // --- 1. Fetching Logic (Stabilized for Build) ---
  const loadData = useCallback(async () => {
    // Stop if we hit 200, if already loading, or if API exhausted
    if (articles.length >= MAX_ARTICLES || !hasMore || loading) return;

    setLoading(true);
    try {
      const result = await fetchArticles({ category, searchTerm, page });
      
      if (result && result.articles) {
        setArticles(prev => {
          const combined = page === 0 ? result.articles : [...prev, ...result.articles];
          
          // Enforce 200 limit strictly
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
  }, [page, category, searchTerm, hasMore]); 

  // Trigger load whenever dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- 2. Infinite Scroll Observer ---
  const observer = useRef();
  const lastArticleRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      // Trigger next page when last card appears
      if (entries[0].isIntersecting && hasMore && articles.length < MAX_ARTICLES) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, articles.length]);

  // --- 3. Progress & Scroll Listeners ---
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = totalHeight > 0 ? (window.pageYOffset / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowScroll(window.pageYOffset > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 4. Navigation Reseters ---
  const handleCategoryChange = (newCat, e) => {
    if (e) e.preventDefault();
    setArticles([]);    
    setPage(0);         
    setHasMore(true);   
    setSearchTerm('');  
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
      {/* Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '6px', backgroundColor: '#eee', zIndex: 9999 }}>
        <div style={{ width: `${scrollProgress}%`, height: '100%', backgroundColor: '#000', transition: 'width 0.2s' }} />
      </div>

      <header className="text-center" style={{ padding: '30px 0', borderBottom: '4px double #000' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '60px', fontWeight: 'bold', margin: 0 }}>DAY 2 DAY</h1>
        <p style={{ letterSpacing: '2px', fontWeight: 'bold' }}>THE 200-ARTICLE ARCHIVE</p>
      </header>

      {/* Navigation */}
      <nav className="navbar navbar-default" style={{ border: 'none', borderBottom: '1px solid #000', borderRadius: 0 }}>
        <div className="container">
          <ul className="nav navbar-nav" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            {['home', 'world', 'politics', 'technology'].map(cat => (
              <li key={cat}>
                <button 
                  onClick={(e) => handleCategoryChange(cat, e)} 
                  className="btn btn-link" 
                  style={{ 
                    color: '#000', textTransform: 'uppercase', padding: '15px 20px', 
                    fontWeight: category === cat ? 'bold' : 'normal',
                    textDecoration: 'none'
                  }}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
          <form className="navbar-form navbar-right" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          <div className="col-md-9" style={{ borderRight: '1px solid #eee' }}>
            <h2 style={{ fontFamily: 'Georgia', textTransform: 'uppercase' }}>
              {searchTerm ? `Search: ${searchTerm}` : `${category} Section`}
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

            {loading && <div className="text-center" style={{ padding: '30px' }}><h4>Loading more stories...</h4></div>}
            
            {!hasMore && articles.length >= MAX_ARTICLES && (
              <div className="text-center" style={{ padding: '40px', borderTop: '2px solid #000', marginTop: '20px' }}>
                <p style={{ fontFamily: 'Georgia', fontStyle: 'italic' }}>You have reached the limit of 200 articles for this section.</p>
              </div>
            )}
          </div>

          <div className="col-md-3">
            <div style={{ position: 'sticky', top: '20px', padding: '10px', background: '#f9f9f9' }}>
              <h4 style={{ fontWeight: 'bold', borderBottom: '2px solid #000' }}>READING PROGRESS</h4>
              <p>Loaded: <strong>{articles.length}</strong> / 200</p>
              <div style={{ background: '#ddd', height: '10px', width: '100%' }}>
                <div style={{ background: '#000', height: '100%', width: `${(articles.length / 200) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScroll && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          style={{ position: 'fixed', bottom: '30px', right: '30px', borderRadius: '50%', width: '50px', height: '50px', backgroundColor: '#000', color: '#fff', border: 'none', zIndex: 1000 }}
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
