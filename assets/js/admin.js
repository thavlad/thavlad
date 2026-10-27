/**
 * ShopNG - Dedicated Admin UI & Logic Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Route Protection
    await API.admin.check();
    initTabs();
    await loadAnalytics();
    await loadOrders();
    await loadProducts();
    await loadCustomers();
    await loadPromos();
    await loadReviews();
    await loadAuditLogs();
    setupEventListeners();
  } catch (err) {
    alert('Access Restricted: Please log in with admin privileges.');
    window.location.replace('login.html');
  }
});

// Navigation Tabs
function initTabs() {
  const tabs = document.querySelectorAll('.admin-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.remove('hidden');
    });
  });
}

// Load Analytics
async function loadAnalytics() {
  const data = await API.admin.getAnalytics();
  document.getElementById('stat-revenue').textContent = `₦${data.totalRevenue.toLocaleString()}`;
  document.getElementById('stat-orders').textContent = data.totalOrders;
  document.getElementById('stat-aov').textContent = `₦${data.aov.toLocaleString()}`;
  document.getElementById('stat-lowstock').textContent = data.lowStockCount;
}

// Load Orders Table
async function loadOrders() {
  const statusFilter = document.getElementById('order-status-filter')?.value || 'all';
  const searchQuery = document.getElementById('order-search-input')?.value || '';
  const orders = await API.admin.listOrders(statusFilter, searchQuery);

  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">No orders found.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.email || 'Guest'}</td>
      <td>${new Date(o.date).toLocaleDateString()}</td>
      <td>₦${(o.total || 0).toLocaleString()}</td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" class="status-select status-${o.status.toLowerCase()}">
          <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
      <td><button onclick="viewOrderDetails('${o.id}')" class="btn btn-sm btn-secondary">View</button></td>
    </tr>
  `).join('');
}

// Load Products
async function loadProducts() {
  const showDeleted = document.getElementById('toggle-trash-view')?.checked || false;
  const products = await API.admin.listProducts(showDeleted);
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  tbody.innerHTML = products.map(p => `
    <tr class="${p.status === 'deleted' ? 'row-deleted' : ''}">
      <td>${p.emoji || '📦'} ${p.name} ${p.stock <= 5 && p.status !== 'deleted' ? '<span class="badge badge-warning">Low Stock</span>' : ''}</td>
      <td>${p.category}</td>
      <td>₦${p.price.toLocaleString()}</td>
      <td>
        <input type="number" value="${p.stock}" min="0" onchange="updateProductStock(${p.id}, this.value)" class="stock-input" ${p.status === 'deleted' ? 'disabled' : ''} />
      </td>
      <td>
        ${p.status === 'deleted' 
          ? `<button onclick="restoreProduct(${p.id})" class="btn btn-sm btn-success">Restore</button>`
          : `<button onclick="softDeleteProduct(${p.id})" class="btn btn-sm btn-danger">Trash</button>`
        }
      </td>
    </tr>
  `).join('');
}

// Actions
async function updateOrderStatus(id, status) {
  await API.admin.updateOrderStatus(id, status);
  await loadAnalytics();
}

async function updateProductStock(id, stock) {
  await API.admin.updateStock(id, stock);
  await loadAnalytics();
}

async function softDeleteProduct(id) {
  if (confirm('Move product to trash?')) {
    await API.admin.softDeleteProduct(id);
    await loadProducts();
    await loadAnalytics();
  }
}

async function restoreProduct(id) {
  await API.admin.restoreProduct(id);
  await loadProducts();
  await loadAnalytics();
}

// Customers & Promos
async function loadCustomers() {
  const customers = await API.admin.listCustomers();
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.orderCount}</td>
      <td>₦${c.ltv.toLocaleString()}</td>
      <td>
        <button onclick="toggleCustomerStatus(${c.id})" class="btn btn-sm ${c.active ? 'btn-danger' : 'btn-success'}">
          ${c.active ? 'Suspend' : 'Activate'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleCustomerStatus(id) {
  await API.admin.toggleUserStatus(id);
  await loadCustomers();
}

async function loadPromos() {
  const promos = await API.admin.listPromos();
  const container = document.getElementById('promos-list');
  if (!container) return;

  container.innerHTML = promos.map(p => `
    <div class="promo-card">
      <strong>${p.code}</strong> - ${p.discountPercent}% Off (Min. Spend: ₦${p.minSpend.toLocaleString()})
      <button onclick="deletePromo('${p.code}')" class="btn btn-sm btn-danger">Delete</button>
    </div>
  `).join('');
}

async function deletePromo(code) {
  await API.admin.deletePromo(code);
  await loadPromos();
}

async function loadReviews() {
  const reviews = await API.admin.listReviews();
  const container = document.getElementById('reviews-list');
  if (!container) return;

  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <p><strong>${r.userName}</strong> (${r.rating}★): "${r.comment}"</p>
      ${!r.approved ? `<button onclick="approveReview(${r.id})" class="btn btn-sm btn-success">Approve</button>` : '<span class="badge badge-success">Approved</span>'}
      <button onclick="deleteReview(${r.id})" class="btn btn-sm btn-danger">Delete</button>
    </div>
  `).join('');
}

async function approveReview(id) {
  await API.admin.approveReview(id);
  await loadReviews();
}

async function deleteReview(id) {
  await API.admin.deleteReview(id);
  await loadReviews();
}

async function loadAuditLogs() {
  const logs = await API.admin.getAuditLogs();
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${new Date(l.timestamp).toLocaleString()}</td>
      <td>${l.adminEmail}</td>
      <td>${l.action}</td>
    </tr>
  `).join('');
}

function setupEventListeners() {
  document.getElementById('order-status-filter')?.addEventListener('change', loadOrders);
  document.getElementById('order-search-input')?.addEventListener('input', loadOrders);
  document.getElementById('toggle-trash-view')?.addEventListener('change', loadProducts);

  document.getElementById('add-promo-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('promo-code').value.toUpperCase();
    const discountPercent = Number(document.getElementById('promo-discount').value);
    const minSpend = Number(document.getElementById('promo-minspend').value);

    await API.admin.addPromo({ code, discountPercent, minSpend });
    e.target.reset();
    await loadPromos();
  });
}
