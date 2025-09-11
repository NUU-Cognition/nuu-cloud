import requests
import logging
import os
import mimetypes
from urllib.parse import urljoin, urlparse
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class NUUCloudClient:
    def __init__(self, base_url="https://nuu-cloud.replit.app/"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.setup_logging()
        self.setup_retry_strategy()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('nuu_client.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def setup_retry_strategy(self):
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def login(self):
        """Handle OAuth login flow with Replit"""
        self.logger.info("Starting OAuth login flow...")

        login_url = urljoin(self.base_url, "/auth/login")  # This is wrong

        try:
            # Follow redirects to complete OAuth
            response = self.session.get(login_url, allow_redirects=True)
            response.raise_for_status()

            # Check if the server set a session cookie
            if self.session.cookies:
                self.logger.info(
                    "OAuth login successful - session cookie stored")
                return True
            else:
                self.logger.error("Login failed: no session cookies found")
                return False

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Login request failed: {e}")
            return False

    # Document operations
    def list_documents(self):
        return self._list_items('/api/v1/documents', 'documents')

    def upload_document(self, file_path):
        return self._upload_document(file_path)

    def download_document(self, doc_id, save_path):
        return self._download_item(f'/api/v1/documents/{doc_id}', save_path, 'document')

    def delete_document(self, doc_id):
        return self._delete_item(f'/api/v1/documents/{doc_id}', 'document')

    # Media operations
    def list_media(self):
        return self._list_items('/api/v1/media', 'media')

    def upload_media(self, file_path):
        return self._upload_media(file_path)

    def download_media(self, media_id, save_path):
        return self._download_item(f'/api/v1/media/{media_id}', save_path, 'media')

    def delete_media(self, media_id):
        return self._delete_item(f'/api/v1/media/{media_id}', 'media')

    # Generic operations (internal)
    def _list_items(self, endpoint, item_type):
        self.logger.info(f"Listing {item_type}...")
        url = urljoin(self.base_url, endpoint)

        try:
            response = self.session.get(url)
            response.raise_for_status()
            data = response.json()

            if data.get('success'):
                items = data.get('data', [])
                self.logger.info(
                    f"Successfully retrieved {len(items)} {item_type}")
                return items
            else:
                self.logger.error(
                    f"API returned success=false for {item_type}")
                return []

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to list {item_type}: {e}")
            return []

    def _upload_document(self, file_path):
        if not os.path.exists(file_path):
            self.logger.error(f"File not found: {file_path}")
            return None

        filename = os.path.basename(file_path)
        file_ext = os.path.splitext(filename)[1].lower()

        self.logger.info(f"Uploading document: {filename}")

        if file_ext == '.pdf':
            return self._upload_pdf(file_path)
        elif file_ext == '.md':
            return self._upload_markdown(file_path)
        else:
            self.logger.error(f"Unsupported document type: {file_ext}")
            return None

    def _upload_pdf(self, file_path):
        url = urljoin(self.base_url, '/api/v1/pdfs')
        filename = os.path.basename(file_path)

        try:
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'application/pdf')}
                response = self.session.post(url, files=files)
                response.raise_for_status()

                data = response.json()
                if data.get('success'):
                    self.logger.info(f"Successfully uploaded PDF: {filename}")
                    return data.get('data')
                else:
                    self.logger.error(f"Failed to upload PDF: {data}")
                    return None

        except Exception as e:
            self.logger.error(f"Error uploading PDF {filename}: {e}")
            return None

    def _upload_markdown(self, file_path):
        url = urljoin(self.base_url, '/api/v1/documents')
        filename = os.path.basename(file_path)
        title = os.path.splitext(filename)[0]

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            payload = {
                'title': title,
                'markdownContent': content,
                'contentType': 'markdown'
            }

            response = self.session.post(url, json=payload)
            response.raise_for_status()

            data = response.json()
            if data.get('success'):
                self.logger.info(f"Successfully uploaded markdown: {filename}")
                return data.get('data')
            else:
                self.logger.error(f"Failed to upload markdown: {data}")
                return None

        except Exception as e:
            self.logger.error(f"Error uploading markdown {filename}: {e}")
            return None

    def _upload_media(self, file_path):
        if not os.path.exists(file_path):
            self.logger.error(f"File not found: {file_path}")
            return None

        url = urljoin(self.base_url, '/api/v1/media')
        filename = os.path.basename(file_path)
        mime_type, _ = mimetypes.guess_type(file_path)

        self.logger.info(f"Uploading media: {filename}")

        try:
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, mime_type)}
                response = self.session.post(url, files=files)
                response.raise_for_status()

                data = response.json()
                if data.get('success'):
                    self.logger.info(
                        f"Successfully uploaded media: {filename}")
                    return data.get('data')
                else:
                    self.logger.error(f"Failed to upload media: {data}")
                    return None

        except Exception as e:
            self.logger.error(f"Error uploading media {filename}: {e}")
            return None

    def _download_item(self, endpoint, save_path, item_type):
        url = urljoin(self.base_url, endpoint)
        self.logger.info(f"Downloading {item_type} to: {save_path}")

        try:
            response = self.session.get(url, stream=True)
            response.raise_for_status()

            os.makedirs(os.path.dirname(save_path) if os.path.dirname(
                save_path) else '.', exist_ok=True)

            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            self.logger.info(
                f"Successfully downloaded {item_type}: {save_path}")
            return True

        except Exception as e:
            self.logger.error(f"Error downloading {item_type}: {e}")
            return False

    def _delete_item(self, endpoint, item_type):
        url = urljoin(self.base_url, endpoint)
        self.logger.info(f"Deleting {item_type}...")

        try:
            response = self.session.delete(url)
            response.raise_for_status()

            data = response.json()
            if data.get('success'):
                self.logger.info(f"Successfully deleted {item_type}")
                return True
            else:
                self.logger.error(f"Failed to delete {item_type}: {data}")
                return False

        except Exception as e:
            self.logger.error(f"Error deleting {item_type}: {e}")
            return False
