import os
from flask import Flask, request, jsonify
from flask_cors import CORS 
from imdb_review_scraper import ImdbReviewScraper
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
genai.configure(api_key=os.getenv('VITE_GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

@app.route('/scrape', methods=['POST'])
def scrape_route():
    try:
        url = request.json.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        scraper = ImdbReviewScraper(url)
        reviews = scraper.scrape_reviews()
        if reviews:
            return jsonify(reviews), 200
        else:
            return jsonify({'error': 'Failed to scrape reviews'}), 500

    except Exception as e:
        return jsonify({'error': f"An unexpected error occurred: {e}"}), 500

@app.route('/analyze', methods=['POST'])
def analyze_reviews():
    try:
        reviews = request.json.get('reviews')
        if not reviews:
            return jsonify({'error': 'Reviews are required'}), 400
            
        # Extract text from reviews
        review_texts = [review.get('text', '') for review in reviews if review.get('text')]
        combined_text = ' '.join(review_texts)
        
        # Send to Gemini for analysis
        response = model.generate_content(f"Analyze these movie reviews and provide key insights: {combined_text}")
        
        return jsonify({'analysis': response.text}), 200
        
    except Exception as e:
        return jsonify({'error': f"Analysis failed: {e}"}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 8080
    port = int(os.environ.get('PORT', 8080))
    # Run on all available interfaces
    app.run(host='0.0.0.0', port=port)
