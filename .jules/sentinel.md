## 2024-05-22 - Reverse Tabnabbing Vulnerability
**Vulnerability:** External links with `target="_blank"` allow the opened page to access the `window.opener` object, potentially enabling the new page to redirect the original page (Reverse Tabnabbing).
**Learning:** Even internal tool links (like "GitHub") can be a vector if the destination is compromised or if it redirects. Always treat `target="_blank"` as unsafe.
**Prevention:** Enforce `rel="noopener noreferrer"` on all `target="_blank"` links.

## 2025-02-14 - Unbounded Recursive Timers
**Vulnerability:** Recursive `setTimeout` loops without a maximum retry limit can lead to infinite loops if the condition is never met, potentially causing resource exhaustion or denial of service (availability issue).
**Learning:** Reliability is a security concern. When waiting for dependencies or external states, always assume they might never arrive.
**Prevention:** Implement a retry counter and a maximum limit for all recursive asynchronous operations. Fail gracefully with a log message after the limit is reached.
