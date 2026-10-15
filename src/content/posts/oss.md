---
title: "Günstig selbst gehostetes Bild-Hosting mit Alibaba Cloud Function Compute FC + OSS"
description: "Jeder statische Blog braucht einen Drittanbieter-Bild-Hosting – aber welcher davon läuft nicht irgendwann weg? Schwierig. Und wenn du fremden Bild-Hosting nutzt: Die Hotlink-Schutzregeln bestimmst du nicht, der Dienst verschwindet und alle Bilder zeigen 404, die Inhaltsprüfung trifft dich fälschlich, die Free-Tarife verstecken Fallen. Nach vielen Fallstricken habe ich beschlossen, mir selbst einen Bild-Hosting mit extrem niedrigen Nutzungskosten zu bauen. Hauptziel: Geld sparen, ohne Mengenbegrenzung!"
pubDate: 2026-10-14
heroImage: ""
categories:
  - Technik
tags:
  - OSS eigenes Bild-Hosting
  - Alibaba Cloud Funktion oss Hosting
  - Cloud-Funktion FC Bild-Hosting
author: jin
---
![image](https://i.190808.xyz/m/26j13/0f38e9.png)

> Quellcode: https://github.com/ezzty/oss-upload

**Drei Dinge vorweg:**

1. Alle `AccessKey`-Werte, Passwörter, Domains und Bucket-Namen in diesem Artikel sind **Platzhalter** – vor dem Abkopieren durch deine eigenen ersetzen.
2. Der Code ist eine einzelne Node.js-Datei (ca. 380 Zeilen), die Abhängigkeiten werden über eine FC-**Layer** eingespielt, im Business-Code gibt es keine Hardcodings, alles läuft über Umgebungsvariablen.
3. Am Ende dieses Artikels hast du die komplette Kette `Login → Token holen → Hochladen → Markdown-Bildsyntax zurückbekommen` – plus eine ausführbare Abnahmeliste vor dem Go-Live.

---

### 1. Warum eigenes Bild-Hosting

Jeder statische Blog braucht einen Drittanbieter-Bild-Hosting – aber welcher davon läuft nicht irgendwann weg? Schwierig. Und wenn du fremden Bild-Hosting nutzt: Die Hotlink-Schutzregeln bestimmst du nicht, der Dienst verschwindet und alle Bilder zeigen 404, die Inhaltsprüfung trifft dich fälschlich, die Free-Tarife verstecken Fallen.

Nach vielen Fallstricken habe ich beschlossen, mir selbst einen Bild-Hosting mit extrem niedrigen Nutzungskosten zu bauen. Hauptziel: Geld sparen, ohne Mengenbegrenzung!

- **Die Daten liegen im eigenen Account**, jederzeit exportierbar und migrierbar
- **Abrechnung nach Verbrauch** – der Eigenbedarf eines persönlichen Bild-Hostings liegt meist am Rand des Free-Tarifs
- **Sicherheitsrichtlinien selbst festgelegt**: wer hochladen darf, wie groß die Dateien sein dürfen, in welchem Verzeichnis sie liegen und wer sie sehen darf – alles kontrollierbar

Der Preis dafür: Du kümmert dich selbst um Authentifizierung, Schutz gegen Brute-Force und Typvalidierung – diesen Dreck-Arbeit hat dieser Artikel hier schon für dich erledigt.

---

### 2. Architektur und Anfragefluss

```typescript
Browser upload.html
   │  ① POST /login   {user, pass}
   │  ← 200 {token} (gültig 24 h)
   │  ② POST /upload  Authorization: Bearer *** + Bild-Binary
   ▼
Alibaba Cloud Function Compute FC (Node.js 18, HTTP-Trigger)
   │  Authentifizierung / Rate-Limit / Magic-Bytes-Prüfung / Größenprüfung
   │  ③ ossClient.put(key, stream)
   ▼
OSS-Bucket (privat lesbar/schreibbar, kein öffentlicher Lesezugriff)
   │  ④ CDN-Origin-Fetch (internes Netz, kostenlos)
   ▼
https://img.example.com/m/26j13/ab12cd.jpg   ← öffentliche Zugriffsdomain
```

**Drei Design-Entscheidungen:**

- **Bucket auf privat stellen**: Niemand bekommt Direktlink-Leseberechtigung, Bilder sind nur über die an das CDN gebundene Domain erreichbar. Sobald öffentliches Lesen erlaubt ist, wird dein Bucket zur Allmende – andere können ihn auflisten und deinen Traffic kostenlos mitbenutzen.
- **Upload nur nach Login**: Sonst wird deine API-Domain als kostenloses Bild-Hosting missbraucht, Kosten und Speicher laufen vollständig aus dem Ruder.
- **Business-Code berührt keine Schlüssel**: AK/SK existieren nur in Umgebungsvariablen, im Code und Repository sind sie nie zu sehen.

---

### 3. Vorbereitung

#### 3.1 Produkte aktivieren

**Function Compute FC** und **Object Storage OSS** aktivieren (beide pay-as-you-go, keine Vorpächterung).

#### 3.2 Bucket anlegen

- **Name**: weltweit eindeutig, z. B. `my-img`
- **Region**: nahe bei dir/deinen Nutzern, z. B. `Ostchina 1 (Hangzhou)` → `oss-cn-hangzhou`
- **Lese/Schreib-Berechtigung**: **privat** (wichtig)
- **Speichertyp**: Standard-Speicher (für häufig abgerufene Bilder genau richtig; nicht Cold-Storage/Archiv wählen – die haben eine Mindestspeicherdauer und zu frühes Löschen kostet extra)

#### 3.3 RAM-Nutzer anlegen und auf einen Bucket einschränken (**dringend empfohlen**)

Viele Tutorials lassen dich direkt den Hauptaccount-AccessKey verwenden – **mach das nicht**. Ein leaketer Hauptaccount-AK bedeutet, dass der gesamte Alibaba-Cloud-Account kompromittiert ist.

RAM-Konsole → Berechtigungsrichtlinien → Richtlinie erstellen → Tab **JSON**:

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:GetObject",
        "oss:PutObject",
        "oss:DeleteObject",
        "oss:ListObjects",
        "oss:HeadObject"
      ],
      "Resource": [
        "acs:oss:*:*:my-img",
        "acs:oss:*:*:my-img/*"
      ]
    }
  ]
}
```

Richtlinienname `ImageHostSingleBucket`. Danach:

1. RAM → Nutzer → Nutzer anlegen, **"Dauerhaften AccessKey-Zugriff"** aktivieren
2. Diesem Nutzer **ausschließlich** die oben genannte Richtlinie zuweisen
3. AK/SK generieren und **sofort im lokalen Passwortmanager speichern**

**Ein paar bewusste Entscheidungen:**

- **Nicht** `oss:ListBuckets` vergeben – nach einem Leak sieht man nicht einmal, welche Buckets es gibt
- **Nicht** `oss:CopyObject` vergeben – Bild-Hosting braucht keine Kopierberechtigung, so wenig wie möglich vergeben
- **Nicht** `AliyunOSSFullAccess` zuweisen – sonst kann der AK deines Bild-Hostings alle deine Daten-Buckets lesen

#### 3.4 Regeln zur Schlüsselablage

- ❌ Nicht in den Code schreiben, nicht ins Git committen
- ✅ Nur in FC-Umgebungsvariablen ablegen
- Die `.gitignore` im Repo-Root sollte mindestens enthalten:

```
.env
.env.local
*.key
*.pem
*.p12
credentials.json
```

---

### 4. Dependency-Layer vorbereiten

Der Business-Code hängt nur an `ali-oss`. Als Layer gepackt bleibt das Codepaket bei wenigen KB.

#### Variante A: Release-Anhang direkt herunterladen (empfohlen)

Das Projekt hat ein Release veröffentlicht, `layer.zip` und das Codepaket lassen sich direkt herunterladen:

**https://github.com/ezzty/oss-upload/releases/latest**

| Anhang | Größe | Inhalt |
| :--- | :--- | :--- |
| `layer.zip` | 3,25 MB | `ali-oss@6.23.0` samt Abhängigkeiten, insgesamt 2338 Dateien |
| `oss-upload-code.zip` | ca. 6 KB | `index.js` + `package.json`, Funktions-Deploypaket |

**Vorteil**: Keine Node.js-Installation nötig, kein eigenes Zip-Packing, und du vermeidest das Problem, dass dein lokales `npm install` eine neuere SDK-Version zieht als die vom Autor getestete. Der Layer enthält **nur npm-Paketquellcode, keine Schlüssel**.

#### Variante B: Selbst bauen

Wenn du Abhängigkeiten-Versionen tauschen oder den fertigen Paketen nicht vertrauen willst:

```bash
mkdir -p layer-build/nodejs
cd layer-build
npm init -y
npm install ali-oss
# Das Verzeichnis muss genau so aussehen:
#   nodejs/
#     node_modules/
#       ali-oss/
#       ...dessen transitive Abhängigkeiten
cd nodejs && zip -r ../layer.zip node_modules && cd ..
```

#### Hochladen

**FC-Konsole → Layer-Verwaltung → Layer erstellen:**

- Name: `oss-upload-deps`
- Runtime: **Node.js 18**
- `layer.zip` hochladen

> Der Layer muss nur einmal angelegt werden. Für später: neue `ali-oss`-Version packen, als neue Layer-Version veröffentlichen, Funktion darauf umstellen – Business-Code bleibt unverändert.

---

### 5. Funktion deployen

### 5.1 Business-Code besorgen

**Empfohlen: direkt den Release-Anhang nutzen**: https://github.com/ezzty/oss-upload/releases/latest, `oss-upload-code.zip` (ca. 6 KB) herunterladen – entpackt hast du das fertige Deploypaket.

Wenn du selbst packst, dürfen im Zip-Root **nur diese zwei Dateien** liegen (kein Unterordner, sonst findet der Handler `index.handler` nicht):

```
code.zip
├── index.js        ← Business-Quellcode
└── package.json    ← deklariert die Abhängigkeiten (nur zur Referenz, zur Laufzeit kommt alles aus dem Layer)
```

```bash
zip code.zip index.js package.json
```

#### 5.2 Funktion anlegen

- Runtime: **Node.js 18**
- Handler: `index.handler`
- Spezifikation: **0,05 vCPU / 128 MB RAM / 512 MB Festplattenplatz** (kleinste Spezifikation, die in der Praxis reicht)
- **Layer**: gerade erstellten `oss-upload-deps` binden

> Denk an den Speicher: Der Code liest den kompletten Body in den Speicher (`bodyBuf`), beim Base64-Decoding entsteht zusätzlich eine Kopie. **128 MB reichen für normale Bilder**, aber wenn du das Upload-Limit auf 20 MB anhebst und regelmäßig große Bilder knapp darunter hochlädst, muss der Speicher mitsteigen.

#### 5.3 Umgebungsvariablen (8 Pflichtfelder, ohne jedes einzelne startet nichts)

Der Code prüft sie zu Beginn nacheinander, bei Fehlern direkt `process.exit(1)` – die Funktion liefert 500 und im Log steht `❌ FATAL: Missing required environment variable: X`.

**8 Pflichtfelder** (im Code steht das in `requiredEnvVars`):

- **`AUTH_USER`** `admin` – Login-Benutzername
- **`AUTH_PASS`** `<starkes Passwort setzen>` – Login-Passwort, eine lange Zufallssequenz
- **`JWT_SECRET`** `<zufälliger String, mindestens 32 Zeichen>` – Signaturschlüssel für den Token
- **`OSS_ACCESS_KEY_ID`** `LTAIxxxxxxxxxxxxxxxx` – AK des RAM-Nutzers
- **`OSS_ACCESS_KEY_SECRET`** `<dein AccessKey Secret>` – SK des RAM-Nutzers
- **`OSS_BUCKET`** `my-img` – Bucket-Name
- **`OSS_REGION`** `oss-cn-hangzhou` – Region-ID des Buckets
- **`CDN_DOMAIN`** `https://img.example.com` – **muss das Protokoll voranhaben**, sonst schlägt der Start fehl

