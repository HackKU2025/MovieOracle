import React, { useState, useEffect } from 'react';

// --- Mock Data ---
// In a real app, this would come from an API
const mockData = [
  {
    id: 1,
    title: "Inception",
    type: "Movie",
    year: 2010,
    genre: ["Sci-Fi", "Action", "Thriller"],
    plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.",
    themes: ["Dreams", "Reality", "Memory", "Grief"],
    keywords: ["dream", "subconscious", "heist", "mind", "manipulation"],
    director: "Christopher Nolan",
    actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
    ratings: { imdb: 8.8, rottenTomatoes: "87%", metacritic: 74 },
    reviews: [
      "A visually stunning and intellectually engaging thriller.",
      "Complex plot that rewards multiple viewings.",
      "Nolan's masterpiece of intricate storytelling.",
      "Sometimes confusing, but always captivating.",
    ],
    whereToWatch: ["Streaming Service A", "Rent on Platform B"],
    publisher: null, // N/A for movies
  },
  {
    id: 2,
    title: "The Witcher 3: Wild Hunt",
    type: "Game",
    year: 2015,
    genre: ["Action RPG", "Open World", "Fantasy"],
    plot: "As Geralt of Rivia, a monster slayer for hire, you embark on an epic journey to find Ciri, a child of prophecy, while navigating a war-torn world and confronting the supernatural Wild Hunt.",
    themes: ["Choice & Consequence", "War", "Found Family", "Destiny"],
    keywords: ["monster hunting", "fantasy", "magic", "open world", "RPG"],
    director: "Konrad Tomaszkiewicz, Mateusz Kanik, Sebastian Stępień",
    actors: ["Doug Cockle (Geralt VO)", "Denise Gough (Yennefer VO)"], // Voice Actors
    ratings: { ign: 9.3, gamespot: 10, metacritic: 92 },
     reviews: [
      "A landmark in open-world RPG design.",
      "Incredible storytelling and deep characters.",
      "Vast world filled with meaningful content.",
      "Combat can be clunky at times, but the world pulls you in.",
    ],
    whereToWatch: ["Steam", "GOG", "PlayStation Store", "Xbox Store"], // Where to buy/play
    publisher: "CD Projekt Red",
  },
   {
    id: 3,
    title: "Parasite",
    type: "Movie",
    year: 2019,
    genre: ["Dark Comedy", "Thriller", "Drama"],
    plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    themes: ["Class Struggle", "Social Inequality", "Family", "Deception"],
    keywords: ["social commentary", "dark humor", "family", "wealth gap", "con"],
    director: "Bong Joon Ho",
    actors: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik", "Park So-dam"],
    ratings: { imdb: 8.6, rottenTomatoes: "99%", metacritic: 96 },
    reviews: [
        "A masterful blend of genres that is both hilarious and deeply unsettling.",
        "Bong Joon Ho delivers a scathing critique of capitalism.",
        "Every frame is meticulously crafted.",
        "A truly unpredictable and unforgettable film.",
    ],
    whereToWatch: ["Streaming Service C", "Rent on Platform D"],
    publisher: null,
  },
];

// --- Helper Function for AI Summary (Simulated) ---
function generateAiSummary(reviews) {
  // Basic simulation: Join first few reviews and add a witty comment.
  // A real implementation would use NLP/LLM.
  const commonThemes = reviews.slice(0, 2).join(' '); // Very basic commonality
  const wittyResponses = [
    "So, basically, critics loved it, but bring popcorn... and maybe a notepad.",
    "Seems like a winner! Just don't blame us if you get addicted.",
    "The consensus? It's brilliant. Prepare for your mind to be blown (or just mildly entertained).",
    "Highly recommended, unless you *hate* things that are awesome.",
  ];
  const randomWitty = wittyResponses[Math.floor(Math.random() * wittyResponses.length)];

  return {
    summary: `Common sentiments suggest: "${commonThemes}" Overall, it's highly regarded.`,
    witty: randomWitty
  };
}

// --- React Components ---

// Simple Icon Placeholder (replace with actual icons like Lucide)
const Icon = ({ name, className = "w-4 h-4 inline-block mr-1" }) => (
  <span className={className}>[{name}]</span> // Placeholder
);

