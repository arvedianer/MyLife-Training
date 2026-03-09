// utils/notifications.ts

export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export function sendLocalNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        try {
            // If we have a service worker, use it to show the notification (required for mobile PWA)
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200],
                    ...options,
                } as any);
            });
        } catch (e) {
            // Fallback to standard desktop notification
            new Notification(title, {
                icon: '/icons/icon-192x192.png',
                ...options,
            });
        }
    }
}

// Broski motivation quotes for rest timers
export const broskiQuotes = [
    "Bro, Pause ist um! Ran ans Eisen!",
    "Genug am Handy gechillt. Nächster Satz!",
    "Die Gains warten nicht, Bro. Let's go!",
    "Zeit ist abgelaufen. Zeig was du drauf hast!",
    "Schluss mit lustig, das Gewicht bewegt sich nicht von allein!",
    "Hol dir die PR, Bro. Der Timer sagt GO!",
];

export function getRandomBroskiQuote() {
    return broskiQuotes[Math.floor(Math.random() * broskiQuotes.length)];
}
