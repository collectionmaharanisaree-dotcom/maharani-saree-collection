const SITE_URL = 'https://collectionmaharanisaree-dotcom.github.io/maharani-saree-collection/';
const SUPABASE_URL = 'https://rqzaibfdwczpqfrswcvg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oPs57ONamrOxneH9jsxbvw__PzUetUG';
const WHATSAPP = '919097900814';

const fallbackProducts = [
  {
    id: 1,
    name: 'Saree',
    category: 'Saree',
    price: 867,
    mrp: 1299,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80',
    description: 'Beautiful saree collection for festive and everyday occasions.'
  },
  {
    id: 2,
    name: 'Lehnga',
    category: 'Lehnga',
    price: 1499,
    mrp: 1999,
    image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93d0?auto=format&fit=crop&w=700&q=80',
    description: 'Stylish lehnga collection for weddings and special occasions.'
  },
  {
    id: 3,
    name: 'Suit',
    category: 'Suit',
    price: 999,
    mrp: 1499,
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=700&q=80',
    description: 'Elegant and comfortable suit collection.'
  },
  {
    id: 4,
    name: 'Kurti',
    category: 'Kurti',
    price: 599,
    mrp: 899,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=700&q=80',
    description: 'Trendy kurti collection for everyday style.'
  },
  {
    id: 5,
    name: 'Palazo',
    category: 'Palazo',
    price: 699,
    mrp: 999,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=80',
    description: 'Comfortable and stylish palazo collection.'
  }
];

let products = [...fallbackProducts];
let categories = [];

function rebuildCategories() {
  const labels = {
    Saree: 'Sarees',
    Lehnga: 'Lehngas',
    Suit: 'Suits',
    Kurti: 'Kurtis',
    Palazo: 'Palazo'
  };

  categories = [...new Set(products.map(p => p.category).filter(Boolean))]
    .map(name => ({
      name,
      label: labels[name] || name,
      image: products.find(p => p.category === name)?.image || ''
    }));
}

async function loadProducts() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Products?select=id,name,category,price,mrp,image,description`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Supabase returned an invalid products response');
    }

    products = data.map(p => ({
      ...p,
      price: Number(p.price),
      mrp: Number(p.mrp)
    }));
  } catch (error) {
    products = [...fallbackProducts];
    console.warn('Using fallback products because Supabase could not be loaded.', error);
  }
}

let cart = JSON.parse(localStorage.getItem('maharani-cart') || '[]');

const money = n => `₹${Number(n).toLocaleString('en-IN')}`;
const $ = id => document.getElementById(id);

function saveCart() {
  localStorage.setItem('maharani-cart', JSON.stringify(cart));
}

function renderCategoryFilter() {
  const selected = $('categoryFilter').value || 'All';
  $('categoryFilter').innerHTML = '<option value="All">All</option>' +
    categories.map(c => `<option value="${c.name}">${c.label}</option>`).join('');
  $('categoryFilter').value = categories.some(c => c.name === selected) ? selected : 'All';
}

function renderCategories() {
  $('categoryGrid').innerHTML = categories.map(c => `
    <button class="category-card" data-category="${c.name}">
      <img src="${c.image}" alt="${c.label}" loading="lazy">
      <span>${c.label}</span>
      <b>Explore →</b>
    </button>
  `).join('');

  document.querySelectorAll('.category-card').forEach(b => {
    b.onclick = () => {
      $('categoryFilter').value = b.dataset.category;
      renderProducts();
      $('shop').scrollIntoView({ behavior: 'smooth' });
    };
  });
}

function renderProducts() {
  const term = $('searchInput').value.trim().toLowerCase();
  const category = $('categoryFilter').value;

  const shown = products.filter(p =>
    (category === 'All' || p.category === category) &&
    `${p.name} ${p.category}`.toLowerCase().includes(term)
  );

  $('productGrid').innerHTML = shown.map(p => `
    <article class="product-card">
      <button class="product-image" data-detail="${p.id}" aria-label="View ${p.name} details">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <span class="discount">${Math.round((1 - p.price / p.mrp) * 100)}% off</span>
      </button>

      <div class="product-info">
        <p class="product-category">${p.category}</p>
        <h3>${p.name}</h3>

        <div class="price">
          <strong>${money(p.price)}</strong>
          <del>${money(p.mrp)}</del>
        </div>

        <button class="button button-dark add-button" data-add="${p.id}">
          Add to bag
        </button>
      </div>
    </article>
  `).join('');

  $('noResults').hidden = shown.length > 0;

  document.querySelectorAll('[data-add]').forEach(b => {
    b.onclick = () => addToCart(+b.dataset.add);
  });

  document.querySelectorAll('[data-detail]').forEach(b => {
    b.onclick = () => showDetail(+b.dataset.detail);
  });
}

function addToCart(id) {
  const item = cart.find(x => x.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  saveCart();
  renderCart();
  openDrawer();
  toast('Added to your bag');
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  if (!item) return;

  item.qty += delta;

  if (item.qty < 1) {
    cart = cart.filter(x => x.id !== id);
  }

  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, x) =>
    sum + (products.find(p => p.id === x.id)?.price || 0) * x.qty, 0
  );
}

function renderCart() {
  const count = cart.reduce((sum, x) => sum + x.qty, 0);

  $('cartCount').textContent = count;
  $('cartTotal').textContent = money(cartTotal());

  $('cartItems').innerHTML = cart.length
    ? cart.map(x => {
        const p = products.find(y => y.id === x.id);
        if (!p) return '';

        return `
          <div class="cart-item">
            <img src="${p.image}" alt="">
            <div>
              <strong>${p.name}</strong>
              <small>${money(p.price)} · ${p.category}</small>

              <div class="quantity">
                <button data-change="${p.id}" data-delta="-1">−</button>
                <span>${x.qty}</span>
                <button data-change="${p.id}" data-delta="1">+</button>
                <button class="remove" data-remove="${p.id}">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join('')
    : `
      <div class="empty-cart">
        <span>○</span>
        <p>Your bag is waiting for something beautiful.</p>
        <a href="#shop" id="emptyShop">Explore collection</a>
      </div>
    `;

  document.querySelectorAll('[data-change]').forEach(b => {
    b.onclick = () => changeQty(+b.dataset.change, +b.dataset.delta);
  });

  document.querySelectorAll('[data-remove]').forEach(b => {
    b.onclick = () => {
      cart = cart.filter(x => x.id !== +b.dataset.remove);
      saveCart();
      renderCart();
    };
  });

  const empty = $('emptyShop');
  if (empty) empty.onclick = closeDrawer;
}

