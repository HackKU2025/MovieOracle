# Import necessary libraries
import requests
from bs4 import BeautifulSoup
import json
import argparse # Library to handle command-line arguments
import re # Regular expression library for cleaning text

# --- IMPORTANT WARNING ---
# This code is for EDUCATIONAL PURPOSES ONLY to demonstrate web scraping concepts,
# using the structure found in the provided HTML file (bjurhgojw.rtf - reviews page).
# DO NOT run this against live websites like IMDb, Metacritic, etc., without permission,
# as it likely violates their Terms of Service and may not work due to anti-scraping measures.
# Always check a website's '/robots.txt' file and Terms of Service before attempting to scrape.
# Consider using official APIs when available.

class ImdbReviewScraper:
    """
    A class to scrape user reviews from an IMDb title reviews page URL.
    Relies on specific HTML structure found on the reviews page.
    """
    def __init__(self, url=None):
        """
        Initializes the scraper. URL is optional if parsing local HTML.
        Args:
            url (str, optional): The IMDb title reviews URL to scrape. Defaults to None.
        """
        self.url = url
        # Use a realistic User-Agent header
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9' # Request English content
        }

    def _fetch_html(self):
        """
        Fetches the HTML content from the specified URL.
        Returns:
            str: The HTML content as text, or None if an error occurs or no URL provided.
        """
        if not self.url:
             print("No URL provided for fetching.")
             return None
        try:
            print(f"Fetching HTML from: {self.url}")
            response = requests.get(self.url, headers=self.headers, timeout=15)
            response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
            print("Successfully fetched HTML.")
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"Error fetching URL {self.url}: {e}")
            return None
        except Exception as e:
            print(f"An unexpected error occurred during fetching: {e}")
            return None

    def parse_reviews_from_html(self, html_content):
        """
        Parses HTML content from an IMDb reviews page to extract user reviews.
        Args:
            html_content (str): The HTML content to parse.
        Returns:
            list: A list of dictionaries, where each dictionary represents a review, or None if parsing fails.
        """
        if not html_content:
            print("No HTML content provided for parsing.")
            return None

        try:
            print("Parsing HTML content for reviews...")
            soup = BeautifulSoup(html_content, 'html.parser')

            reviews_list = []

            # Find all review containers - based on the provided HTML structure
            # This selector targets the main container for each review item.
            review_containers = soup.find_all('div', class_='lister-item-content')
            # Fallback if the primary selector changes (based on previous HTML)
            if not review_containers:
                 review_containers = soup.find_all('article', class_='user-review-item')


            print(f"Found {len(review_containers)} potential review containers.")

            for container in review_containers:
                review_data = {
                    'rating': None,
                    'title': None,
                    'text': None,
                    'author': None,
                    'date': None,
                    'is_spoiler': False
                }

                # --- Extract Rating ---
                # Rating is often in a span like: <span class="rating-other-user-rating"><span>8</span>/10</span>
                # Or in the newer structure: <span class="ipc-rating-star ..."><span>9</span>/10</span>
                rating_span = container.find('span', class_='rating-other-user-rating')
                if not rating_span: # Try newer structure
                    rating_span = container.find('span', class_='ipc-rating-star')

                if rating_span:
                    rating_value_span = rating_span.find('span') # Find the inner span with the number
                    if rating_value_span and rating_value_span.get_text(strip=True).isdigit():
                        review_data['rating'] = int(rating_value_span.get_text(strip=True))

                # --- Extract Review Title ---
                # Title is usually in an 'a' tag within a div with class 'title' or 'ipc-title'
                title_link = container.find('a', class_='title')
                if not title_link: # Try newer structure
                     title_div = container.find('div', class_='ipc-title')
                     if title_div:
                          title_link = title_div.find('a', class_='ipc-title-link-wrapper')

                if title_link:
                    review_data['title'] = title_link.get_text(strip=True)

                # --- Extract Review Text ---
                # Text is often in a div with class 'text show-more__control' or 'ipc-html-content-inner-div'
                text_div = container.find('div', class_='text')
                if text_div:
                     # IMDb review text often has HTML tags like <br>, need to handle them
                     # Get all text content, preserving basic structure might need more complex parsing
                     # For simplicity, we'll join text parts.
                     review_data['text'] = ' '.join(text_div.stripped_strings)

                # Try newer structure if the old one fails
                if not review_data['text']:
                     inner_html_div = container.find('div', class_='ipc-html-content-inner-div')
                     if inner_html_div:
                          review_data['text'] = ' '.join(inner_html_div.stripped_strings)


                # --- Extract Author ---
                # Author name is usually in a span with class 'display-name-link' inside a div with class 'display-name-date'
                # Or in newer structure: a link inside a list item inside div[data-testid="reviews-author"]
                author_span = container.find('span', class_='display-name-link')
                if author_span:
                     author_link = author_span.find('a')
                     if author_link:
                          review_data['author'] = author_link.get_text(strip=True)
                else: # Try newer structure
                     author_container = container.find_next_sibling('div', attrs={'data-testid': 'reviews-author'})
                     if author_container:
                          author_link = author_container.find('a', attrs={'data-testid': 'author-link'})
                          if author_link:
                               review_data['author'] = author_link.get_text(strip=True)


                # --- Extract Date ---
                # Date is usually in a span with class 'review-date' inside the same div as author
                # Or in newer structure: li.review-date inside div[data-testid="reviews-author"]
                date_span = container.find('span', class_='review-date')
                if date_span:
                     review_data['date'] = date_span.get_text(strip=True)
                else: # Try newer structure
                    author_container = container.find_next_sibling('div', attrs={'data-testid': 'reviews-author'})
                    if author_container:
                        date_li = author_container.find('li', class_='review-date')
                        if date_li:
                            review_data['date'] = date_li.get_text(strip=True)


                # --- Check for Spoiler Warning ---
                # Look for the spoiler button or warning text
                spoiler_button = container.find('button', class_='review-spoiler-button')
                if spoiler_button:
                    review_data['is_spoiler'] = True
                else:
                    # Sometimes spoilers are marked differently, check within the text div
                    text_content_div = container.find('div', class_='content')
                    if text_content_div:
                         spoiler_warning = text_content_div.find('div', class_='spoiler-warning')
                         if spoiler_warning:
                              review_data['is_spoiler'] = True


                # Only add if we found at least some review text or title
                if review_data['title'] or review_data['text']:
                    reviews_list.append(review_data)

            print(f"Successfully parsed {len(reviews_list)} reviews.")
            return reviews_list

        except Exception as e:
            print(f"An error occurred during parsing: {e}")
            import traceback
            traceback.print_exc() # Print detailed traceback for debugging
            return None

    def scrape_reviews(self):
        """
        Fetches and parses the reviews from the URL.
        Returns:
            list: A list of review dictionaries, or None if failed.
        """
        html_content = self._fetch_html()
        if html_content:
            return self.parse_reviews_from_html(html_content)
        else:
            return None

