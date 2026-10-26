// ============================================================
// Small helpers used across every page.
// ============================================================

// Format a number as Naira, e.g. 67500 -> "₦67,500"
const fmt = n => '₦' + Number(n).toLocaleString('en-NG');

// Read a URL query parameter, e.g. param('id') on product.html?id=3 -> "3"
function param(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Escape user-supplied text before putting it into innerHTML.
// Always wrap search terms, names, and addresses with this.
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
