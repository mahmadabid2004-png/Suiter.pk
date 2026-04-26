// ============================================================
//  firebase-config.js  —  Suiters.pk
//  Replace the values below with YOUR Firebase project config.
//  Get them from: Firebase Console → Project Settings → Your apps
// ============================================================

var firebaseConfig = {
    apiKey:            "AIzaSyDEMO_REPLACE_WITH_YOUR_KEY",
    authDomain:        "suiters-pk.firebaseapp.com",
    projectId:         "suiters-pk",
    storageBucket:     "suiters-pk.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:0000000000000000000000"
};

// ── EmailJS config (from emailjs.com → Your Account → API Keys) ──
var EMAILJS_SERVICE_ID  = "service_REPLACE";   // e.g. service_abc123
var EMAILJS_TEMPLATE_ID = "template_REPLACE";  // e.g. template_xyz789
var EMAILJS_PUBLIC_KEY  = "REPLACE_PUBLIC_KEY"; // e.g. user_xxxxxx

// ── Store owner contact (for payment instructions) ──
var STORE_EASYPAISA  = "0324-5531819";
var STORE_JAZZCASH   = "0324-5531819";
var STORE_BANKNAME   = "HBL Bank";
var STORE_BANKACCT   = "1234-5678-9012-3456";
var STORE_BANKIBAN   = "PK36HABB0000001234567891";
var STORE_BANKNAME2  = "Suiters.pk Official Account";

// ── Initialize Firebase (only if config is set) ──
var firebaseReady = false;
var dbReady = false;

(function () {
    try {
        if (typeof firebase !== 'undefined' &&
            firebaseConfig.apiKey !== "AIzaSyDEMO_REPLACE_WITH_YOUR_KEY") {
            firebase.initializeApp(firebaseConfig);
            firebaseReady = true;
            dbReady = true;
            console.log('[Suiters.pk] Firebase connected ✓');
        } else {
            console.warn('[Suiters.pk] Firebase not configured — running in local mode');
        }
    } catch (e) {
        console.warn('[Suiters.pk] Firebase init failed:', e.message);
    }

    // Always init EmailJS if key set
    try {
        if (typeof emailjs !== 'undefined' &&
            EMAILJS_PUBLIC_KEY !== 'REPLACE_PUBLIC_KEY') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            console.log('[Suiters.pk] EmailJS ready ✓');
        }
    } catch (e) {}
})();
