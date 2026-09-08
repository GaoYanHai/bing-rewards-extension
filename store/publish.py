import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

CLIENT_ID = os.environ["EDGE_CLIENT_ID"]
API_KEY = os.environ["EDGE_API_KEY"]
PRODUCT_ID = os.environ["EDGE_PRODUCT_ID"]
ZIP_PATH = Path(os.environ["EDGE_ZIP_PATH"])
API = "https://api.addons.microsoftedge.microsoft.com"
NOTES = os.environ.get("EDGE_PUBLISH_NOTES") or (
    "Feature update. Do not withdraw the live listing. "
    "Do not change permissions or product name."
)

def headers(content_type=None):
    out = {
        "Authorization": f"ApiKey {API_KEY}",
        "X-ClientID": CLIENT_ID,
    }
    if content_type:
        out["Content-Type"] = content_type
    return out

def request(method, url, data=None, content_type=None, timeout=120):
    req = urllib.request.Request(url, data=data, method=method, headers=headers(content_type))
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "replace")
            loc = resp.headers.get("Location") or resp.headers.get("location") or ""
            return resp.status, dict(resp.headers), body, loc
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        loc = e.headers.get("Location") or e.headers.get("location") or ""
        return e.code, dict(e.headers), body, loc

def operation_id(location):
    loc = (location or "").strip()
    return loc.rstrip("/").split("/")[-1].strip() if loc else ""

def poll(url, label, attempts=24, delay=5):
    last = ""
    for i in range(1, attempts + 1):
        code, _h, body, _loc = request("GET", url)
        last = body
        print(f"{label} poll {i}: HTTP {code} {body}")
        try:
            payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            payload = {}
        status = payload.get("status") or ""
        if status and status != "InProgress":
            return status, payload, body
        if code not in (200, 202):
            return "HttpError", payload, body
        time.sleep(delay)
    return "Timeout", {}, last

print("zip", ZIP_PATH, ZIP_PATH.stat().st_size)
print("product", PRODUCT_ID)
upload_url = f"{API}/v1/products/{PRODUCT_ID}/submissions/draft/package"
code, _h, body, loc = request("POST", upload_url, data=ZIP_PATH.read_bytes(), content_type="application/zip")
print("upload HTTP", code)
print("upload location", loc)
print("upload body", body)
if code not in (200, 202):
    raise SystemExit(f"upload failed: HTTP {code}")
op = operation_id(loc)
if not op:
    raise SystemExit("upload succeeded but no operation ID")
status, _payload, raw = poll(f"{API}/v1/products/{PRODUCT_ID}/submissions/draft/package/operations/{op}", "upload")
if status != "Succeeded":
    raise SystemExit(f"package processing failed: {status} {raw}")

print("package ready, publishing")
pub_url = f"{API}/v1/products/{PRODUCT_ID}/submissions"
code, _h, body, loc = request("POST", pub_url, data=NOTES.encode("utf-8"), content_type="text/plain")
print("publish HTTP", code)
print("publish location", loc)
print("publish body", body)
if code not in (200, 202):
    raise SystemExit(f"publish failed: HTTP {code}")
pop = operation_id(loc)
if not pop:
    print("publish accepted without operation ID")
else:
    status, payload, raw = poll(f"{API}/v1/products/{PRODUCT_ID}/submissions/operations/{pop}", "publish")
    print("publish status", status)
    print("publish result", raw)
    if status != "Succeeded":
        code = payload.get("errorCode") if isinstance(payload, dict) else ""
        if code == "InProgressSubmission":
            print("A submission is already in review. The uploaded package is in the draft.")
            raise SystemExit(3)
        raise SystemExit(f"publish failed: {status} {raw}")
print("DONE")