function showDetail(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  $('productDetail').innerHTML = `
    <img src="${p.image}" alt="${p.name}">

    <div>
      <p class="eyebrow">${p.category}</p>
      <h2>${p.name}</h2>
      <p>${p.description}</p>

      <div class="price detail-price">
        <strong>${money(p.price)}</strong>
        <del>${money(p.mrp)}</del>
      </div>

      <button class="button button-dark full" data-detail-add="${p.id}">
        Add to bag
      </button>
    </div>
  `;

  $('productDialog').showModal();

  document.querySelector('[data-detail-add]').onclick = () => {
    addToCart(id);
    $('productDialog').close();
  };
}

function openDrawer() {
  $('cartDrawer').classList.add('open');
  $('drawerOverlay').classList.add('open');
  $('cartDrawer').setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  $('cartDrawer').classList.remove('open');
  $('drawerOverlay').classList.remove('open');
  $('cartDrawer').setAttribute('aria-hidden', 'true');
}

function openCheckout() {
  if (!cart.length) {
    return toast('Add a product before checkout');
  }

  $('checkoutItems').textContent =
    cart.reduce((s, x) => s + x.qty, 0);

  $('checkoutTotal').textContent = money(cartTotal());

  $('checkoutDialog').showModal();
}

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');

  setTimeout(() => {
    $('toast').classList.remove('show');
  }, 2400);
}

async function init() {
  await loadProducts();
  rebuildCategories();
  renderCategoryFilter();

  $('qrImage').src =
    `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(SITE_URL)}`;

  $('siteUrl').textContent = SITE_URL;

  renderCategories();
  renderProducts();
  renderCart();

  $('searchInput').oninput = renderProducts;
  $('categoryFilter').onchange = renderProducts;

  $('cartOpen').onclick = openDrawer;
  $('cartClose').onclick = closeDrawer;
  $('drawerOverlay').onclick = closeDrawer;

  $('checkoutOpen').onclick = openCheckout;

  $('dialogClose').onclick = () =>
    $('productDialog').close();

  $('checkoutClose').onclick = () =>
    $('checkoutDialog').close();

  $('orderForm').onsubmit = e => {
    e.preventDefault();

    const data = new FormData(e.target);

    const lines = cart.map(x => {
      const p = products.find(y => y.id === x.id);
      if (!p) return '';

      return `• ${p.name} (${p.category}) × ${x.qty} = ${money(p.price * x.qty)}`;
    }).filter(Boolean).join('\n');

    const message = `Namaste Maharani Saree Collection!

New order request

Customer: ${data.get('name')}
Mobile: ${data.get('mobile')}
Address: ${data.get('address')}
PIN code: ${data.get('pin')}

Selected products:
${lines}

Total amount: ${money(cartTotal())}

Please confirm availability, final price and delivery details.`;

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener'
    );
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDrawer();

      if ($('productDialog').open) {
        $('productDialog').close();
      }

      if ($('checkoutDialog').open) {
        $('checkoutDialog').close();
      }
    }
  });
}

init();
