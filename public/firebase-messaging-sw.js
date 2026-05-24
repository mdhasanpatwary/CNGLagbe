importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBLMWfLTGrCAwymO7_UsJnBO6WdtslZhVo",
  authDomain: "cnglagbe-fc603.firebaseapp.com",
  projectId: "cnglagbe-fc603",
  storageBucket: "cnglagbe-fc603.firebasestorage.app",
  messagingSenderId: "81068169673",
  appId: "1:81068169673:web:5c0458ac653e0518c23018"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'নতুন রাইড রিকুয়েস্ট! 🛺';
  const notificationOptions = {
    body: payload.notification?.body || 'ভাড়া এবং দূরত্বের বিবরণ দেখতে ক্লিক করুন',
    icon: '/driver_app_icon.png',
    badge: '/icons/driver-icon-512.svg',
    data: payload.data,
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL('/driver/dashboard', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
