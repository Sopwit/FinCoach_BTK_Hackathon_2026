import sys
import os

_backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.main import app as backend_app

app = backend_app


@app.middleware("http")
async def strip_api_prefix(request, call_next):
    path = request.url.path
    if path.startswith("/api/"):
        request.scope["path"] = path[4:]
        request.scope["root_path"] = "/api"
    elif path == "/api":
        request.scope["path"] = "/"
        request.scope["root_path"] = "/api"
    response = await call_next(request)
    return response
