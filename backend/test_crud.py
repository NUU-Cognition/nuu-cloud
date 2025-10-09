from datetime import datetime
from constants import (
    MarkdownRow,
    MediaRow,
    PDFRow,
    UsersRow,
    TABLES
)
from functions import dataclass_to_dict
from crud_operations import CRUDOperations

TEST_ID = 2

TEST_USER = UsersRow(
    userID=TEST_ID,
    email="test@gmail.com",
    user_creation_date=datetime.now()
)

TEST_PDF = PDFRow(
    pdfID=TEST_ID,
    userID=TEST_ID,
    pdf_file=b"%PDF-1.4 example content",
    pdf_size=len(b"%PDF-1.4 example content"),
    pdf_upload_date=datetime.now()
)

TEST_MD = MarkdownRow(
    markdownID=TEST_ID,
    pdfID=TEST_ID,
    markdown_string="# Hello, World!",
    markdown_size=len("# Hello, World!"),
    markdown_upload_date=datetime.now()
)

TEST_MEDIA = MediaRow(
    mediaID=TEST_ID,
    pdfID=TEST_ID,
    media_name="image.png",
    media_file=b"\x89PNG\r\n\x1a\n example content",
    media_type="png",
    media_size=len(b"\x89PNG\r\n\x1a\n example content"),
    media_upload_date=datetime.now()
)

# ----------------------------------------------------------------- #

# Example usage:

test_user = dataclass_to_dict(TEST_USER)
test_pdf = dataclass_to_dict(TEST_PDF)
test_md = dataclass_to_dict(TEST_MD)
test_media = dataclass_to_dict(TEST_MEDIA)

crud = CRUDOperations()

# Inserting

crud.insert_row(TABLES.USERS.value, test_user)
crud.insert_row(TABLES.PDF.value, test_pdf)
crud.insert_row(TABLES.MARKDOWN.value, test_md)
crud.insert_row(TABLES.MEDIA.value, test_media)

# Deleting

# crud.delete_all_rows()

# Check if operation successful
crud.print_all_tables()
