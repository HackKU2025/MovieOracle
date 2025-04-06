import { useState } from "react";
import { useEffect } from "react";  

const API_BASE_URL = 'http://localhost:5000';

const fetchReviews = async (imdbID) => {
  try {
    const imdbUrl = `https://www.imdb.com/title/${imdbID}/reviews`;
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: imdbUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch reviews');
    }

    const reviewsData = await response.json();
    return reviewsData.map(review => review.text).filter(review => review); // Extract and filter review texts

  } catch (error) {
    console.error("Error fetching reviews:", error);
    setError('Failed to fetch reviews. ' + error.message); // Display error from server
    return [];
  }
};

// --- Helper Function for AI Summary (using Gemini API) ---
async function generateAiSummary(reviews) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      summary: "Error: Gemini API key not found. Check your environment variables.",
      witty: "",
    };
  }

  try {
    const prompt = `Prompt:
    Generate a single witty, savage, funny, or interesting remark about a movie, based on its review score (0-100) and a brief summary of critic sentiment. Your response must be no longer than 50 words and should match the tone implied by the score:
    85-100: Highly positive, humorous praise.
    70-84: Witty, mildly sarcastic compliment.
    50-69: Humorous yet critical jab.
    Below 50: Savage and funny takedown.
    Use pop culture references, puns, or wordplay where appropriate. No prefaces, no summaries — just the remark. Stay original and playful, but don't punch down.
    Example Input:
    Score: 88
    Summary: “An exhilarating masterpiece that pushes boundaries.”
    Example Output:
    "If this movie were a rollercoaster, I'd still be stuck in line just to ride it again — and I hate lines.":\n\n${reviews.join('\n\n')}`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 100,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const summary = data.candidates[0].content.parts[0].text.trim();
      return { 
        summary: "Here's what the critics are saying:",
        witty: summary 
      };
    } else {
      return {
        summary: "Error: Could not generate a summary. Check the API response.",
        witty: "",
      };
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      summary: "Error: Failed to call Gemini API.",
      witty: "",
    };
  }
}

// Simple Icon Placeholder (replace with actual icons like Lucide)
const Icon = ({ name, className = "w-4 h-4 inline-block mr-1" }) => (
  <span className={className}>[{name}]</span> // Placeholder
);

// Main Application Component
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResponse, setAiResponse] = useState({ summary: '', witty: '' });
  const [reviews, setReviews] = useState([]);
  const [analysis, setAnalysis] = useState('');

  // Effect to search when search term changes
  useEffect(() => {
    const searchMovies = async () => {
      if (!searchTerm) {
        setSearchResults([]);
        setSelectedItem(null);
        setAiResponse({ summary: '', witty: '' });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&s=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        if (data.Response === 'True') {
          setSearchResults(data.Search);
        } else {
          setSearchResults([]);
          setError(data.Error || 'No results found');
        }
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMovies, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle selecting an item from search results
  const handleSelect = async (item) => {
    setLoading(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=${import.meta.env.VITE_OMDB_API_KEY}&i=${item.imdbID}&plot=full`);
      const data = await response.json();
      
      if (data.Response === 'True') {
        setSelectedItem(data);
        const reviews = await fetchReviews(data.imdbID);
        const aiResponse = await generateAiSummary(reviews);
        setAiResponse(aiResponse);
      } else {
        setError('Failed to fetch movie details');
      }
    } catch (err) {
      setError('Failed to fetch movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeReviews = async (imdbUrl) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imdbUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to scrape reviews');
      }

      const data = await response.json();
      setReviews(data);
      return data;
    } catch (error) {
      console.error('Error scraping reviews:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeReviews = async (reviews) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviews }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze reviews');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-2">
          Movie Oracle
        </h1>
        <p className="text-lg text-gray-400">Your Guide to Movies</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search for a movie by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-md"
        />
      </div>

      {/* Results Area */}
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
        {/* Search Results List (Left Side) */}
        <div className="md:w-1/3 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 max-h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-3 border-b border-gray-600 pb-2 text-gray-300">Search Results</h2>
          {loading && <p className="text-gray-400">Loading...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!loading && !error && searchResults.length > 0 ? (
            <ul className="space-y-2">
              {searchResults.map(item => (
                <li key={item.imdbID}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-purple-800 transition-colors duration-150 ${selectedItem?.imdbID === item.imdbID ? 'bg-purple-700 font-semibold' : 'bg-gray-750'}`}
                  >
                    {item.Title} ({item.Year})
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loading && !error && searchTerm && <p className="text-gray-400">No results found for "{searchTerm}". Try a different search!</p>
          )}
          {!searchTerm && <p className="text-gray-400">Start typing to search...</p>}
        </div>

        {/* Selected Item Details (Right Side) */}
        <div className="md:w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 min-h-[60vh]">
          {loading && selectedItem ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Loading movie details...</p>
            </div>
          ) : selectedItem ? (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-3xl font-bold text-purple-400">{selectedItem.Title} <span className="text-xl font-normal text-gray-400">({selectedItem.Year})</span></h2>

              {/* AI Summary Section */}
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-lg border border-purple-700 shadow-inner">
                <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center"><Icon name="AI" /> AI Verdict:</h3>
                <p className="text-gray-300 mb-2 italic">{aiResponse.summary}</p>
                <p className="text-purple-300 font-medium">🎙️ Oracle says: "{aiResponse.witty}"</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div><strong className="text-gray-400">Genre:</strong> {selectedItem.Genre}</div>
                <div><strong className="text-gray-400">Director:</strong> {selectedItem.Director}</div>
                <div><strong className="text-gray-400">Actors:</strong> {selectedItem.Actors}</div>
                <div><strong className="text-gray-400">Runtime:</strong> {selectedItem.Runtime}</div>
                <div><strong className="text-gray-400">Rated:</strong> {selectedItem.Rated}</div>
                <div><strong className="text-gray-400">IMDb Rating:</strong> {selectedItem.imdbRating}</div>
              </div>

              {/* Plot */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-gray-300 mb-1">Plot Summary:</h3>
                <p className="text-gray-400 text-sm">{selectedItem.Plot}</p>
              </div>

              {/* Ratings */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Ratings:</h3>
                <div className="flex flex-wrap gap-4">
                  {selectedItem.Ratings?.map((rating, index) => (
                    <div key={index} className="text-center p-2 bg-gray-700 rounded">
                      <div className="text-xs uppercase text-gray-400">{rating.Source}</div>
                      <div className="text-lg font-bold text-purple-400">{rating.Value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Select a movie from the search results to see details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center mt-8 text-gray-500 text-sm">
        Powered by OMDB API
      </footer>

      {/* Basic Fade-in Animation Style */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
}

export default App;