# --- How to Use (Command-Line Execution / Local File Parsing) ---
if __name__ == "__main__":
    # Set up argument parser (still useful if you want to fetch live URLs later)
    parser = argparse.ArgumentParser(description='Scrape user reviews from an IMDb title reviews page.')
    parser.add_argument('url', type=str, nargs='?', default=None, help='(Optional) The IMDb title reviews URL to scrape (e.g., "https://www.imdb.com/title/tt.../reviews"). If omitted, attempts to parse local file.')
    parser.add_argument('--file', type=str, default='bjurhgojw.rtf', help='Local HTML file path to parse if URL is not provided.')

    # Parse arguments
    args = parser.parse_args()

    html_content_to_parse = None
    scraper = None

    if args.url:
        try:
            scraper = ImdbReviewScraper(args.url)
            html_content_to_parse = scraper._fetch_html()
        except ValueError as ve:
            print(f"Error: {ve}")
            html_content_to_parse = None # Ensure it's None if URL is invalid
    else:
        # --- Parse Local File (As requested for this example) ---
        print(f"URL not provided, attempting to parse local file: {args.file}")
        scraper = ImdbReviewScraper() # Initialize without URL
        file_path = args.file
        try:
            # Note: RTF files often contain metadata before the actual HTML.
            # We need to find where the HTML starts.
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                full_rtf_content = f.read()
                # Look for common HTML starting tags
                html_start_index = full_rtf_content.find('<!DOCTYPE html>')
                if html_start_index == -1:
                     html_start_index = full_rtf_content.find('<html') # Fallback

                if html_start_index != -1:
                     html_content_to_parse = full_rtf_content[html_start_index:]
                     print(f"Successfully read and found HTML content in {file_path}")
                else:
                     print(f"Error: Could not find '<!DOCTYPE html>' or '<html' in {file_path}. Is it a valid HTML file embedded in RTF?")
                     html_content_to_parse = None

        except FileNotFoundError:
            print(f"Error: File not found at {file_path}")
            html_content_to_parse = None
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            html_content_to_parse = None
        # --- End Local File Parsing ---

    # --- Process the HTML (either fetched or from file) ---
    if html_content_to_parse and scraper:
        scraped_reviews = scraper.parse_reviews_from_html(html_content_to_parse)

        if scraped_reviews:
            print("\n--- Scraping Results (JSON) ---")
            # Pretty print the JSON output
            print(json.dumps(scraped_reviews, indent=4))
            print(f"\n--- Found {len(scraped_reviews)} reviews ---")
        else:
            print("\nScraping failed or no reviews extracted.")
    elif not args.url:
         print("\nNo URL provided and failed to read or parse local file.")
    else:
         print("\nFailed to fetch URL.")