**1 optionales Feld:**

- **`ALLOWED_ORIGINS`** `example.com,myblog.net` – erlaubte CORS-Origin, kommagetrennt. Ohne das Feld startet es auch; es wird **nur ausgewertet, wenn Code-level CORS aktiviert ist** (standardmäßig spiegelt die Plattform das `Origin` direkt wider, `isValidOrigin` wird gar nicht aufgerufen). Wenn du Code-level CORS einschaltest, muss es gesetzt sein – sonst blockiert der Fallback-Wert `example.com` jeden Browser-Upload.

![image](https://i.190808.xyz/m/26j13/f09581.png)

Zufallswerte erzeugen:

```bash
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 24   # AUTH_PASS
```

> `CDN_DOMAIN` muss mit `http://` oder `https://` beginnen – der Code prüft das explizit, ein vergessenes Protokoll beendet den Start sofort.

#### 5.4 Eigene Domain binden

FC-Konsole → Domain-Verwaltung → Domain hinzufügen, CNAME und Zertifikat nach Anleitung einrichten. Dann hast du eine API-Adresse wie `https://api.example.com`.

---

### 6. Frontend-Seite

`upload.html` ist eine Single-File-Frontend-Datei, die wirfst du einfach ins Verzeichnis deiner eigenen Website.

**Einen Punkt musst du ändern** – suche `_FC_PARTS`:

```javascript
// Auf deine eigene Function-Compute-Domain ändern
const _FC_PARTS = ['https://', 'api.example.com'];
```

**Das Größenlimit muss zum Backend passen** (Standard beidseits 20 MB):

```javascript
if (file.size > 20 * 1024 * 1024) { /* abfangen */ }
```

Frontend und Backend haben je eine Sperre, **maßgeblich ist die engere**. Nur das Frontend anpassen, nicht das Backend: große Dateien werden serverseitig mit 413 abgelehnt. Nur das Backend, nicht das Frontend: der Nutzer wird im Browser schon gesperrt und schickt gar nichts los.

---

### 7. Tiefer einsteigen? Die Kerndetails stehen im README des Quellcodes

Das war der komplette Ablauf für eigenes Bild-Hosting. **Warum der Code so geschrieben ist, die Details jeder Schutzschicht und die vollständige Abnahmeliste** stehen im README des Quellcode-Repos, falls du sie brauchst:

**https://github.com/ezzty/oss-upload** → `README.md`, Abschnitte „🧩 Kernimplementierung (Code-Level)“ und „🧪 Abnahme vor dem Go-Live“

Dort steht, was hier nicht ausgeführt wurde:

- **Token-Struktur und vier Sicherheitspunkte** (HMAC-Signatur, Constant-Time-Vergleich, Grenzen des Anti-Replay-Schutzes)
- **Magic-Bytes-Nachschlagetabelle** (Dateikopf-Bytes für JPEG / PNG / GIF / WebP / BMP)
- **Dreifache Größenprüfung**, 4 KB-Obergrenze für den Login-Body, warum IP-Brute-Force-Schutz zwingend ein `Map` braucht (Prototype-Pollution per `X-Forwarded-For: __proto__` im Praxistest)
- **FC-Event-Format-Kompatibilität und Body-Decoding** (inkl. zwei großer Fallstricke: lazy Decoding, uncodiertes Binary darf nicht als UTF-8 decodiert werden)
- **Sendemethode des Frontends** (iOS Safari verliert den Body von `xhr.send(File)` – stattdessen ArrayBuffer verwenden)
- **HTTP-Trigger und die drei Arten von CORS** (inkl. einer Klarstellung: in der FC-Konsole gibt es gar keinen Haken für „Cross-Origin erlauben")
- **OSS-Bildverarbeitung** (Praxistest 1,89 MB → 81 KB, 96 % gespart)
- **Vollständige Go-Live-Abnahmeliste** (Sonden-Befehle + OSS-Prüfskript + Security-Checkliste)
- **Schnellreferenz typischer Fallstricke** (Symptom → Ursache → Lösung, inkl. schwieriger Fälle wie iOS verlorener Body und falsche Magic-Bytes-Erkennung)

> Im Blogbeitrag geht es nur darum, **„warum selbst hosten, wie bekomme ich es lauffähig, was muss ich beachten"** klarzumachen – für die eigentliche Deployment-Arbeit ist das README die vollständige technische Dokumentation.

---

### 8. Kosten

Pay-as-you-go, drei Blöcke:

| Posten | Abrechnung | Größenordnung |
| --- | --- | --- |
| **FC-Rechenzeit** | Rechen-CU (vCPU + RAM × Dauer) + Anzahl Aufrufe | Es gibt ein Free-Tarif, persönliche Bild-Hostings liegen meist knapp darunter |
| **OSS-Speicher** | Yuan/GB/Monat | Standard-Speicher ca. **0,09–0,12 Yuan/GB/Monat** |
| **OSS-Anfragen** | pro Aufruf | extrem gering, vernachlässigbar |
| **Traffic** | Yuan/GB | siehe unten |

**Traffic ist der Hauptposten der Rechnung und am einfachsten zu optimieren:**

- **Upload nach OSS: kostenlos**
- **OSS internes Netz (FC ↔ OSS in derselben Region): kostenlos**
- **OSS Ausgang aus dem öffentlichen Netz: kostenpflichtig** (Größenordnung ca. 0,5 Yuan/GB, je nach Zeitfenster und Region)
- **Über CDN: der CDN-Origin-Fetch läuft über das interne Netz und ist kostenlos** – abgerechnet wird nur der CDN-Traffic

**Fazit: Bild-Hosting muss hinter ein CDN hängen** – das beschleunigt und umgeht zugleich die OSS-Gebühr für Ausgangsverkehr. Außerdem: FC und OSS **müssen in derselben Region** liegen, sonst läuft es über das öffentliche Netz, ist langsamer und erzeugt möglicherweise zusätzliche Kosten.

Im eigenen Praxistest: bei ein paar Dutzend Bildern im Monat kostet das Ganze etwa 1 Yuan pro Monat.

---

### 9. Wartung und Updates

**Business-Code ändern (z. B. die Form der Bild-URLs):**

1. Lokales `index.js` anpassen
2. `zip code.zip index.js package.json`
3. Konsole → Code-Deployment → Hochladen → Deployen
4. **README-Abnahme-Sonden laufen lassen und bestätigen, dass die neue Version aktiv ist**

**Frontend ändern:**

1. `upload.html` anpassen
2. Auf die Website hochladen, am besten `Cache-Control: no-cache` setzen – sonst bekommen Nutzer womöglich die alte Version

**Abhängigkeiten upgraden:**

1. Neu `npm install ali-oss` und `layer.zip` neu packen
2. Im Konsole die neue Layer-Version veröffentlichen
3. Funktion auf die neue Layer-Version umstellen

**Schlüssel tauschen (regelmäßig machen):**

1. In RAM neuen AK/SK erzeugen
2. FC-Umgebungsvariablen aktualisieren → deployen
3. Nachdem der Dienst wieder normal läuft, **den alten AK in der RAM-Konsole deaktivieren**

---

### 10. Referenzen

- Quellcode: https://github.com/ezzty/oss-upload
- [Alibaba-Cloud-Function-Compute-Dokumentation](https://help.aliyun.com/zh/functioncompute/)
- [Alibaba-Cloud-OSS-Preisübersicht](https://www.aliyun.com/price/detail/oss)
- [Abrechnungsbeschreibung Function Compute](https://help.aliyun.com/zh/functioncompute/billing-overview-of-fc)
