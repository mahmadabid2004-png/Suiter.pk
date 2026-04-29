// ============================================================
//  firebase-config.js  —  Suiters.pk
// ============================================================

// ── Firebase config (REAL KEYS) ───────────────────────────────
var firebaseConfig = {
    apiKey:            "AIzaSyCCYyvlQnNzW6RVR3J5MjbtCrFgMv2-6C8",
    authDomain:        "suiters-pk.firebaseapp.com",
    projectId:         "suiters-pk",
    storageBucket:     "suiters-pk.firebasestorage.app",
    messagingSenderId: "357726426615",
    appId:             "1:357726426615:web:012d4debdd6bd163f5caf2",
    measurementId:     "G-TYQZ8RK50J",
    // ── Realtime Database URL ────────────────────────────────
    // Go to Firebase Console → Realtime Database → copy the URL shown
    // It looks like: https://suiters-pk-default-rtdb.firebaseio.com
    databaseURL:       "https://suiters-pk-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// ── EmailJS Setup Guide ──────────────────────────────────────
//
//  HOW TO SET UP EMAIL NOTIFICATIONS (Free — 200 emails/month):
//
//  STEP 1: Sign up at https://www.emailjs.com  (use zaynabrehann@gmail.com)
//
//  STEP 2: Add Email Service
//    → Dashboard → "Email Services" → "Add New Service" → choose Gmail
//    → Connect zaynabrehann@gmail.com → click "Create Service"
//    → Copy the Service ID  (e.g. service_abc1234)  → paste into EMAILJS_SERVICE_ID below
//
//  STEP 3: Create CUSTOMER template (order received confirmation)
//    → Dashboard → "Email Templates" → "Create New Template"
//    → Subject:  "Order Received – {{order_id}} | Suiters.pk"
//    → Body (paste this):
//
//       Hi {{to_name}},
//       Your order {{order_id}} has been received on Suiters.pk!
//       Items: {{order_items}}
//       Total: {{order_total}}
//       Payment: {{pay_method}}
//       We will confirm your order once payment is verified.
//       – Suiters.pk Team
//
//    → In "To Email" field type:  {{to_email}}
//    → Save → Copy Template ID (e.g. template_xyz789) → paste into EMAILJS_TEMPLATE_ID below
//
//  STEP 4: Create ADMIN template (new order alert to store owner)
//    → "Create New Template"
//    → Subject:  "🛍️ New Order {{order_id}} – Rs.{{order_total}} via {{pay_method}}"
//    → Body:
//
//       New order on Suiters.pk!
//       Order ID: {{order_id}}
//       Customer: {{customer_name}} | {{customer_phone}} | {{customer_city}}
//       Address: {{customer_address}}
//       Items: {{order_items}}
//       Total: {{order_total}}
//       Payment: {{pay_method}}
//
//    → In "To Email" type:  {{to_email}}
//    → Save → Copy Template ID → paste into EMAILJS_ADMIN_TEMPLATE_ID below
//
//  STEP 5: Get your Public Key
//    → Account → "API Keys" → copy Public Key → paste into EMAILJS_PUBLIC_KEY below
//
// ────────────────────────────────────────────────────────────

var EMAILJS_SERVICE_ID       = "service_7l1g2hb";   // from Step 2
var EMAILJS_TEMPLATE_ID      = "template_por8lc4";  // customer template — Step 3
var EMAILJS_ADMIN_TEMPLATE_ID = "template_yz4dorl"; // admin alert template — Step 4
var EMAILJS_PUBLIC_KEY       = "J1zs9Cu6A5qp7IBvQ"; // from Step 5

// ── Initialize Firebase ──────────────────────────────────────
var firebaseReady = false;
var dbReady = false;

(function () {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            firebaseReady = true;
            dbReady = true;
            console.log('[Suiters.pk] Firebase connected ✓');
        } else {
            console.warn('[Suiters.pk] Firebase SDK not loaded — running in local mode');
        }
    } catch (e) {
        console.warn('[Suiters.pk] Firebase init failed:', e.message);
    }

    // Init EmailJS if public key is set
    try {
        if (typeof emailjs !== 'undefined' &&
            EMAILJS_PUBLIC_KEY !== 'REPLACE_PUBLIC_KEY') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            console.log('[Suiters.pk] EmailJS ready ✓');
        }
    } catch (e) {}
})();
