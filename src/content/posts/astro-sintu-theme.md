---
title: So stellst du einen statischen Blog mit Astro kostenlos online
pubDate: '2026-04-20'
author: jin
draft: false
categories:
- Technik
tags:
- Blog
- Astro
- Typecho
- Migration
---

![as-3.avif](https://user0102.cn.imgto.link/public/20260422/as-3.avif)

Bei dynamischen Blogs hatte ich immer Sorge, den Server zu vergessen oder bei Programm-Updates auf Probleme zu stoßen. Als ich statische Blogs entdeckte, wurde mir klar: Das ist die ideale Lösung. Nachdem ich Hugo, Hexo und Astro verglichen hatte, entschied ich mich letztlich für Astro.

### Vorteile statischer Blogs

1. **Kostenloses Hosting** – Abgesehen von der Domain bieten große Tech-Konzerne Einzelentwicklern kostenloses Hosting an.
2. **Null Wartung** – Die Artikel liegen auf deinem eigenen Rechner. Solange die Hosting-Plattform nicht eingestellt wird, läuft dein Blog für immer.
3. **Vorgerendert** – Statische Blogs erzeugen vor dem Deployment reine HTML/CSS/JS-Dateien – kein Backend nötig.
4. **CDN-kompatibel** – Da alles statische Dateien sind, verteilst du sie auf globale Edge-Knoten, sodass Nutzer weltweit millisekundenschnell laden.

### Warum Astro?

1. **Static-First** – Erzeugt reine HTML-Dateien, keine Datenbank oder Server erforderlich.
2. **Hervorragende Performance** – Standardmäßig null JavaScript, extrem schnelles Laden.
3. **Hohe Flexibilität** – Unterstützt Markdown, MDX und gemischte Frameworks.
4. **Aktives Ökosystem** – Lebendige Community, umfassende Dokumentation, reichhaltige Plugin-Bibliothek.

### Das Sintu-Einspalter-Theme für Astro

Dieses Astro-Einspalter-Vorlagen-Theme habe ich selbst designt und gebaut. Vor Kurzem habe ich es von Typecho nach Astro migrieren lassen – Hermes hat das übernommen. Bei der Migration habe ich einige Funktionen aufgewertet, und der Code ist jetzt um ein Drittel schlanker als zuvor. Ich nutze die Gelegenheit, um anzumerken: Die Verbreitung von KI hat früher komplexe Aufgaben enorm vereinfacht – die Entwicklungsgeschwindigkeit war fast göttlich, die Codequalität nahezu perfekt, und sie bringt mich unendlich nah an das Niveau eines genialen Programmierers heran 😂.

#### Funktionshighlights

1. **Perfekte Performance** – Millisekunden-Ladezeit, Google Lighthouse erreicht auf Mobilgeräten und Desktop jeweils 100 Punkte.
2. **Dark Mode** – Neben dem Logo habe ich einen Schalter für den Dark Mode eingebaut.
3. **Thumbnail-Hover-Zoom** – Neben dem Vergrößern führt ein Klick auf das Bild zur Artikelseite.
4. **Keine Vorschaubilder auf Mobilgeräten** – Steuert den Ressourcen-Ladeprozess je nach Bildschirmgröße, spart Bandbreite.
5. **Aliyun OSS-Bildverarbeitung** – Bilder werden über OSS verarbeitet, Parameter werden nach dem HTML-Rendering hinzugefügt, spart Bandbreite.
6. **Performance-Optimierung** – CSS wird über Vite gebündelt, Bilder mit Lazy Loading.
7. **Responsive Design** – Perfekte Anpassung an Desktop und Mobilgeräte mit einem einheitlichen Grid-System.
8. **Kommentarfeld** – Integriert über die offizielle Twikoo-Lösung.

### Veröffentlichungs-Workflow

1. Schreibe deinen Markdown-Artikel lokal.
2. Sende eine Nachricht an den Hermes-Agenten, um ins GitHub-Repository zu pushen (oder pushe selbst über GitHub).
3. Tencent EdgeOne, Vercel, Netlify oder Cloudflare Pages ziehen das Update automatisch und bauen es.
4. Automatisch auf globale CDN-Knoten deployed.

### Open Source

Dieses Theme ist Open Source. Wenn es dir gefällt, kannst du den Autor auch unterstützen:

[https://github.com/ezzty/krya-en](https://github.com/ezzty/krya-en)
