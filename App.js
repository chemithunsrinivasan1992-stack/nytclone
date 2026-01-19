import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

/**
 * 1. NewsCard Component
 * Handles data from both Search and Top Stories APIs
 */
const NewsCard = React.forwardRef(({ article }, ref) => {
  if (!article) return null;

  const getImageUrl = (art) => {
    if (!art.multimedia || art.multimedia.length === 0) {
      return "https://via.placeholder.com/600x400?text=No+Image+Available";
    }
    const media = art.multimedia[0].url;
    // Search API uses relative paths, Top Stories uses absolute
    return media.startsWith("http") ? media : `https://www.nytimes.com/${media}`;
  };

  return (
    <div className="col-md-6" style={{ marginBottom: '30px' }} ref={ref}>
      <div className="thumbnail" style={{ border: 'none', borderBottom: '1px solid #ddd', paddingBottom: '20px', borderRadius: '0' }}>
        <img 
          src={getImageUrl(article)} 
          className="img-responsive" 
          alt={article.title}
          style={{ height: '250px', width: '100%', objectFit: 'cover' }} 
        />
        <div className="caption" style={{ padding: '15px 0' }}>
          <h4 style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', minHeight: '50px' }}>
            {article.title}
          </h4>
          <p className="small text-muted" style={{ lineHeight: '1.6' }}>
            {article.abstract?.substring(0, 150)}...
          </p>
          <a href={article.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-default">
            Read Full Article
          </a>
        </div>
      </div>
    </div>
  );
});

function App() {
  // Constants
  const KEY = "AbpjN7QUYO6RvE7f7EVK5MoqUc7JMu8HOgld7CGXjYU2DZOK";
  
  // State
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [category, setCategory] = useState('home');

  // Infinite Scroll Observer
  const observer = useRef();
  const lastArticleElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Normalize API data to a single format
  const normalizeData = (data, isSearch) => {
    if (isSearch) {
      return data.response.docs.map(doc => ({
        title: doc.headline.main,
        abstract: doc.snippet,
        url: doc.web_url,
        multimedia: doc.multimedia
      }));
    }
    return data.results.map(art => ({
      title: art.title,
      abstract: art.abstract,
      url: art.url,
      multimedia: art.multimedia
    }));
  };

  // Fetch Logic
  const fetchNews = async (isNewQuery = false) => {
    setLoading(true);
    try {
      // If we have a search term or are on page > 0, we use the Search API
      // Note: Top Stories API does not support pagination
      let url;
      let isSearchAPI = false;

      if (searchTerm || page > 0 || (category !== 'home' && category !== '')) {
        isSearchAPI = true;
        const query = searchTerm || category;
        url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${query}&page=${page}&api-key=${KEY}`;
      } else {
        url = `https://api.nytimes.com/svc/topstories/v2/${category}.json?api-key=${KEY}`;
      }

      const res = await fetch(url);
      if (res.status === 429) {
        console.warn("Rate limit hit. Slowing down...");
        return;
      }
      
      const data = await res.json();
      const results = normalizeData(data, isSearchAPI);

      if (isNewQuery) {
        setArticles(results);
      } else {
        setArticles(prev => [...prev, ...results]);
      }

      // NYT Search API provides pagination. Top Stories returns a fixed list (no more to load).
      setHasMore(isSearchAPI && results.length > 0);
      
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effect: Trigger fetch when page or category changes
  useEffect(() => {
    fetchNews(page === 0);
  }, [page, category]);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    setArticles([]);
    setPage(0);
    setHasMore(true);
    // If page was already 0, useEffect won't trigger, so we call manually
    if (page === 0) fetchNews(true);
  };

  // Handle Category Change
  const handleCategoryClick = (cat) => {
    setSearchTerm('');
    setCategory(cat);
    setArticles([]);
    setPage(0);
    setHasMore(true);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  return (
    <div className="App" style={{ backgroundColor: '#fff' }}>
      {/* Newspaper Header */}
      <header className="text-center" style={{ padding: '40px 0', borderBottom: '3px double #000', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Chomsky, Georgia, serif', fontSize: '80px', margin: '0' }}>DAY 2 DAY</h1>
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', display: 'inline-block', padding: '5px 50px', marginTop: '10px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '2px' }}>
          {formatDate(new Date())}
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="navbar navbar-default" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #000', backgroundColor: 'transparent' }}>
        <div className="container">
          <ul className="nav navbar-nav" style={{ fontWeight: 'bold' }}>
            <li><a href="/" onClick={() => handleCategoryClick('home')}>Home</a></li>
            <li><a href="/" onClick={() => handleCategoryClick('world')}>World</a></li>
            <li><a href="/" onClick={() => handleCategoryClick('politics')}>Politics</a></li>
            <li><a href="/" onClick={() => handleCategoryClick('technology')}>Tech</a></li>
          </ul>
          <form className="navbar-form navbar-right" onSubmit={handleSearch}>
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search articles..."
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <div className="input-group-btn">
                <button className="btn btn-default" type="submit">
                  <i className="glyphicon glyphicon-search"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <div className="row">
          {/* Main Feed */}
          <div className="col-md-8" style={{ borderRight: '1px solid #eee' }}>
            <div className="row">
              {articles.map((article, index) => {
                if (articles.length === index + 1) {
                  return <NewsCard ref={lastArticleElementRef} key={`${index}-${article.title}`} article={article} />;
                } else {
                  return <NewsCard key={`${index}-${article.title}`} article={article} />;
                }
              })}
            </div>

            {loading && (
              <div className="text-center" style={{ padding: '40px' }}>
                <div className="loader" style={{ fontSize: '18px', fontFamily: 'Georgia' }}>
                  Gathering more stories...
                </div>
              </div>
            )}

            {!hasMore && articles.length > 0 && (
              <div className="text-center" style={{ padding: '40px', color: '#999' }}>
                <hr />
                <p>You have reached the end of the news feed.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-md-4">
            <h3 style={{ fontFamily: 'Georgia', fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
              TRENDING
            </h3>
            {articles.slice(0, 6).map((article, index) => (
              <div key={`side-${index}`} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f4f4f4' }}>
                <h5 style={{ fontFamily: 'Georgia', fontWeight: 'bold', lineHeight: '1.4' }}>
                  <a href={article.url} target="_blank" style={{ color: '#222' }}>{article.title}</a>
                </h5>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;