// Main Application Component
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filteredData, setFilteredData] = useState(mockData);
  const [aiResponse, setAiResponse] = useState({ summary: '', witty: '' });

  // Effect to filter data when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(mockData); // Show all if search is empty
      setSelectedItem(null); // Clear selection
      setAiResponse({ summary: '', witty: '' }); // Clear AI response
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = mockData.filter(item =>
      item.title.toLowerCase().includes(lowerSearchTerm) ||
      item.genre.some(g => g.toLowerCase().includes(lowerSearchTerm)) ||
      item.keywords.some(k => k.toLowerCase().includes(lowerSearchTerm)) ||
      (item.director && item.director.toLowerCase().includes(lowerSearchTerm)) ||
      (item.actors && item.actors.some(a => a.toLowerCase().includes(lowerSearchTerm))) ||
      (item.publisher && item.publisher.toLowerCase().includes(lowerSearchTerm)) ||
      item.year.toString().includes(lowerSearchTerm)
    );
    setFilteredData(results);
    setSelectedItem(null); // Clear selection on new search
     setAiResponse({ summary: '', witty: '' }); // Clear AI response
  }, [searchTerm]);

  // Handle selecting an item from search results
  const handleSelect = (item) => {
    setSelectedItem(item);
    if (item && item.reviews) {
        setAiResponse(generateAiSummary(item.reviews));
    } else {
        setAiResponse({ summary: '', witty: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 font-sans p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-2">
          Hackathon Oracle
        </h1>
        <p className="text-lg text-gray-400">Your Witty Guide to Movies & Games</p>
      </header>

      {/* Search Bar */}
      <div className="mb-6 max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="Search by title, genre, actor, director, year..."
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
          {filteredData.length > 0 ? (
            <ul className="space-y-2">
              {filteredData.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left p-2 rounded hover:bg-gray-700 focus:outline-none focus:bg-purple-800 transition-colors duration-150 ${selectedItem?.id === item.id ? 'bg-purple-700 font-semibold' : 'bg-gray-750'}`}
                  >
                    {item.title} ({item.year}) - <span className="text-sm text-gray-400">{item.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             searchTerm && <p className="text-gray-400">No results found for "{searchTerm}". Try broadening your search!</p>
          )}
           {!searchTerm && <p className="text-gray-400">Start typing to search...</p>}
        </div>

        {/* Selected Item Details (Right Side) */}
        <div className="md:w-2/3 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 min-h-[60vh]">
          {selectedItem ? (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-3xl font-bold text-purple-400">{selectedItem.title} <span className="text-xl font-normal text-gray-400">({selectedItem.year})</span></h2>

              {/* AI Summary Section */}
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 rounded-lg border border-purple-700 shadow-inner">
                 <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center"><Icon name="AI" /> AI Verdict:</h3>
                 <p className="text-gray-300 mb-2 italic">{aiResponse.summary}</p>
                 <p className="text-purple-300 font-medium">🎙️ Oracle says: "{aiResponse.witty}"</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div><strong className="text-gray-400">Genre:</strong> {selectedItem.genre.join(', ')}</div>
                {selectedItem.director && <div><strong className="text-gray-400">Director:</strong> {selectedItem.director}</div>}
                 {selectedItem.publisher && <div><strong className="text-gray-400">Publisher:</strong> {selectedItem.publisher}</div>}
                <div><strong className="text-gray-400">Starring/VO:</strong> {selectedItem.actors.slice(0, 3).join(', ')}{selectedItem.actors.length > 3 ? '...' : ''}</div>
                <div><strong className="text-gray-400">Where to Watch/Play:</strong> {selectedItem.whereToWatch.join(', ')}</div>
              </div>

              {/* Plot */}
               <div className="pt-4 border-t border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-300 mb-1">Plot Summary:</h3>
                 <p className="text-gray-400 text-sm">{selectedItem.plot}</p>
              </div>

              {/* Themes & Keywords */}
               <div className="pt-4 border-t border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-300 mb-1">Themes:</h3>
                 <div className="flex flex-wrap gap-2">
                    {selectedItem.themes.map(theme => <span key={theme} className="bg-gray-700 text-xs px-2 py-1 rounded-full">{theme}</span>)}
                 </div>
                 <h3 className="text-lg font-semibold text-gray-300 mt-3 mb-1">Keywords:</h3>
                 <div className="flex flex-wrap gap-2">
                    {selectedItem.keywords.map(kw => <span key={kw} className="bg-gray-700 text-xs px-2 py-1 rounded-full">{kw}</span>)}
                 </div>
              </div>

              {/* Ratings */}
              <div className="pt-4 border-t border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-300 mb-2">Ratings:</h3>
                 <div className="flex flex-wrap gap-4">
                    {Object.entries(selectedItem.ratings).map(([source, rating]) => (
                        <div key={source} className="text-center p-2 bg-gray-700 rounded">
                            <div className="text-xs uppercase text-gray-400">{source}</div>
                            <div className="text-lg font-bold text-purple-400">{rating}</div>
                        </div>
                    ))}
                 </div>
              </div>

               {/* Simulated Reviews */}
              <div className="pt-4 border-t border-gray-700">
                 <h3 className="text-lg font-semibold text-gray-300 mb-2">Review Snippets (Simulated):</h3>
                 <ul className="list-disc list-inside space-y-1 text-sm text-gray-400 pl-2">
                    {selectedItem.reviews.map((review, index) => <li key={index}>{review}</li>)}
                 </ul>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Select an item from the search results to see details.</p>
            </div>
          )}
        </div>
      </div>

       {/* Footer */}
      <footer className="text-center mt-8 text-gray-500 text-sm">
        Powered by Hackathon Fuel & Mock Data™
      </footer>

      {/* Basic Fade-in Animation Style */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
