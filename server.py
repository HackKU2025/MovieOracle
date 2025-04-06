import os
from flask import Flask, request, jsonify
from imdb_review_scraper import ImdbReviewScraper
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)

@app.route('/scrape', methods=['POST'])
def scrape_route():
    try:
        url = request.json.get('url')
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        scraper = ImdbReviewScraper(url)
        reviews = scraper.scrape_reviews()
        if reviews:
            return jsonify(reviews), 200
        else:
            return jsonify({'error': 'Failed to scrape reviews'}), 500  # More specific error code

    except request.exceptions.RequestException as e:
        return jsonify({'error': f"HTTP error during scraping: {e}"}), 500

    except Exception as e:
        return jsonify({'error': f"An unexpected error occurred: {e}"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000)) # Use environment variable for port if available
    app.run(debug=True, host='0.0.0.0', port=port)
