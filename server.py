from flask import Flask, request, jsonify
from imdb_review_scraper import ImdbReviewScraper  # Assuming your scraper code is in imdb_review_scraper.py

app = Flask(__name__)

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
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000) # Run on port 5000
