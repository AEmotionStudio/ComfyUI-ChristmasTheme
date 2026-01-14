## 2024-05-22 - Reverse Tabnabbing Vulnerability
**Vulnerability:** External links with `target="_blank"` allow the opened page to access the `window.opener` object, potentially enabling the new page to redirect the original page (Reverse Tabnabbing).
**Learning:** Even internal tool links (like "GitHub") can be a vector if the destination is compromised or if it redirects. Always treat `target="_blank"` as unsafe.
**Prevention:** Enforce `rel="noopener noreferrer"` on all `target="_blank"` links.
