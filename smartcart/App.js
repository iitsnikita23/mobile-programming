/**
 * SmartCart — "Check before you pay"
 * Anti-scam shopping guardian for Nepal.
 *
 * Single-file React Native app. Zero extra dependencies.
 * Run it instantly:
 *   1. Go to https://snack.expo.dev
 *   2. Replace App.js with this file
 *   3. Open on your phone with the Expo Go app (or use the web preview)
 *
 * Bilingual (नेपाली default + English).
 * Includes: Login page, Home, Scam Check, a working chat Helper,
 * Learn, Community reports, and a Contact Us page.
 * Theme: clean blue + white. Simple custom (dependency-free) icons.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Linking,
  ActivityIndicator,
} from 'react-native';

/* ------------------------------------------------------------------ */
/*  FIREBASE  (Auth + Realtime Database)                               */
/*                                                                     */
/*  REQUIRED — install the package first:                              */
/*    • VS Code / local project:  npx expo install firebase            */
/*    • Expo Snack: open package.json and add  "firebase": "10.14.1"   */
/*                                                                     */
/*  Then in the Firebase console (one time):                          */
/*    • Authentication → Sign-in method → enable "Email/Password".     */
/*    • Realtime Database → Create database → Rules (demo):            */
/*        { "rules": { "reports": { ".read": true, ".write": true }}}  */
/* ------------------------------------------------------------------ */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getDatabase,
  ref as dbRef,
  push,
  query,
  limitToLast,
  onValue,
} from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyC6NXJDSCI6FsuH_E1oOeoQUsIYe9hXLjk',
  authDomain: 'smartcart-6cea7.firebaseapp.com',
  databaseURL: 'https://smartcart-6cea7-default-rtdb.firebaseio.com',
  projectId: 'smartcart-6cea7',
  storageBucket: 'smartcart-6cea7.firebasestorage.app',
  messagingSenderId: '415384301478',
  appId: '1:415384301478:web:e7b32bd5ba8ca229236967',
  measurementId: 'G-KYJXNCV0JQ',
};

// Initialize safely — if Firebase fails at runtime, the app still runs in local mode.
let auth = null;
let db = null;
try {
  const fbApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(fbApp);
  db = getDatabase(fbApp);
} catch (e) {
  console.warn('Firebase unavailable, running in local mode:', e && e.message);
}

/* Friendly, bilingual messages for Firebase auth error codes */
function authError(code, lang) {
  const m = {
    'auth/invalid-email': { en: 'That email address looks invalid.', np: 'इमेल ठेगाना मिलेन।' },
    'auth/email-already-in-use': { en: 'This email already has an account — try logging in.', np: 'यो इमेलमा पहिले नै खाता छ — लग-इन गर्नुहोस्।' },
    'auth/weak-password': { en: 'Password must be at least 6 characters.', np: 'पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।' },
    'auth/missing-password': { en: 'Please enter a password.', np: 'कृपया पासवर्ड हाल्नुहोस्।' },
    'auth/wrong-password': { en: 'Email or password is incorrect.', np: 'इमेल वा पासवर्ड मिलेन।' },
    'auth/user-not-found': { en: 'No account found — try signing up.', np: 'खाता भेटिएन — खाता खोल्नुहोस्।' },
    'auth/invalid-credential': { en: 'Email or password is incorrect.', np: 'इमेल वा पासवर्ड मिलेन।' },
    'auth/too-many-requests': { en: 'Too many attempts. Wait a moment and try again.', np: 'धेरै प्रयास भयो। केहीबेर पछि प्रयास गर्नुहोस्।' },
    'auth/network-request-failed': { en: 'Check your internet connection and try again.', np: 'इन्टरनेट जडान जाँचेर फेरि प्रयास गर्नुहोस्।' },
    'auth/operation-not-allowed': { en: 'Email/Password sign-in is not enabled in Firebase yet.', np: 'Firebase मा Email/Password साइन-इन सक्रिय गरिएको छैन।' },
  };
  return (m[code] && m[code][lang]) || (lang === 'np' ? 'केही गडबड भयो। फेरि प्रयास गर्नुहोस्।' : 'Something went wrong. Please try again.');
}

/* Relative "time ago" label */
function timeAgo(ts, lang) {
  if (!ts) return '';
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return lang === 'np' ? 'अहिले' : 'now';
  const mnt = Math.floor(s / 60);
  if (mnt < 60) return mnt + 'm';
  const h = Math.floor(mnt / 60);
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}

/* ------------------------------------------------------------------ */
/*  THEME — Blue & White                                               */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#F2F7FD',          // soft blue-white
  surface: '#FFFFFF',
  primary: '#1A66D9',     // brand blue
  primaryDeep: '#0D47A1', // deep blue (headers / welcome)
  primarySoft: '#E4EEFC', // pale blue (chips, soft cards)
  accent: '#1A66D9',      // keep accents blue for a clean blue/white look
  ink: '#0F2238',
  muted: '#5B7088',
  border: '#D9E6F5',

  safe: '#1E9E5A',  safeBg: '#DCF5E6',
  warn: '#E08A00',  warnBg: '#FFF3D6',
  danger: '#D63B3B', dangerBg: '#FCE3E3',
  white: '#FFFFFF',
};

const SHADOW = Platform.select({
  ios: { shadowColor: '#0D2A5B', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 4 },
  default: {},
});

