// components/tour/tourSteps.ts

export interface TourStep {
  id: number;             // 1-based for display
  route: string;          // route to navigate to before showing step
  selector: string;       // CSS selector for spotlight target
  text: string;           // Arved's speech bubble text
  action: 'next' | 'tap'; // 'next' = Weiter button; 'tap' = user taps the highlighted element
}

export const TOUR_STEPS: TourStep[] = [
  // ── DASHBOARD ──
  { id: 1,  route: '/dashboard',            selector: '[data-tour="streak-card"]',          text: 'Das ist dein Dashboard. Streak, Trainingseinheiten und Wochenvolumen — alles sofort sichtbar.',                                                                          action: 'next' },
  { id: 2,  route: '/dashboard',            selector: '[data-tour="workout-cta"]',          text: 'Hier startest du dein Workout. Ich zeige dir was heute im Plan steht — oder du trainierst frei drauf los.',                                                              action: 'next' },
  { id: 3,  route: '/dashboard',            selector: '[data-tour="nav-stats"]',            text: 'Auf Stats siehst du wie du dich langfristig entwickelst.',                                                                                                                 action: 'tap'  },

  // ── STATS ──
  { id: 4,  route: '/stats',                selector: '[data-tour="heatmap"]',              text: 'Die Heatmap zeigt welche Muskelgruppen du in diesem Zeitraum trainiert hast. Gelb = wenig, Lila = Maximum.',                                                             action: 'next' },
  { id: 5,  route: '/stats',                selector: '[data-tour="athlete-score"]',        text: 'Der Athlete Score geht von 0 bis 1000. Fünf Dimensionen — Kraft, Konsistenz, Volumen, Ausdauer, Ausgewogenheit. Keine fake Zahl.',                                       action: 'next' },
  { id: 6,  route: '/stats',                selector: '[data-tour="benchmarks"]',           text: 'Die Vergleiche zeigen wo du im Verhältnis zu anderen Trainierenden stehst — basierend auf deinen echten Lifts.',                                                         action: 'next' },
  { id: 7,  route: '/stats',                selector: '[data-tour="nav-splits"]',           text: 'Jetzt zu deinem Plan.',                                                                                                                                                    action: 'tap'  },

  // ── SPLITS ──
  { id: 8,  route: '/splits',               selector: '[data-tour="active-split-card"]',    text: 'Das ist dein Trainingsplan — generiert auf Basis deiner Antworten. Du kannst ihn komplett anpassen.',                                                                    action: 'next' },
  { id: 9,  route: '/splits',               selector: '[data-tour="active-split-card"]',    text: 'Tippe auf den Plan um die Trainingstage zu sehen.',                                                                                                                        action: 'tap'  },
  { id: 10, route: '/splits/[first-split]', selector: '[data-tour="split-day-card"]',       text: 'Das sind deine Trainingstage. Jeder Tag hat seine Übungen mit optimalen Sets und Wiederholungsbereichen.',                                                               action: 'next' },
  { id: 11, route: '/splits/[first-split]', selector: '[data-tour="split-exercise-list"]',  text: 'Hier siehst du alle Übungen für diesen Tag. Reihenfolge per Drag & Drop änderbar — halte eine Übung gedrückt.',                                                         action: 'next' },

  // ── CHAT ──
  { id: 12, route: '/dashboard',            selector: '[data-tour="coach-bubble"]',         text: 'Und dann noch das hier.',                                                                                                                                                  action: 'tap'  },
  { id: 13, route: '/chat',                 selector: '[data-tour="chat-header"]',          text: 'Das bin ich — Coach Arved. Ich kenn deine Daten, deine PRs, deine verpassten Sessions. Frag mich was du willst.',                                                        action: 'next' },
  { id: 14, route: '/chat',                 selector: '[data-tour="chat-input"]',           text: 'Tippe deine Frage ein oder sprich sie ein. Ich antworte direkt — ohne Filler.',                                                                                           action: 'next' },
  { id: 15, route: '/chat',                 selector: '[data-tour="nav-forum"]',            text: 'Und das Forum.',                                                                                                                                                           action: 'tap'  },

  // ── FORUM ──
  { id: 16, route: '/forum',                selector: '[data-tour="forum-tabs"]',           text: 'General Chat, Freunde, Community. Im Community-Tab siehst du live wer gerade trainiert.',                                                                                 action: 'next' },
  { id: 17, route: '/forum',                selector: '[data-tour="nav-start"]',            text: 'Okay. Jetzt das Wichtigste. Dein erstes Workout.',                                                                                                                         action: 'tap'  },

  // ── WORKOUT ──
  { id: 18, route: '/start',                selector: '[data-tour="start-button"]',         text: 'Das ist dein heutiger Plan. Klick auf Training starten.',                                                                                                                  action: 'tap'  },
  { id: 19, route: '/workout/active',        selector: '[data-tour="workout-exercise-list"]', text: 'Das ist dein aktives Workout. Alle Übungen für heute.',                                                                                                                  action: 'next' },
  { id: 20, route: '/workout/active',        selector: '[data-tour="set-input"]',            text: 'Trag dein Gewicht und Wiederholungen ein. Der Vorschlag basiert auf deinen Daten. Dann Haken setzen — der Rest-Timer startet automatisch.',                              action: 'next' },
  { id: 21, route: '/workout/active',        selector: '[data-tour="finish-button"]',        text: 'Wenn du fertig bist: Training beenden.',                                                                                                                                  action: 'tap'  },

  // ── SUMMARY ──
  { id: 22, route: '/workout/summary',       selector: '[data-tour="summary-stats"]',        text: 'Das ist deine Zusammenfassung — Volumen, PRs, Score-Veränderung. Das bleibt gespeichert.',                                                                               action: 'next' },
  { id: 23, route: '/dashboard',             selector: 'body',                               text: 'Das war alles. Du kennst die App jetzt. Dein echter Plan startet hier.',                                                                                                  action: 'next' },
];
