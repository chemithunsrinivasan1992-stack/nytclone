import React from 'react';

const NewsCard = React.forwardRef(({ article }, ref) => {
  if (!article) return null;

  const getImageUrl = (art) => {
  // 1. Check if multimedia exists and has at least one item
  if (!art.multimedia || !Array.isArray(art.multimedia) || art.multimedia.length === 0) {
    return "https://via.placeholder.com/600x400?text=No+Image+Available";
  }

  // 2. Safely grab the URL from the first multimedia object
  const media = art.multimedia[0]?.url;

  // 3. Final safety check if the url property itself is missing
  if (!media) {
    return "https://via.placeholder.com/600x400?text=No+Image+Available";
  }

  // Search API uses relative paths, Top Stories uses absolute
  return media.startsWith("http") ? media : `https://www.nytimes.com/${media}`;
};

  return (
    <div className="col-md-6" style={{ marginBottom: '30px' }} ref={ref}>
      <div className="thumbnail" style={{ border: 'none', borderBottom: '1px solid #ddd', paddingBottom: '20px', borderRadius: '0' }}>
        <img 
          src={getImageUrl(article)} 
          alt={article.title}
          style={{ height: '250px', width: '100%', objectFit: 'cover' }} 
        />
        <div className="caption" style={{ padding: '15px 0' }}>
          <h4 style={{ fontFamily: 'Georgia, serif', fontWeight: 'bold', minHeight: '50px' }}>
            {article.title}
          </h4>
          <p className="small text-muted">
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

export default NewsCard;