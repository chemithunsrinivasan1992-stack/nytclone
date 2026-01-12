import React, { useState, useEffect } from 'react';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const API_KEY = process.env.REACT_APP_NYT_API_KEY;

  useEffect(() => {
    fetch(`https://api.nytimes.com/svc/topstories/v2/home.json?api-key=${API_KEY}`)
      .then(response => response.json())
      .then(data => setArticles(data.results))
      .catch(err => console.error(err));
  }, [API_KEY]);

  return (
    <div className="container">
      <div className="row">
        {articles.map((article, index) => (
          <div key={index} className="col-md-4 col-sm-6">
            <div className="thumbnail" style={{ border: 'none', borderBottom: '1px solid #eee' }}>
              {article.multimedia && (
                <img src={article.multimedia[0].url} alt={article.title} className="img-responsive" />
              )}
              <div className="caption">
                <h3 style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>{article.title}</h3>
                <p className="text-muted">{article.byline}</p>
                <p>{article.abstract}</p>
                <a href={article.url} target="_blank" rel="noreferrer" className="btn btn-link">Read More</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;