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

export const fetchArticles = async ({ category = 'home', searchTerm = '', page = 0 }) => {
  let url;
  let isSearchAPI = false;

  // Logic: Search API for keywords OR pagination OR specific non-default categories
  if (searchTerm || page > 0 || (category !== 'home' && category !== '')) {
    isSearchAPI = true;
    const query = searchTerm || category;
    url = `${BASE_URL}/search/v2/articlesearch.json?q=${query}&page=${page}&api-key=${API_KEY}`;
  } else {
    url = `${BASE_URL}/topstories/v2/${category}.json?api-key=${API_KEY}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit exceeded");
    throw new Error("Failed to fetch news");
  }

  const data = await response.json();
  return {
    articles: normalizeArticles(data, isSearchAPI),
    hasMore: isSearchAPI // Top Stories doesn't support pagination
  };
};