/* ------------------------------------------------------------------ */
/*  SIMPLE ICONS — built from plain Views (no extra libraries)         */
/* ------------------------------------------------------------------ */
function Icon({ name, size = 24, color = C.muted }) {
  const box = { width: size, height: size, alignItems: 'center', justifyContent: 'center' };
  const stroke = Math.max(2, size * 0.1);

  switch (name) {
    case 'home':
      return (
        <View style={box}>
          <View style={{
            width: 0, height: 0,
            borderLeftWidth: size * 0.42, borderRightWidth: size * 0.42, borderBottomWidth: size * 0.4,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
          }} />
          <View style={{ width: size * 0.6, height: size * 0.34, backgroundColor: color, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
        </View>
      );
    case 'search':
      return (
        <View style={box}>
          <View style={{ width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderWidth: stroke, borderColor: color }} />
          <View style={{ position: 'absolute', width: size * 0.3, height: stroke, backgroundColor: color, borderRadius: stroke, right: size * 0.1, bottom: size * 0.12, transform: [{ rotate: '45deg' }] }} />
        </View>
      );
    case 'chat':
      return (
        <View style={box}>
          <View style={{ width: size * 0.8, height: size * 0.6, backgroundColor: color, borderRadius: size * 0.18 }} />
          <View style={{ position: 'absolute', bottom: size * 0.14, left: size * 0.24, width: 0, height: 0, borderTopWidth: size * 0.18, borderRightWidth: size * 0.18, borderTopColor: color, borderRightColor: 'transparent' }} />
        </View>
      );
    case 'learn':
      return (
        <View style={box}>
          <View style={{ width: size * 0.72, height: size * 0.56, backgroundColor: color, borderRadius: 3 }} />
          <View style={{ position: 'absolute', width: Math.max(2, size * 0.07), height: size * 0.56, backgroundColor: C.surface }} />
        </View>
      );
    case 'community':
      return (
        <View style={box}>
          <View style={{ position: 'absolute', top: size * 0.12, left: size * 0.16, width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13, backgroundColor: color }} />
          <View style={{ position: 'absolute', top: size * 0.12, right: size * 0.16, width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13, backgroundColor: color }} />
          <View style={{ position: 'absolute', bottom: size * 0.14, width: size * 0.74, height: size * 0.3, borderTopLeftRadius: size * 0.22, borderTopRightRadius: size * 0.22, backgroundColor: color }} />
        </View>
      );
    case 'mail':
      return (
        <View style={box}>
          <View style={{ width: size * 0.78, height: size * 0.56, borderWidth: Math.max(2, size * 0.085), borderColor: color, borderRadius: size * 0.08 }} />
          <View style={{ position: 'absolute', top: size * 0.22, width: 0, height: 0, borderLeftWidth: size * 0.2, borderRightWidth: size * 0.2, borderTopWidth: size * 0.16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: color }} />
        </View>
      );
    case 'shield':
      return (
        <View style={box}>
          <View style={{ width: size * 0.6, height: size * 0.72, backgroundColor: color, borderTopLeftRadius: size * 0.12, borderTopRightRadius: size * 0.12, borderBottomLeftRadius: size * 0.3, borderBottomRightRadius: size * 0.3 }} />
        </View>
      );
    case 'cart':
    default:
      return (
        <View style={box}>
          <View style={{ position: 'absolute', top: size * 0.14, left: size * 0.08, width: size * 0.22, height: Math.max(2, size * 0.09), backgroundColor: color, borderRadius: 2, transform: [{ rotate: '38deg' }] }} />
          <View style={{ position: 'absolute', top: size * 0.3, left: size * 0.22, width: size * 0.58, height: size * 0.32, borderWidth: Math.max(2, size * 0.09), borderColor: color, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: size * 0.1, borderBottomRightRadius: size * 0.1 }} />
          <View style={{ position: 'absolute', bottom: size * 0.06, left: size * 0.34, width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
          <View style={{ position: 'absolute', bottom: size * 0.06, right: size * 0.2, width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
        </View>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  TRANSLATIONS                                                       */
/* ------------------------------------------------------------------ */
const STR = {
  np: {
    appName: 'SmartCart',
    tagline: 'पैसा तिर्नु अघि जाँच गर्नुहोस्',
    welcomeBody: 'अनलाइन किनमेलमा ठगीबाट बच्न तपाईंको साथी। लिंक, बिक्रेता वा सन्देश हाल्नुहोस् — हामी जाँच गर्छौं।',
    chooseLang: 'भाषा छान्नुहोस्',
    continue: 'सुरु गर्नुहोस्',
    // login / signup
    loginTitle: 'स्वागत छ',
    loginSub: 'जारी राख्न लग-इन गर्नुहोस्',
    signupTitle: 'खाता खोल्नुहोस्',
    signupSub: 'सुरक्षित किनमेल सुरु गर्न दर्ता गर्नुहोस्',
    nameLabel: 'तपाईंको नाम',
    emailLabelF: 'इमेल',
    passLabel: 'पासवर्ड (कम्तीमा ६ अक्षर)',
    loginBtn: 'लग-इन गर्नुहोस्',
    signupBtn: 'खाता खोल्नुहोस्',
    guestBtn: 'पाहुनाको रूपमा जारी राख्नुहोस्',
    toSignup: 'नयाँ हुनुहुन्छ? खाता खोल्नुहोस्',
    toLogin: 'पहिले नै खाता छ? लग-इन गर्नुहोस्',
    loginNote: 'तपाईंको खाता Firebase मा सुरक्षित रूपमा राखिन्छ।',
    fillAll: 'कृपया सबै फिल्ड भर्नुहोस्।',
    logout: 'लग-आउट',
    // tabs
    tabHome: 'गृह',
    tabCheck: 'जाँच',
    tabChat: 'सहयोगी',
    tabLearn: 'सिक्नुहोस्',
    tabReport: 'समुदाय',
    tabContact: 'सम्पर्क',
    // home
    hi: 'नमस्ते',
    homeSub: 'आज के जाँच गर्नु छ?',
    fCheck: 'ठगी जाँच',
    fCheckSub: 'लिंक, बिक्रेता वा सन्देश',
    fChat: 'सहयोगी सोध्नुहोस्',
    fChatSub: 'सोझै प्रश्न गर्नुहोस्',
    fLearn: 'सुरक्षित किनमेल',
    fLearnSub: 'छोटा पाठहरू',
    fReport: 'ठगी रिपोर्ट',
    fReportSub: 'समुदायलाई जोगाउनुहोस्',
    fContact: 'सम्पर्क गर्नुहोस्',
    fContactSub: 'सहयोग चाहिन्छ?',
    safetyTip: 'आजको सुझाव',
    tipText: 'अग्रिम पैसा माग्ने बिक्रेतालाई पत्याउनु हुँदैन। सकेसम्म सामान आएपछि तिर्ने (COD) रोज्नुहोस्।',
    // check screen
    checkTitle: 'ठगी जाँच',
    checkHint: 'लिंक, बिक्रेताको नाम, फोन नम्बर वा शंकास्पद सन्देश यहाँ हाल्नुहोस्।',
    placeholder: 'जस्तै: bit.ly/offer99, वा "पहिले पेशकी पठाउनुहोस्"',
    checkBtn: 'जाँच गर्नुहोस्',
    clear: 'मेटाउनुहोस्',
    whyRisky: 'किन जोखिम छ',
    whatToDo: 'अब के गर्ने',
    // verdicts
    vSafe: 'सुरक्षित',
    vWarn: 'होसियार हुनुहोस्',
    vDanger: 'ठगी हुनसक्छ',
    // chat
    chatTitle: 'SmartCart सहयोगी',
    chatHello: 'नमस्ते! म तपाईंको किनमेल सहयोगी हुँ। कुनै लिंक, सन्देश वा फोन नम्बर हाल्नुहोस्, वा "COD सुरक्षित छ?", "कसरी सुरक्षित किन्ने?" जस्ता प्रश्न सोध्नुहोस्।',
    chatPlaceholder: 'सन्देश लेख्नुहोस्...',
    send: 'पठाउनुहोस्',
    // learn
    learnTitle: 'सुरक्षित किनमेल सिक्नुहोस्',
    // report
    reportTitle: 'समुदाय रिपोर्ट',
    reportSub: 'भर्खरै रिपोर्ट गरिएका ठगीहरू',
    reportBtn: 'ठगी रिपोर्ट गर्नुहोस्',
    reportName: 'बिक्रेता/पेज/नम्बर',
    reportWhat: 'के भयो?',
    submit: 'पेश गर्नुहोस्',
    thanks: 'धन्यवाद! तपाईंको रिपोर्टले अरूलाई जोगाउँछ।',
    police: 'नेपाल प्रहरी साइबर ब्यूरोमा रिपोर्ट गर्नुहोस्',
    // contact
    contactTitle: 'हामीलाई सम्पर्क गर्नुहोस्',
    contactSub: 'प्रश्न, सुझाव वा ठगीको गुनासो? हामी सहयोग गर्न तयार छौं।',
    reachUs: 'सम्पर्क विवरण',
    emailLabel: 'इमेल',
    phoneTitle: 'फोन',
    addressLabel: 'ठेगाना',
    addressVal: 'काठमाडौँ, नेपाल',
    hoursLabel: 'समय',
    hoursVal: 'आइत–शुक्र, बिहान १० – बेलुका ६',
    sendMsg: 'सन्देश पठाउनुहोस्',
    cName: 'तपाईंको नाम',
    cMsg: 'तपाईंको सन्देश',
    cSend: 'पठाउनुहोस्',
    cThanks: 'धन्यवाद! हामी चाँडै सम्पर्क गर्नेछौं।',
  },
  en: {
    appName: 'SmartCart',
    tagline: 'Check before you pay',
    welcomeBody: 'Your friend for safe online shopping. Paste a link, seller or message — we’ll check it for scams.',
    chooseLang: 'Choose your language',
    continue: 'Get started',
    loginTitle: 'Welcome',
    loginSub: 'Log in to continue',
    signupTitle: 'Create account',
    signupSub: 'Sign up to start shopping safely',
    nameLabel: 'Your name',
    emailLabelF: 'Email',
    passLabel: 'Password (min 6 characters)',
    loginBtn: 'Log in',
    signupBtn: 'Sign up',
    guestBtn: 'Continue as guest',
    toSignup: 'New here? Create an account',
    toLogin: 'Already have an account? Log in',
    loginNote: 'Your account is stored securely in Firebase.',
    fillAll: 'Please fill in all fields.',
    logout: 'Log out',
    tabHome: 'Home',
    tabCheck: 'Check',
    tabChat: 'Helper',
    tabLearn: 'Learn',
    tabReport: 'Community',
    tabContact: 'Contact',
    hi: 'Hello',
    homeSub: 'What should we check today?',
    fCheck: 'Scam check',
    fCheckSub: 'Link, seller or message',
    fChat: 'Ask the helper',
    fChatSub: 'Just ask a question',
    fLearn: 'Shop safely',
    fLearnSub: 'Short lessons',
    fReport: 'Report a scam',
    fReportSub: 'Protect the community',
    fContact: 'Contact us',
    fContactSub: 'Need help?',
    safetyTip: 'Tip of the day',
    tipText: 'Never trust a seller who asks for advance payment. Choose Cash on Delivery (COD) whenever you can.',
    checkTitle: 'Scam check',
    checkHint: 'Paste a link, seller name, phone number or suspicious message below.',
    placeholder: 'e.g. bit.ly/offer99, or "send advance payment first"',
    checkBtn: 'Check now',
    clear: 'Clear',
    whyRisky: 'Why this looks risky',
    whatToDo: 'What to do next',
    vSafe: 'Safe',
    vWarn: 'Be careful',
    vDanger: 'Likely scam',
    chatTitle: 'SmartCart Helper',
    chatHello: 'Hi! I’m your shopping helper. Paste a link, message or phone number, or ask me things like “Is COD safe?”, “How do I pay safely?” or “Is this seller real?”',
    chatPlaceholder: 'Type a message...',
    send: 'Send',
    learnTitle: 'Learn to shop safely',
    reportTitle: 'Community reports',
    reportSub: 'Recently reported scams',
    reportBtn: 'Report a scam',
    reportName: 'Seller / page / number',
    reportWhat: 'What happened?',
    submit: 'Submit',
    thanks: 'Thank you! Your report helps protect others.',
    police: 'Report to Nepal Police Cyber Bureau',
    contactTitle: 'Contact us',
    contactSub: 'Questions, feedback or a scam to report? We’re here to help.',
    reachUs: 'Reach us',
    emailLabel: 'Email',
    phoneTitle: 'Phone',
    addressLabel: 'Address',
    addressVal: 'Kathmandu, Nepal',
    hoursLabel: 'Hours',
    hoursVal: 'Sun–Fri, 10 AM – 6 PM',
    sendMsg: 'Send us a message',
    cName: 'Your name',
    cMsg: 'Your message',
    cSend: 'Send',
    cThanks: 'Thanks! We’ll get back to you soon.',
  },
};

/* ------------------------------------------------------------------ */
/*  SCAM DETECTION (rule-based)                                        */
/* ------------------------------------------------------------------ */
const REASONS = {
  otp: { np: 'OTP / कोड माग्दैछ — ब्यांक वा कम्पनीले कहिल्यै OTP माग्दैन।', en: 'Asks for your OTP / code — banks never ask for an OTP.' },
  advance: { np: 'सामान पठाउनु अघि अग्रिम/पेशकी माग्दैछ।', en: 'Demands advance / deposit before sending the item.' },
  personalAcc: { np: 'व्यक्तिगत eSewa/Khalti/बैंक खातामा पैसा माग्दैछ।', en: 'Asks you to pay a personal eSewa/Khalti/bank account.' },
  prize: { np: 'इनाम/लटरी जितेको भन्दैछ — चिनिने रणनीति।', en: 'Claims you won a prize/lottery — a classic scam hook.' },
  cheap: { np: 'मूल्य अस्वाभाविक रूपमा सस्तो छ।', en: 'Price is unrealistically low.' },
  shortLink: { np: 'छोटो/लुकेको लिंक — गन्तव्य देखिँदैन।', en: 'Shortened/hidden link — you can’t see where it goes.' },
  urgent: { np: 'हतार गराउँदैछ ("आज मात्र", "तुरुन्तै")।', en: 'Pressures you to hurry ("today only", "act now").' },
  unknownNum: { np: 'अपरिचित नम्बरबाट आएको दाबी।', en: 'Comes from an unknown number/account.' },
  cod: { np: 'सामान आएपछि तिर्ने (COD) उल्लेख — राम्रो संकेत।', en: 'Mentions Cash on Delivery (COD) — a good sign.' },
  trusted: { np: 'चिनिएको/प्रमाणित प्लेटफर्म जस्तो देखिन्छ।', en: 'Looks like a known/verified platform.' },
  none: { np: 'स्पष्ट खतरा देखिएन, तर पूरै पक्का होइन।', en: 'No clear danger found, but not fully verified.' },
};

const ACTIONS = {
  cod: { np: '✅ अग्रिम होइन, सामान आएपछि तिर्ने (COD) रोज्नुहोस्।', en: '✅ Choose Cash on Delivery — don’t pay in advance.' },
  noOtp: { np: '🚫 OTP वा पासवर्ड कसैलाई नदिनुहोस्।', en: '🚫 Never share your OTP or password with anyone.' },
  verify: { np: '🔎 अरूले यो बिक्रेता रिपोर्ट गरेका छन् कि जाँच्नुहोस्।', en: '🔎 Check if others have reported this seller.' },
  trustedPlatform: { np: '🛡️ Daraz जस्ता खरिदार-सुरक्षा भएका प्लेटफर्म प्रयोग गर्नुहोस्।', en: '🛡️ Prefer platforms with buyer protection (e.g. Daraz).' },
  report: { np: '📢 शंका लागे साइबर ब्यूरो (cyberbureau.nepalpolice.gov.np) मा रिपोर्ट गर्नुहोस्।', en: '📢 If unsure, report to the Nepal Police Cyber Bureau.' },
  ok: { np: '👍 ठीक देखिन्छ — तर ठूलो रकम भए COD नै रोज्नुहोस्।', en: '👍 Looks okay — still prefer COD for large amounts.' },
};

function detectRisk(raw) {
  const t = (raw || '').toLowerCase();
  if (!t.trim()) return null;
  const reasons = new Set();
  let danger = 0, warn = 0, safe = 0;

  const has = (...words) => words.some((w) => t.includes(w));

  if (has('otp', 'ओटिपी', 'one time', ' code', 'कोड')) { reasons.add('otp'); danger += 2; }
  if (has('advance', 'deposit', 'पेशकी', 'अग्रिम', 'pesaki', 'agrim', 'pay first', 'पहिले')) { reasons.add('advance'); danger += 2; }
  if (has('personal account', 'esewa', 'khalti', 'send to', 'खातामा', 'account number')) { reasons.add('personalAcc'); warn += 2; }
  if (has('won', 'winner', 'prize', 'lottery', 'lucky', 'इनाम', 'लटरी', 'जित')) { reasons.add('prize'); danger += 2; }
  if (has('90% off', '95% off', 'free iphone', 'सस्तो', 'cheap', 'rs 100', 'rs100', '50% off')) { reasons.add('cheap'); warn += 1; }
  if (has('bit.ly', 'tinyurl', 't.me', 'wa.me', 'shorturl', 'cutt.ly')) { reasons.add('shortLink'); warn += 2; }
  if (has('today only', 'hurry', 'urgent', 'तुरुन्तै', 'आज मात्र', 'limited time')) { reasons.add('urgent'); warn += 1; }
  if (has('cash on delivery', 'cod', 'डेलिभरी', 'delivery मा')) { reasons.add('cod'); safe += 2; }
  if (has('daraz', 'sastodeal', 'verified', 'प्रमाणित')) { reasons.add('trusted'); safe += 2; }

  if (/\b9[678]\d{8}\b/.test(t)) { reasons.add('unknownNum'); warn += 1; }

  let level = 'warn';
  if (danger >= 2) level = 'danger';
  else if (safe >= 2 && danger === 0 && warn === 0) level = 'safe';
  else if (danger === 0 && warn === 0 && safe === 0) { level = 'warn'; reasons.add('none'); }

  const actions = [];
  if (reasons.has('otp')) actions.push('noOtp');
  if (reasons.has('advance') || reasons.has('personalAcc')) actions.push('cod');
  actions.push('verify');
  if (level !== 'safe') actions.push('trustedPlatform');
  if (level === 'danger') actions.push('report');
  if (level === 'safe') actions.push('ok');

  return { level, reasons: [...reasons], actions: [...new Set(actions)] };
}

/* ------------------------------------------------------------------ */
/*  CONVERSATIONAL HELPER                                              */
/*  Decides: greet / thank / explain / scam-check / answer FAQ / help  */
/* ------------------------------------------------------------------ */
const FAQ = [
  {
    k: ['cod', 'cash on delivery', 'डेलिभरी', 'नगद', 'after delivery'],
    np: 'COD (सामान आएपछि तिर्ने) सबैभन्दा सुरक्षित तरिका हो। सामान हात पर्ने बेला मात्र पैसा तिर्नुहोस्। ठूलो रकमको किनमेलमा COD नै रोज्नुहोस्।',
    en: 'COD (Cash on Delivery) is the safest option — you pay only when the item is in your hands. Prefer COD for any large purchase.',
  },
  {
    k: ['otp', 'ओटिपी', 'pin', 'verification code', 'कोड'],
    np: 'OTP वा पासवर्ड कसैलाई नदिनुहोस् — ब्यांक, कुरियर वा कुनै कम्पनीले कहिल्यै OTP माग्दैन। माग्ने जोसुकै भए पनि त्यो ठगी हो।',
    en: 'Never share your OTP or password with anyone. Banks, couriers and real companies never ask for an OTP — anyone who does is a scammer.',
  },
  {
    k: ['pay safely', 'how to pay', 'payment', 'तिर्ने', 'भुक्तानी', 'kasari tirne', 'safe pay'],
    np: 'सुरक्षित किनमेल: (1) सकेसम्म COD रोज्नुहोस्। (2) व्यक्तिगत eSewa/Khalti/बैंक खातामा अग्रिम नपठाउनुहोस्। (3) खरिदार-सुरक्षा भएका प्लेटफर्म प्रयोग गर्नुहोस्।',
    en: 'To pay safely: (1) prefer COD, (2) never send advance money to a personal eSewa/Khalti/bank account, and (3) use platforms with buyer protection.',
  },
  {
    k: ['daraz', 'platform', 'प्लेटफर्म', 'sastodeal', 'which app', 'kun app', 'website safe'],
    np: 'Daraz जस्ता खरिदार-सुरक्षा र रिफन्ड नीति भएका प्लेटफर्म बढी सुरक्षित हुन्छन्। फेसबुक/टिकटक पेजबाट किन्दा रिभ्यु र COD छ कि जाँच्नुहोस्।',
    en: 'Platforms with buyer protection and a refund policy (like Daraz) are safer. When buying from a Facebook/TikTok page, check reviews and whether COD is offered.',
  },
  {
    k: ['report', 'scammed', 'ठगियो', 'रिपोर्ट', 'उजुरी', 'cyber', 'cheated', 'complain'],
    np: 'ठगियो भने: (1) सबै प्रमाण (स्क्रिनसट, नम्बर, रसिद) राख्नुहोस्। (2) "समुदाय" ट्याबमा रिपोर्ट गर्नुहोस्। (3) नेपाल प्रहरी साइबर ब्यूरो — cyberbureau.nepalpolice.gov.np मा उजुरी दिनुहोस्।',
    en: 'If you were scammed: (1) keep all evidence (screenshots, number, receipt), (2) report it in the Community tab, and (3) file a complaint with the Nepal Police Cyber Bureau at cyberbureau.nepalpolice.gov.np.',
  },
  {
    k: ['fake', 'original', 'नक्कली', 'genuine product', 'copy', 'real product'],
    np: 'धेरै सस्तोमा "original" ब्रान्ड बेच्ने प्रायः नक्कली हुन्छन्। मूल्य बजारभन्दा धेरै कम भए, धमिलो फोटो वा रिभ्यु नभए शंका गर्नुहोस्।',
    en: 'Brands sold "original" but very cheap are usually fake. Be suspicious if the price is far below market, the photos are blurry, or there are no reviews.',
  },
  {
    k: ['trust', 'seller safe', 'seller real', 'बिक्रेता', 'genuine seller', 'kasari thaha', 'is this seller'],
    np: 'बिक्रेता भरपर्दो छ कि जाँच्न: (1) पुराना रिभ्यु र फलोअर हेर्नुहोस्। (2) COD दिन्छन् कि सोध्नुहोस्। (3) यहाँको "जाँच" ट्याबमा नाम/नम्बर हालेर हेर्नुहोस्। (4) "समुदाय" मा रिपोर्ट भएको छ कि जाँच्नुहोस्।',
    en: 'To judge a seller: (1) look at old reviews and followers, (2) ask if they offer COD, (3) run their name/number through the Check tab here, and (4) see if they appear in Community reports.',
  },
  {
    k: ['refund', 'return', 'फिर्ता', 'money back', 'paisa firta'],
    np: 'रिफन्ड चाहिए प्लेटफर्मको आधिकारिक एप/वेबसाइटबाट अनुरोध गर्नुहोस्। व्यक्तिगत खातामा पठाएको पैसा फिर्ता पाउन गाह्रो हुन्छ — त्यसैले अग्रिम नपठाउनुहोस्।',
    en: 'For refunds, request through the platform’s official app/website. Money sent to a personal account is hard to recover — which is why you should never pay in advance.',
  },
  {
    k: ['delivery', 'parcel', 'पार्सल', 'सामान आएन', 'not received', 'track'],
    np: '"पार्सल अड्कियो, क्लिक गर्नुहोस्" भन्ने SMS/लिंकमा क्लिक नगर्नुहोस् — यो ठगी हो। ट्र्याकिङ सधैं आधिकारिक कुरियर एप/वेबसाइटबाट मात्र गर्नुहोस्।',
    en: 'Don’t click "your parcel is held, click here" SMS or links — that’s a scam. Always track only through the official courier app/website.',
  },
];

const GREET_RE = /^(hi+|hii+|hey+|hello+|yo|namaste|namaskar|namaskaar|हेलो|नमस्ते|नमस्कार|हाय|हे|hlo)[\s!.,]*$/i;

function looksCheckable(t) {
  return (
    /https?:\/\//.test(t) ||
    /\b(bit\.ly|tinyurl|t\.me|wa\.me|cutt\.ly|shorturl)\b/.test(t) ||
    /\b9[678]\d{8}\b/.test(t) ||
    /(otp|advance|deposit|prize|lottery|\bwon\b|winner|esewa|khalti|account number|खातामा|पेशकी|अग्रिम|इनाम|लटरी|ओटिपी|free iphone|90% off|95% off)/i.test(t)
  );
}

/** Returns { text, level } where level may be a verdict color or null */
function getReply(raw, lang) {
  const t = (raw || '').toLowerCase().trim();
  const L = (en, np) => (lang === 'np' ? np : en);
  if (!t) return { text: STR[lang].chatHello, level: null };

  // 1. Pure greeting
  if (GREET_RE.test(t)) {
    return {
      text: L(
        'Hello! 👋 How can I help you shop safely today? You can paste a link or message to check it, or ask me a question like “Is COD safe?”',
        'नमस्ते! 👋 आज सुरक्षित किनमेलमा कसरी सहयोग गरूँ? कुनै लिंक वा सन्देश जाँच्न हाल्नुहोस्, वा "COD सुरक्षित छ?" जस्तो प्रश्न सोध्नुहोस्।'
      ),
      level: null,
    };
  }

  // 2. Thanks
  if (/\b(thanks|thank you|thx|dhanyabad|धन्यवाद)\b/i.test(t)) {
    return {
      text: L('You’re welcome! Stay safe and shop smart. 🛒', 'स्वागत छ! सुरक्षित रहनुहोस् र समझदारीसँग किनमेल गर्नुहोस्। 🛒'),
      level: null,
    };
  }

  // 3. Guide / help / what can you do
  if (/(guide|help me|how (do|can) you|what can you do|tell me|गाइड|सहयोग|कसरी मद्दत|के गर्न सक्छ|सिकाउ)/i.test(t)) {
    return {
      text: L(
        'Of course — here’s how I can help:\n\n🔍 Paste any link, seller name, phone number or message and I’ll tell you if it looks like a scam.\n💬 Ask questions like “Is COD safe?”, “How do I pay safely?” or “Is this seller real?”\n📢 If something went wrong, I’ll show you how to report it.\n\nWhat would you like to start with?',
        'पक्कै! म यसरी सहयोग गर्न सक्छु:\n\n🔍 कुनै लिंक, बिक्रेता, फोन नम्बर वा सन्देश हाल्नुहोस् — ठगी हो कि भनेर बताउँछु।\n💬 "COD सुरक्षित छ?", "कसरी सुरक्षित किन्ने?", "यो बिक्रेता साँचो हो?" जस्ता प्रश्न सोध्नुहोस्।\n📢 केही बिग्रियो भने कसरी रिपोर्ट गर्ने सिकाउँछु।\n\nकहाँबाट सुरु गरौँ?'
      ),
      level: null,
    };
  }

  // 4. Strong scam signals -> run the detector
  if (looksCheckable(t)) {
    const r = detectRisk(raw);
    if (r) {
      const headers = { safe: '✅ ' + STR[lang].vSafe, warn: '⚠️ ' + STR[lang].vWarn, danger: '⛔ ' + STR[lang].vDanger };
      const why = r.reasons.map((x) => '• ' + REASONS[x][lang]).join('\n');
      const todo = r.actions.map((x) => ACTIONS[x][lang]).join('\n');
      return { text: `${headers[r.level]}\n\n${why}\n\n${todo}`, level: r.level };
    }
  }

  // 5. FAQ knowledge base
  for (const f of FAQ) {
    if (f.k.some((kw) => t.includes(kw))) {
      return { text: f[lang], level: null };
    }
  }

  // 6. Helpful fallback (no more "Be careful" for plain chat!)
  return {
    text: L(
      'I’m here to help you shop safely. You can:\n• Paste a link, seller or message to check it\n• Ask “Is COD safe?”, “How do I pay safely?”, “Is this seller real?”\n• Ask how to report a scam\n\nTry one of those and I’ll guide you. 🛒',
      'म सुरक्षित किनमेलमा सहयोग गर्न यहाँ छु। तपाईं:\n• कुनै लिंक, बिक्रेता वा सन्देश जाँच्न हाल्न सक्नुहुन्छ\n• "COD सुरक्षित छ?", "कसरी सुरक्षित किन्ने?", "बिक्रेता साँचो हो?" सोध्न सक्नुहुन्छ\n• ठगी कसरी रिपोर्ट गर्ने सोध्न सक्नुहुन्छ\n\nएकपटक प्रयास गर्नुहोस्, म सहयोग गर्छु। 🛒'
    ),
    level: null,
  };
}

/* ------------------------------------------------------------------ */
/*  LEARN CONTENT                                                      */
/* ------------------------------------------------------------------ */
const LESSONS = [
  { icon: '👟', np: { t: 'नक्कली ब्रान्डेड जुत्ता', b: 'धेरै सस्तोमा "original" ब्रान्ड बेच्ने पेजहरू प्रायः नक्कली हुन्छन्। मूल्य धेरै कम भए शंका गर्नुहोस्।' }, en: { t: 'Fake branded shoes', b: 'Pages selling "original" brands very cheap are usually fake. Too-low prices are a red flag.' } },
  { icon: '🎁', np: { t: 'इनाम/लटरी सन्देश', b: '"तपाईंले जित्नुभयो!" भन्ने सन्देश ठगी हो। पैसा वा OTP कहिल्यै नदिनुहोस्।' }, en: { t: 'Prize / lottery messages', b: '“You won!” messages are scams. Never pay a fee or share an OTP to claim a prize.' } },
  { icon: '📦', np: { t: 'नक्कली पार्सल SMS', b: '"तपाईंको पार्सल अड्कियो, यहाँ क्लिक गर्नुहोस्" भन्ने लिंकमा क्लिक नगर्नुहोस्।' }, en: { t: 'Fake parcel SMS', b: '“Your parcel is held, click here” links steal your details. Don’t click unknown links.' } },
  { icon: '☎️', np: { t: 'नक्कली कस्टमर केयर', b: 'गुगलमा देखिने नम्बर सधैं सही हुँदैन। आधिकारिक एप/वेबसाइटको नम्बर मात्र प्रयोग गर्नुहोस्।' }, en: { t: 'Fake customer-care numbers', b: 'Numbers from a Google search are often fake. Use the official app/website only.' } },
];

/* ------------------------------------------------------------------ */
/*  SMALL UI PIECES                                                    */
/* ------------------------------------------------------------------ */
function Eyebrow({ children }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

function Pill({ level, label }) {
  const map = { safe: [C.safeBg, C.safe], warn: [C.warnBg, C.warn], danger: [C.dangerBg, C.danger] };
  const [bg, fg] = map[level] || map.warn;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function VerdictCard({ level, t }) {
  const cfg = {
    safe: { bg: C.safe, emoji: '✅', label: t.vSafe },
    warn: { bg: C.warn, emoji: '⚠️', label: t.vWarn },
    danger: { bg: C.danger, emoji: '⛔', label: t.vDanger },
  }[level];
  return (
    <View style={[styles.verdict, { backgroundColor: cfg.bg }, SHADOW]}>
      <Text style={styles.verdictEmoji}>{cfg.emoji}</Text>
      <Text style={styles.verdictLabel}>{cfg.label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREENS                                                            */
/* ------------------------------------------------------------------ */
function Welcome({ lang, setLang, onDone }) {
  const t = STR[lang];
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: C.primaryDeep }]}>
      <View style={styles.welcomeWrap}>
        <View style={styles.brandMark}><Icon name="cart" size={48} color={C.primaryDeep} /></View>
        <Text style={styles.welcomeName}>{t.appName}</Text>
        <Text style={styles.welcomeTag}>“{t.tagline}”</Text>
        <Text style={styles.welcomeBody}>{t.welcomeBody}</Text>

        <Text style={styles.chooseLang}>{t.chooseLang}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'np' && styles.langBtnActive]}
            onPress={() => setLang('np')}
          >
            <Text style={[styles.langBtnText, lang === 'np' && styles.langBtnTextActive]}>नेपाली</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>English</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cta} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{t.continue}  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Login({ lang, t, onGuest }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  const submit = async () => {
    setErr('');
    if (!auth) { onGuest(); return; } // Firebase missing -> proceed locally
    if (!email.trim() || !pass.trim() || (isSignup && !name.trim())) {
      setErr(t.fillAll);
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
      }
      // Success: the App's auth listener routes to the main app.
    } catch (e) {
      setErr(authError(e.code, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.loginWrap} keyboardShouldPersistTaps="handled">
          <View style={styles.loginBadge}><Icon name="cart" size={40} color={C.surface} /></View>
          <Text style={styles.loginTitle}>{isSignup ? t.signupTitle : t.loginTitle}</Text>
          <Text style={styles.loginSub}>{isSignup ? t.signupSub : t.loginSub}</Text>

          <View style={[styles.loginCard, SHADOW]}>
            {isSignup && (
              <>
                <Text style={styles.inputLabel}>{t.nameLabel}</Text>
                <TextInput style={styles.input} placeholder={t.nameLabel} placeholderTextColor={C.muted} value={name} onChangeText={(v) => { setName(v); setErr(''); }} />
              </>
            )}

            <Text style={styles.inputLabel}>{t.emailLabelF}</Text>
            <TextInput style={styles.input} placeholder={t.emailLabelF} placeholderTextColor={C.muted} value={email} onChangeText={(v) => { setEmail(v); setErr(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.inputLabel}>{t.passLabel}</Text>
            <TextInput style={styles.input} placeholder={t.passLabel} placeholderTextColor={C.muted} value={pass} onChangeText={(v) => { setPass(v); setErr(''); }} secureTextEntry />

            {!!err && <Text style={styles.loginErr}>{err}</Text>}

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 6 }, busy && { opacity: 0.7 }]} onPress={submit} activeOpacity={0.85} disabled={busy}>
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>{isSignup ? t.signupBtn : t.loginBtn}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => { setMode(isSignup ? 'login' : 'signup'); setErr(''); }} activeOpacity={0.7}>
              <Text style={styles.linkBtnText}>{isSignup ? t.toLogin : t.toSignup}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.guestBtn} onPress={onGuest} activeOpacity={0.7}>
              <Text style={styles.guestBtnText}>{t.guestBtn}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.loginNote}>{t.loginNote}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ title }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Home({ t, go, name }) {
  const cards = [
    { key: 'check', icon: 'search', title: t.fCheck, sub: t.fCheckSub },
    { key: 'chat', icon: 'chat', title: t.fChat, sub: t.fChatSub },
    { key: 'learn', icon: 'learn', title: t.fLearn, sub: t.fLearnSub },
    { key: 'report', icon: 'community', title: t.fReport, sub: t.fReportSub },
    { key: 'contact', icon: 'mail', title: t.fContact, sub: t.fContactSub },
  ];
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.scrollPad}>
      <View style={styles.hero}>
        <Text style={styles.heroHi}>{t.hi}{name ? `, ${name}` : ''} 👋</Text>
        <Text style={styles.heroSub}>{t.homeSub}</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((c) => (
          <TouchableOpacity key={c.key} style={[styles.gridCard, SHADOW]} onPress={() => go(c.key)} activeOpacity={0.85}>
            <View style={styles.gridIcon}>
              <Icon name={c.icon} size={26} color={C.primary} />
            </View>
            <Text style={styles.gridTitle}>{c.title}</Text>
            <Text style={styles.gridSub}>{c.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.tipCard, SHADOW]}>
        <Eyebrow>{t.safetyTip.toUpperCase()}</Eyebrow>
        <Text style={styles.tipText}>{t.tipText}</Text>
      </View>
    </ScrollView>
  );
}

function CheckScreen({ t, lang }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const run = () => setResult(detectRisk(input));
  const clear = () => { setInput(''); setResult(null); };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
        <Header title={t.checkTitle} />
        <Text style={styles.hint}>{t.checkHint}</Text>

        <TextInput
          style={styles.bigInput}
          placeholder={t.placeholder}
          placeholderTextColor={C.muted}
          value={input}
          onChangeText={setInput}
          multiline
        />

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={run} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t.checkBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={clear}>
            <Text style={styles.ghostBtnText}>{t.clear}</Text>
          </TouchableOpacity>
        </View>

        {result && (
          <View style={{ marginTop: 8 }}>
            <VerdictCard level={result.level} t={t} />

            <View style={[styles.resultCard, SHADOW]}>
              <Eyebrow>{t.whyRisky.toUpperCase()}</Eyebrow>
              {result.reasons.map((r) => (
                <View key={r} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{REASONS[r][lang]}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.resultCard, { backgroundColor: C.primarySoft }]}>
              <Eyebrow>{t.whatToDo.toUpperCase()}</Eyebrow>
              {result.actions.map((a) => (
                <Text key={a} style={styles.actionText}>{ACTIONS[a][lang]}</Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChatScreen({ t, lang }) {
  const [msgs, setMsgs] = useState([{ from: 'bot', text: t.chatHello }]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  const send = () => {
    if (!input.trim()) return;
    const userText = input;
    const reply = getReply(userText, lang);
    setMsgs((m) => [
      ...m,
      { from: 'user', text: userText },
      { from: 'bot', text: reply.text, level: reply.level },
    ]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={t.chatTitle} />
      <ScrollView
        ref={scrollRef}
        style={styles.fill}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {msgs.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              m.from === 'user' ? styles.bubbleUser : styles.bubbleBot,
              m.level === 'danger' && { borderLeftColor: C.danger },
              m.level === 'warn' && { borderLeftColor: C.warn },
              m.level === 'safe' && { borderLeftColor: C.safe },
            ]}
          >
            <Text style={[styles.bubbleText, m.from === 'user' && { color: '#fff' }]}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.chatInputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder={t.chatPlaceholder}
          placeholderTextColor={C.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send} activeOpacity={0.85}>
          <Text style={styles.sendBtnText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function LearnScreen({ t, lang }) {
  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.scrollPad}>
      <Header title={t.learnTitle} />
      {LESSONS.map((l, i) => (
        <View key={i} style={[styles.lessonCard, SHADOW]}>
          <View style={styles.lessonIcon}><Text style={styles.lessonIconText}>{l.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lessonTitle}>{l[lang].t}</Text>
            <Text style={styles.lessonBody}>{l[lang].b}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const SAMPLE_REPORTS = [
  { name: 'FB: Branded Shoes Nepal', what: 'Took advance, never delivered', level: 'danger', ago: '2h' },
  { name: '98XXXXXX21', what: 'Sent fake parcel-delivery SMS', level: 'danger', ago: '5h' },
  { name: 'IG: lucky_draw_offers', what: 'Asked OTP to claim prize', level: 'danger', ago: '1d' },
  { name: 'TikTok: cheap_gadgets_np', what: 'Personal eSewa, no reviews', level: 'warn', ago: '2d' },
];

function ReportScreen({ t, lang }) {
  const [live, setLive] = useState(null);  // null = loading, [] = empty, [...] = data
  const [name, setName] = useState('');
  const [what, setWhat] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Live subscription to the shared "reports" node
  useEffect(() => {
    if (!db) { setLive([]); return; }
    const q = query(dbRef(db, 'reports'), limitToLast(50));
    const unsub = onValue(
      q,
      (snap) => {
        const val = snap.val() || {};
        const arr = Object.entries(val)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setLive(arr);
      },
      () => setLive([]) // on error (e.g. rules), fall back to samples
    );
    return () => unsub();
  }, []);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (db) {
        await push(dbRef(db, 'reports'), {
          name: name.trim(),
          what: what.trim() || '—',
          level: 'danger',
          by: (auth && auth.currentUser) ? (auth.currentUser.displayName || auth.currentUser.email) : 'guest',
          ts: Date.now(),
        });
      }
      setName(''); setWhat(''); setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setName(''); setWhat(''); setDone(true);
      setTimeout(() => setDone(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  const items = live && live.length
    ? live.map((r) => ({ ...r, agoLabel: timeAgo(r.ts, lang) }))
    : SAMPLE_REPORTS.map((r) => ({ ...r, agoLabel: r.ago }));

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
        <Header title={t.reportTitle} />

        <View style={[styles.reportForm, SHADOW]}>
          <Text style={styles.reportFormTitle}>{t.reportBtn}</Text>
          <TextInput style={styles.input} placeholder={t.reportName} placeholderTextColor={C.muted} value={name} onChangeText={setName} />
          <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} placeholder={t.reportWhat} placeholderTextColor={C.muted} value={what} onChangeText={setWhat} multiline />
          <TouchableOpacity style={[styles.primaryBtn, busy && { opacity: 0.7 }]} onPress={submit} activeOpacity={0.85} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{t.submit}</Text>}
          </TouchableOpacity>
          {done && <Text style={styles.thanks}>{t.thanks}</Text>}
        </View>

        <Eyebrow>{t.reportSub.toUpperCase()}</Eyebrow>

        {live === null ? (
          <View style={{ paddingVertical: 28, alignItems: 'center' }}>
            <ActivityIndicator color={C.primary} />
          </View>
        ) : (
          items.map((r, i) => (
            <View key={r.id || i} style={[styles.reportItem, SHADOW]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportName}>{r.name}</Text>
                <Text style={styles.reportWhat}>{r.what}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Pill level={r.level} label={r.level === 'danger' ? t.vDanger : t.vWarn} />
                <Text style={styles.reportAgo}>{r.agoLabel}</Text>
              </View>
            </View>
          ))
        )}

        <View style={[styles.policeCard, SHADOW]}>
          <Text style={styles.policeText}>🚓 {t.police}</Text>
          <Text style={styles.policeLink}>cyberbureau.nepalpolice.gov.np</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ContactScreen({ t }) {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!name.trim() || !msg.trim()) return;
    setName(''); setMsg(''); setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  const rows = [
    { icon: 'mail', label: t.emailLabel, value: 'support@smartcart.np', onPress: () => Linking.openURL('mailto:support@smartcart.np') },
    { icon: 'chat', label: t.phoneTitle, value: '+977 1-4000000', onPress: () => Linking.openURL('tel:+97714000000') },
    { icon: 'home', label: t.addressLabel, value: t.addressVal },
    { icon: 'learn', label: t.hoursLabel, value: t.hoursVal },
  ];

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
        <Header title={t.contactTitle} />
        <Text style={styles.hint}>{t.contactSub}</Text>

        <Eyebrow>{t.reachUs.toUpperCase()}</Eyebrow>
        {rows.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.contactRow, SHADOW]}
            activeOpacity={r.onPress ? 0.7 : 1}
            onPress={r.onPress}
          >
            <View style={styles.contactIcon}><Icon name={r.icon} size={22} color={C.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>{r.label}</Text>
              <Text style={[styles.contactValue, r.onPress && { color: C.primary }]}>{r.value}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.reportForm, SHADOW, { marginTop: 18 }]}>
          <Text style={styles.reportFormTitle}>{t.sendMsg}</Text>
          <TextInput style={styles.input} placeholder={t.cName} placeholderTextColor={C.muted} value={name} onChangeText={setName} />
          <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} placeholder={t.cMsg} placeholderTextColor={C.muted} value={msg} onChangeText={setMsg} multiline />
          <TouchableOpacity style={styles.primaryBtn} onPress={submit} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t.cSend}</Text>
          </TouchableOpacity>
          {done && <Text style={styles.thanks}>{t.cThanks}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB BAR                                                            */
/* ------------------------------------------------------------------ */
function TabBar({ tab, setTab, t }) {
  const tabs = [
    { key: 'home', icon: 'home', label: t.tabHome },
    { key: 'check', icon: 'search', label: t.tabCheck },
    { key: 'chat', icon: 'chat', label: t.tabChat },
    { key: 'learn', icon: 'learn', label: t.tabLearn },
    { key: 'report', icon: 'community', label: t.tabReport },
    { key: 'contact', icon: 'mail', label: t.tabContact },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tb) => {
        const active = tab === tb.key;
        return (
          <TouchableOpacity key={tb.key} style={styles.tabItem} onPress={() => setTab(tb.key)} activeOpacity={0.7}>
            <Icon name={tb.icon} size={22} color={active ? C.primary : C.muted} />
            <Text numberOfLines={1} style={[styles.tabLabel, active && styles.tabLabelActive]}>{tb.label}</Text>
            {active ? <View style={styles.tabDot} /> : <View style={styles.tabDotSpace} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  APP ROOT                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [lang, setLang] = useState('np');   // Nepali default
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);    // Firebase user or null
  const [guest, setGuest] = useState(false);
  const [seenWelcome, setSeenWelcome] = useState(false);
  const [tab, setTab] = useState('home');
  const t = useMemo(() => STR[lang], [lang]);
  const toggleLang = () => setLang((l) => (l === 'np' ? 'en' : 'np'));

  // Auto-login if a Firebase session already exists
  useEffect(() => {
    if (!auth) { setBooting(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setBooting(false);
    });
    return unsub;
  }, []);

  const logout = () => {
    if (auth) signOut(auth).catch(() => {});
    setGuest(false);
    setSeenWelcome(true); // go back to Login, not the splash
    setTab('home');
  };

  const userName = user
    ? (user.displayName || (user.email ? user.email.split('@')[0] : ''))
    : '';

  // 1. Splash while Firebase checks for an existing session
  if (booting) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: C.primaryDeep, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.brandMark}><Icon name="cart" size={48} color={C.primaryDeep} /></View>
        <Text style={styles.welcomeName}>{t.appName}</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: 18 }} />
      </SafeAreaView>
    );
  }

  // 2. Welcome (first launch, before any login)
  if (!user && !guest && !seenWelcome) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <Welcome lang={lang} setLang={setLang} onDone={() => setSeenWelcome(true)} />
      </>
    );
  }

  // 3. Login / sign up
  if (!user && !guest) {
    return <Login lang={lang} t={t} onGuest={() => setGuest(true)} />;
  }

  // 4. Main app
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <View style={styles.topBrandRow}>
          <Icon name="cart" size={24} color={C.surface} />
          <Text style={styles.topBrand}>  {t.appName}</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.langSwitch} onPress={toggleLang}>
            <Text style={styles.langSwitchText}>{lang === 'np' ? 'English' : 'नेपाली'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.langSwitchText}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'home' && <Home t={t} go={setTab} name={userName} />}
      {tab === 'check' && <CheckScreen t={t} lang={lang} />}
      {tab === 'chat' && <ChatScreen t={t} lang={lang} />}
      {tab === 'learn' && <LearnScreen t={t} lang={lang} />}
      {tab === 'report' && <ReportScreen t={t} lang={lang} />}
      {tab === 'contact' && <ContactScreen t={t} />}

      <TabBar tab={tab} setTab={setTab} t={t} />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  scrollPad: { padding: 16, paddingBottom: 32 },

  /* Welcome */
  welcomeWrap: { flex: 1, padding: 28, justifyContent: 'center' },
  brandMark: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
  },
  welcomeName: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: 0.5 },
  welcomeTag: { color: '#9CC4FF', fontSize: 18, fontWeight: '700', marginTop: 4 },
  welcomeBody: { color: '#D6E6FB', fontSize: 16, lineHeight: 24, marginTop: 16 },
  chooseLang: { color: '#9CC4FF', fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginTop: 36, textTransform: 'uppercase' },
  langRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  langBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center',
  },
  langBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  langBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  langBtnTextActive: { color: C.primaryDeep },
  cta: { backgroundColor: C.surface, paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 28 },
  ctaText: { color: C.primaryDeep, fontSize: 19, fontWeight: '800' },

  /* Login */
  loginWrap: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  loginBadge: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },
  loginTitle: { fontSize: 30, fontWeight: '800', color: C.ink, textAlign: 'center' },
  loginSub: { fontSize: 15, color: C.muted, textAlign: 'center', marginTop: 4, marginBottom: 22 },
  loginCard: { backgroundColor: C.surface, borderRadius: 22, padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 6, marginTop: 4 },
  loginErr: { color: C.danger, fontSize: 13, marginTop: 4, marginBottom: 4 },
  guestBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 2 },
  guestBtnText: { color: C.primary, fontSize: 16, fontWeight: '700' },
  linkBtn: { paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { color: C.primary, fontSize: 15, fontWeight: '700' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  loginNote: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },

  /* Top bar */
  topBar: {
    backgroundColor: C.primaryDeep, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14,
  },
  topBrandRow: { flexDirection: 'row', alignItems: 'center' },
  topBrand: { color: '#fff', fontSize: 20, fontWeight: '800' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langSwitch: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  langSwitchText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  /* Header inside screens */
  header: { marginBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.ink },

  /* Home */
  hero: { marginBottom: 18 },
  heroHi: { fontSize: 28, fontWeight: '800', color: C.ink },
  heroSub: { fontSize: 16, color: C.muted, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: {
    width: '48%', backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 14,
  },
  gridIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: C.primarySoft },
  gridTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  gridSub: { fontSize: 13, color: C.muted, marginTop: 2 },

  tipCard: { backgroundColor: C.surface, borderRadius: 20, padding: 18, marginTop: 6, borderLeftWidth: 5, borderLeftColor: C.primary },
  tipText: { fontSize: 16, color: C.ink, lineHeight: 24, marginTop: 6 },

  eyebrow: { fontSize: 12, fontWeight: '800', color: C.primary, letterSpacing: 1.5 },

  /* Check */
  hint: { fontSize: 15, color: C.muted, marginVertical: 12, lineHeight: 22 },
  bigInput: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16, fontSize: 17, color: C.ink,
    minHeight: 110, textAlignVertical: 'top', borderWidth: 1, borderColor: C.border,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: { backgroundColor: C.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  ghostBtn: { paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  ghostBtnText: { color: C.muted, fontSize: 16, fontWeight: '700' },

  verdict: { borderRadius: 24, paddingVertical: 30, alignItems: 'center', marginTop: 16, marginBottom: 12 },
  verdictEmoji: { fontSize: 56 },
  verdictLabel: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 8, letterSpacing: 0.5 },

  resultCard: { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', marginTop: 10 },
  bulletDot: { color: C.primary, fontSize: 18, marginRight: 8, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 15, color: C.ink, lineHeight: 22 },
  actionText: { fontSize: 15, color: C.ink, lineHeight: 24, marginTop: 8 },

  /* Chat */
  bubble: { maxWidth: '86%', borderRadius: 18, padding: 14, marginBottom: 12 },
  bubbleBot: { backgroundColor: C.surface, alignSelf: 'flex-start', borderLeftWidth: 4, borderLeftColor: C.primary },
  bubbleUser: { backgroundColor: C.primary, alignSelf: 'flex-end' },
  bubbleText: { fontSize: 16, color: C.ink, lineHeight: 23 },
  chatInputBar: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  chatInput: { flex: 1, backgroundColor: C.bg, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 16, color: C.ink },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 20 },

  /* Learn */
  lessonCard: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 20, padding: 16, marginTop: 14 },
  lessonIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  lessonIconText: { fontSize: 30 },
  lessonTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  lessonBody: { fontSize: 15, color: C.muted, lineHeight: 22, marginTop: 4 },

  /* Report */
  reportForm: { backgroundColor: C.surface, borderRadius: 20, padding: 18, marginVertical: 14 },
  reportFormTitle: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 12 },
  input: { backgroundColor: C.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.ink, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  thanks: { color: C.safe, fontWeight: '700', marginTop: 10, fontSize: 15 },
  reportItem: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, padding: 16, marginTop: 12, alignItems: 'center' },
  reportName: { fontSize: 16, fontWeight: '700', color: C.ink },
  reportWhat: { fontSize: 14, color: C.muted, marginTop: 2 },
  reportAgo: { fontSize: 12, color: C.muted, marginTop: 6 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '800' },
  policeCard: { backgroundColor: C.primaryDeep, borderRadius: 18, padding: 18, marginTop: 18 },
  policeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  policeLink: { color: '#9CC4FF', fontSize: 14, marginTop: 6 },

  /* Contact */
  contactRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, marginTop: 12 },
  contactIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  contactLabel: { fontSize: 13, color: C.muted, fontWeight: '600' },
  contactValue: { fontSize: 16, color: C.ink, fontWeight: '700', marginTop: 2 },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 10,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLabel: { fontSize: 10, color: C.muted, marginTop: 4, fontWeight: '600' },
  tabLabelActive: { color: C.primary, fontWeight: '800' },
  tabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.primary, marginTop: 3 },
  tabDotSpace: { width: 5, height: 5, marginTop: 3 },
});
