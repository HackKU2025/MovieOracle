class MovieFetcher {
    constructor(apiKey) {
      this.apiKey = '83392b0';
      this.baseUrl = 'https://imdb-api.com/en/API/Title';
    }
  
    async getMovie(imdbID) {
      const url = `${this.baseUrl}/${this.apiKey}/${imdbID}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        return data;
      } catch (err) {
        console.error('Failed to fetch movie:', err);
        return null;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const fetcher = new MovieFetcher('83392b0');
    const movieData = await fetcher.getMovie('tt1375666'); // Example: Inception
  
    if (movieData) {
      document.getElementById('movie-title').textContent = movieData.title;
      document.getElementById('movie-rating').textContent = `IMDb ${movieData.imDbRating}`;
  
      const bgDiv = document.getElementById('movie-bg');
      const bgImage = movieData.image || ''; // Might also be movieData.backdrops?.[0]?.link
      bgDiv.style.backgroundImage = `url('${bgImage}')`;
    }
  });