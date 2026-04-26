// ============================================================
//  cart.js  —  Suiters.pk  |  Complete Cart Engine
// ============================================================

/* ============================================================
   ADD TO CART
   ============================================================ */
function addToCart(productId, productName, productPrice, productImage) {
    var sizeSelect = document.getElementById('sizeSelect');
    var size = '';

    if (sizeSelect) {
        size = sizeSelect.value;
        if (!size || size === 'Select Size') {
            sizeSelect.style.border = '2px solid coral';
            sizeSelect.style.borderRadius = '4px';
            showToast('Please select a size first!', 'warning');
            setTimeout(function () { sizeSelect.style.border = ''; }, 2000);
            return;
        }
        sizeSelect.style.border = '';
    }

    var cart = getCart();
    var cartKey = size ? (productId + '_' + size) : productId;
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === cartKey) { existing = cart[i]; break; }
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id:        cartKey,
            productId: productId,
            name:      productName,
            price:     productPrice,
            image:     productImage,
            size:      size,
            quantity:  1
        });
    }

    saveCart(cart);
    updateCartBadge();
    showToast(productName + ' added to cart!', 'success');
}

/* ============================================================
   CART STORAGE HELPERS
   ============================================================ */
function getCart() {
    try { return JSON.parse(localStorage.getItem('suiterCart')) || []; }
    catch (e) { return []; }
}

function saveCart(cart) {
    localStorage.setItem('suiterCart', JSON.stringify(cart));
    // also keep old key in sync for backward compatibility
    localStorage.setItem('cart', JSON.stringify(cart));
}

function clearCart() {
    localStorage.removeItem('suiterCart');
    localStorage.removeItem('cart');
}

function getCartTotal() {
    return getCart().reduce(function (s, i) { return s + i.price * i.quantity; }, 0);
}

function getCartCount() {
    return getCart().reduce(function (s, i) { return s + i.quantity; }, 0);
}

/* ============================================================
   CART BADGE (navbar counter)
   ============================================================ */
function updateCartBadge() {
    var count = getCartCount();
    document.querySelectorAll('.cart-badge').forEach(function (b) {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function showToast(msg, type) {
    var existing = document.getElementById('sk-toast');
    if (existing) existing.remove();

    var t = document.createElement('div');
    t.id = 'sk-toast';
    t.innerHTML = '<span>' + msg + '</span>';

    var bg = type === 'success' ? '#2e7d32'
           : type === 'warning' ? '#e65100'
           : type === 'error'   ? '#b71c1c'
           : '#37474f';

    t.style.cssText =
        'position:fixed;bottom:28px;right:28px;z-index:99999;' +
        'padding:14px 22px;border-radius:10px;' +
        'font-family:Poppins,sans-serif;font-size:14px;font-weight:600;color:#fff;' +
        'background:' + bg + ';box-shadow:0 6px 24px rgba(0,0,0,0.3);' +
        'transform:translateY(100px);opacity:0;transition:all 0.4s cubic-bezier(.175,.885,.32,1.275);';

    document.body.appendChild(t);
    setTimeout(function () { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; }, 30);
    setTimeout(function () {
        t.style.transform = 'translateY(100px)'; t.style.opacity = '0';
        setTimeout(function () { if (t.parentNode) t.remove(); }, 400);
    }, 3200);
}

/* ============================================================
   AUTH HELPERS  (works with or without Firebase)
   ============================================================ */
function getCurrentUser() {
    try {
        var u = localStorage.getItem('sk_user');
        return u ? JSON.parse(u) : null;
    } catch (e) { return null; }
}

function updateNavUser() {
    var user = getCurrentUser();
    var loginLinks = document.querySelectorAll('.nav-login-link');
    var logoutLinks = document.querySelectorAll('.nav-logout-link');
    var userNames = document.querySelectorAll('.nav-username');

    loginLinks.forEach(function (el) { el.style.display = user ? 'none' : ''; });
    logoutLinks.forEach(function (el) { el.style.display = user ? '' : 'none'; });
    userNames.forEach(function (el) { el.textContent = user ? user.name.split(' ')[0] : ''; });
}

/* ============================================================
   INIT on every page
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    // migrate old cart key
    if (!localStorage.getItem('suiterCart') && localStorage.getItem('cart')) {
        localStorage.setItem('suiterCart', localStorage.getItem('cart'));
    }
    updateCartBadge();
    updateNavUser();
});
