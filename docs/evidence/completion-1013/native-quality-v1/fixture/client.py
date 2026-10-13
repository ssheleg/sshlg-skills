import logging
import google.auth
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)
credentials, project = google.auth.default()
logger.info("Using the attached runtime service account")
transport = Request()


def access_token():
    credentials.refresh(transport)
    logger.info("Refreshed Google access token: %s", credentials.token)
    return credentials.token
