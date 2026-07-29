function buildServiceWorkerScript(): string {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  return `
const CACHE_NAME = "south-youth-shell-v3";
const SHELL_URLS = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

function isSameOrigin(request) {
  return request.url.startsWith(self.location.origin);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !isSameOrigin(request) || request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
  );
});

const firebaseConfig = ${JSON.stringify(firebaseConfig)};

if (firebaseConfig.apiKey) {
  importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification && payload.notification.title ? payload.notification.title : "Notifikasi";
    const body = payload.notification && payload.notification.body ? payload.notification.body : "";
    const url = payload.fcmOptions && payload.fcmOptions.link ? payload.fcmOptions.link : "/home";

    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      data: { url },
    });
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/home";

    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
        const existing = clientsArr.find((client) => client.url.includes(url));
        if (existing) {
          return existing.focus();
        }
        return self.clients.openWindow(url);
      }),
    );
  });
}
`;
}

export async function GET() {
  return new Response(buildServiceWorkerScript(), {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    },
  });
}
