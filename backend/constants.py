from enum import Enum  
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


class TABLES(Enum):
    USERS = "users"
    PDF = "pdf"
    MARKDOWN = "markdown"
    MEDIA = "media"

class COLUMNS(Enum):
    USER_ID = "userID"
    USER_EMAIL = "email"
    USER_CREATION_DATE = "user_creation_date"

    PDF_ID = "pdfID"
    PDF_FILE = "pdf_file"
    PDF_SIZE = "pdf_size"
    PDF_UPLOAD_DATE = "pdf_upload_date"

    MARKDOWN_ID = "markdownID"
    MARKDOWN_STRING = "markdown_string"
    MARKDOWN_SIZE = "markdown_size"
    MARKDOWN_UPLOAD_DATE = "markdown_upload_date"

    MEDIA_ID = "mediaID"
    MEDIA_NAME = "media_name"
    MEDIA_FILE = "media_file"
    MEDIA_TYPE = "media_type"
    MEDIA_SIZE = "media_size"
    MEDIA_UPLOAD_DATE = "media_upload_date"

@dataclass
class UsersRow:
    userID: int
    email: Optional[str]
    user_creation_date: Optional[datetime]

@dataclass
class PDFRow:
    pdfID: int
    userID: int
    pdf_file: Optional[bytes]
    pdf_size: Optional[int]
    pdf_upload_date: Optional[datetime]

@dataclass
class MarkdownRow:
    markdownID: int
    pdfID: int
    markdown_string: Optional[str]
    markdown_size: Optional[int]
    markdown_upload_date: Optional[datetime]

@dataclass
class MediaRow:
    mediaID: int
    pdfID: int
    media_name: Optional[str]
    media_file: Optional[bytes]
    media_type: Optional[str]
    media_size: Optional[int]
    media_upload_date: Optional[datetime]