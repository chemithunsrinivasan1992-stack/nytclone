import React from 'react';

const BreakingNews = ({ articles }) => {
  // We only want the first 3 articles for the slider
  const sliderArticles = articles.slice(0, 3);

  if (sliderArticles.length === 0) return null;

  return (
    <div id="news-carousel" className="carousel slide" data-ride="carousel" style={{ marginBottom: '40px' }}>
      {/* Indicators */}
      <ol className="carousel-indicators">
        {sliderArticles.map((_, index) => (
          <li key={index} data-target="#news-carousel" data-slide-to={index} className={index === 0 ? "active" : ""}></li>
        ))}
      </ol>

      {/* Wrapper for slides */}
      <div className="carousel-inner" role="listbox">
        {sliderArticles.map((article, index) => (
          <div key={index} className={`item ${index === 0 ? "active" : ""}`}>
            {article.multimedia && (
              <img 
                src={article.multimedia[0].url} 
                alt={article.title} 
                style={{ width: '100%', height: '500px', objectFit: 'cover' }} 
              />
            )}
            <div className="carousel-caption" style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '20px' }}>
              <h2 style={{ fontFamily: 'Georgia', fontWeight: 'bold' }}>{article.title}</h2>
              <p>{article.abstract}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <a className="left carousel-control" href="#news-carousel" role="button" data-slide="prev">
        <span className="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
        <span className="sr-only">Previous</span>
      </a>
      <a className="right carousel-control" href="#news-carousel" role="button" data-slide="next">
        <span className="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
        <span className="sr-only">Next</span>
      </a>
    </div>
  );
};

export default BreakingNews;