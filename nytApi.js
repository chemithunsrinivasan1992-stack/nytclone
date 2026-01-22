const BASE_URL = 'https://api.nytimes.com/svc';
const API_KEY = "AbpjN7QUYO6RvE7f7EVK5MoqUc7JMu8HOgld7CGXjYU2DZOK";

/**
 * Normalizes different NYT API responses into a unified article object
 */
const normalizeArticles = (data, isSearch) => {
  if (isSearch) {
    return data.response.docs.map(doc => ({
      title: doc.headline.main,
      abstract: doc.snippet,
      url: doc.web_url,
      multimedia: doc.multimedia,
      id: doc._id
    }));
  }
  return data.results.map((art, index) => ({
    title: art.title,
    abstract: art.abstract,
    url: art.url,
    multimedia: art.multimedia,
    id: art.uri || index
  }));
};

// api/nytApi.js excerpt
export const fetchArticles = async ({ category, searchTerm, page = 0 }) => {
  const API_KEY = process.env.REACT_APP_NYT_API_KEY;
  // Use 'fq' (Filter Query) for categories and 'q' for search terms
  const query = searchTerm ? `q=${searchTerm}` : `fq=section_name:("${category}")`;
  const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?${query}&page=${page}&api-key=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    articles: data.response.docs.map(doc => ({
      title: doc.headline.main,
      url: doc.web_url,
      // mapping other fields...
    })),
    hasMore: data.response.meta.offset < data.response.meta.hits
  };
};
