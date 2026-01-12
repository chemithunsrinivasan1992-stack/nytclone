import React, { useState, useEffect } from 'react';
import './App.css';

// 1. NewsCard Component (Defined safely outside)
const NewsCard = ({ article }) => {
  if (!article) return null;

  // Logic to fix image paths (absolute vs relative)
  const getImageUrl = (art) => {
    if (!art.multimedia || art.multimedia.length === 0) {
      return "https://via.placeholder.com/400x250?text=No+Image+Available";
    }
    const media = art.multimedia[0].url;
    return media.startsWith("http") ? media : `https://www.nytimes.com/${media}`;
  };

  return (
    <div className="col-md-6" style={{ marginBottom: '20px' }}>
      <div className="thumbnail" style={{ border: 'none', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <img src={getImageUrl(article)} className="img-responsive" alt={article.title}
          style={{ height: '200px', width: '100%', objectFit: 'cover' }} />
        <div className="caption" style={{ padding: '10px 0' }}>
          <h4 style={{ fontFamily: 'Georgia', fontWeight: 'bold' }}>{article.title}</h4>
          <p className="small text-muted">{article.abstract?.substring(0, 100)}...</p>
          <a href={article.url} target="_blank" rel="noreferrer" className="btn btn-xs btn-default">Read More</a>
        </div>
      </div>
    </div>
  );
};

function App() {
  const NYTDebugger = () => {
    const [status, setStatus] = React.useState("Testing...");
    const KEY = process.env.REACT_APP_NYT_API_KEY;

    React.useEffect(() => {
      if (!KEY) {
        setStatus("❌ ERROR: Your .env variable is NOT being read. Check your variable name or restart your terminal.");
        return;
      }

      fetch(`https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${KEY}`)
        .then(res => {
          if (res.status === 200) setStatus("✅ SUCCESS: Your key is working perfectly!");
          if (res.status === 401) setStatus("❌ 401 ERROR: The key exists but NYT rejected it. Check if 'Top Stories' API is enabled in your NYT Dashboard.");
          if (res.status === 429) setStatus("⚠️ 429 ERROR: Rate limited. Wait 60 seconds.");
        })
        .catch(err => setStatus("❌ NETWORK ERROR: Check your internet connection."));
    }, [KEY]);

    return (
      <div style={{ padding: '15px', background: '#333', color: '#fff', textAlign: 'center', fontSize: '14px' }}>
        <strong>NYT Debugger:</strong> {status} <br />
        <small>Key being sent: {KEY ? `${KEY.substring(0, 5)}...` : "NONE"}</small>
      </div>
    );
  };
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
const KEY = "AbpjN7QUYO6RvE7f7EVK5MoqUc7JMu8HOgld7CGXjYU2DZOK";
  //const API_KEY = process.env.REACT_APP_NYT_API_KEY;

  // Function to fetch Top Stories (Home, Sports, Politics)
  const fetchNews = async (category = 'home') => {
    setLoading(true);
    try {
      // Correct way to use the variable
      //const url = `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${process.env.REACT_APP_NYT_API_KEY}`;
      const url = `https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      // Debugging: Log the data to see what it looks like
      console.log("API Response Data:", data);

      if (data.results) {
        setArticles(data.results);
      } else {
        setArticles([]); // This triggers the "No articles found"
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };
  // Function for Keyword Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${searchTerm}&api-key=${KEY}`);
      const data = await res.json();
      // Map Search API structure to match Top Stories structure
      const results = data.response?.docs.map(doc => ({
        title: doc.headline.main,
        abstract: doc.snippet,
        url: doc.web_url,
        multimedia: doc.multimedia
      })) || [];
      setArticles(results);
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews(); // Initial load
  }, []);

  return (
    <div className="App">
      {/* Header */}
      
      <header className="text-center" style={{ padding: '20px 0', borderBottom: '1px solid #000' }}>
        <h1 style={{ fontFamily: 'Chomsky, Georgia, serif', fontSize: '60px' }}>DAY 2 DAY NEWS</h1>
        <p style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {formatDate(new Date())}
        </p>
      </header>
      
      {/* Navbar & Search */}
      <nav className="navbar navbar-default" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #000' }}>
        <div className="container">
          <ul className="nav navbar-nav">
            <li><a href="#" onClick={() => fetchNews('home')}>Home</a></li>
            <li><a href="#" onClick={() => fetchNews('world')}>World</a></li>
            <li><a href="#" onClick={() => fetchNews('politics')}>Politics</a></li>
            <li><a href="#" onClick={() => fetchNews('sports')}>Sports</a></li>
          </ul>
          <form className="navbar-form navbar-right" onSubmit={handleSearch}>
            <div className="input-group">
              <input type="text" className="form-control" placeholder="Search news..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <div className="input-group-btn">
                <button className="btn btn-default" type="submit"><i className="glyphicon glyphicon-search"></i></button>
              </div>
            </div>
          </form>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        {loading ? (
          <div className="text-center"><h3>Loading the latest stories...</h3></div>
        ) : (
          <div className="row">
            {/* Left Column: News Feed */}
            <div className="col-md-8" style={{ borderRight: '1px solid #eee' }}>
              <div className="row">
                {articles.length > 0 ? (
                  articles.slice(0, 10).map((article, index) => (
                    <NewsCard key={index} article={article} />
                  ))
                ) : <p>No articles found.</p>}
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="col-md-4">
              <h4 style={{ borderBottom: '2px solid #000', paddingBottom: '5px' }}>LATEST UPDATES</h4>
              {articles.slice(10, 16).map((article, index) => (
                <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #f4f4f4' }}>
                  <h5 style={{ fontFamily: 'Georgia', fontWeight: 'bold' }}>
                    <a href={article.url} target="_blank" style={{ color: '#333' }}>{article.title}</a>
                  </h5>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;