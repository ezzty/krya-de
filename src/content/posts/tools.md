---
title: Mit KI mache ich mir nie wieder Sorgen, ob die Tür offen ist
pubDate: '2026-04-29'
author: jin
draft: false
categories:
- Technik
tags:
- KI
- Home Assistant
- Smart Home
- Tools
---

Du bist unterwegs und plötzlich denkst du: Hab ich die Tür zugemacht?

Ich bin mir sicher, viele kennen dieses mulmige Gefühl. Mir geht es jedenfalls so. Jedes Mal, wenn ich das Haus verlasse, spule ich die Erinnerung immer wieder ab: Habe ich wirklich abgeschlossen? Manchmal war ich schon aus der Nachbarschaft raus und bin trotzdem nochmal zurückgerannt.

Um das Problem zu lösen, habe ich mir eine „Toolbox“-Seite gebaut, die alle Informationen über mein Zuhause bündelt – Türstatus, Temperatur, Router-Infos – und von überall abrufbar ist.

Die Geschichte beginnt mit einem Bildhosting-Dienst.

![948.avif](https://user0102.cn.imgto.link/public/20260429/948.avif)

### Der Anfang: Bildhosting

Ich schreibe einen Blog und muss ab und zu Bilder per Markdown einfügen. Fremde Bildhosting-Dienste waren mir immer suspekt. Mein eigener Alibaba-Cloud-OSS-Client war mir zu umständlich. Ich habe nie eine webbasierte Lösung gefunden, die sich wirklich mühelos anfühlte.

Jetzt, wo ich Hermes Agent habe, wollte ich das Beste daraus machen. Ich habe ihn gebeten, mir einen Bildhosting-Dienst zu bauen, damit ich Bilder direkt vom Handy hochladen kann.

Die Umsetzung war simpel:

Schritt eins: Ich habe meine Anforderung formuliert – einen privaten Bildhost mit Alibaba Cloud OSS und Passwortschutz, um Missbrauch zu verhindern. Die KI empfahl Alibaba Cloud Function Compute als Backend, das Frontend konnte überall gehostet werden.

Ich habe nur eines gemacht: die API-Zugangsdaten für Alibaba Cloud OSS bereitgestellt.

Den Rest hat die KI erledigt.

Zufällig hat Xiaomi gerade Milliarden von Gratis-Tokens an Entwickler verschenkt, und ich konnte welche ergattern. Das war auch eine gute Gelegenheit, das MiMo-v2.5-pro-Modell zu testen. Minuten nachdem ich die Anweisung gegeben hatte, hatte es sowohl den Frontend- als auch den Backend-Code fertig und bat mich, das Backend auf den Server hochzuladen. Nach ein paar Runden Debuggen war die OSS-Bild-Upload-Seite einsatzbereit.

Als die Seite online war, fand ich sie aber zu schlicht. Könnte ich sie nicht umfangreicher machen?

Also habe ich gleich eine „Toolbox“ gebaut.

### Die Toolbox

Ich habe die Informationen kombiniert, die ich täglich brauche, und zuerst Aktien- und Kryptowährungskurse mit den APIs von Tencent Finance und OKX eingebaut.

Diese Tools waren extrem einfach, weil alle Daten von externen APIs kommen. Als Nächstes wollte ich etwas Anspruchsvolleres ausprobieren.

Was ich sehen wollte:

1. Ob die Tür zu Hause geschlossen ist (dafür brauchte ich Docker, um Home Assistant mit dem Xiaomi-miot-Plugin zu installieren)
2. Router-Status
3. Server-Status

Mein Heimnetzwerk läuft auf einem Linux-Mini-PC, und ich habe auch eine Linux-Umgebung im öffentlichen Internet. Aber der öffentliche Server kann nicht auf mein Heimnetzwerk zugreifen. Die KI schlug mehrere Ansätze vor, und ich entschied mich dafür, Daten aus dem Heimnetzwerk zu sammeln und an den öffentlichen Server zu pushen.

### Technische Umsetzung

Der Kern des gesamten Systems ist das Sammeln und Pushen von Daten.

**Heimstatus**

Home Assistant verbindet verschiedene Smart-Geräte: Türschlösser, Temperatur-/Feuchtigkeitssensoren, Luftreiniger und mehr.

Ich habe ein lokales Sammelskript geschrieben, das jede Minute Daten von der Home-Assistant-API abruft und auf den öffentlichen Server hochlädt.

Der Türstatus wird von einem Tür-/Fenstersensor erfasst, der über einen Magneten erkennt, ob die Tür offen oder geschlossen ist. Temperatur- und Feuchtigkeitssensoren sind draußen, drinnen und im Serverschrank angebracht, sodass ich die Umgebung zu Hause jederzeit überwachen kann.

**Router-Status**

Der Router läuft mit OpenWrt. Über die LuCI-Web-API kann ich CPU-Temperatur, Betriebszeit, Anzahl der Online-Nutzer und andere Informationen abrufen. Ich habe ein Shell-Skript geschrieben, das alle 5 Minuten Daten sammelt und per SCP hochlädt.

**Server-Status**

Der Server-Status ist noch einfacher – ich lese direkt Systemdateien aus für CPU-Temperatur, Speichernutzung, Festplattenplatz und andere Metriken.

### Das Ergebnis

Jetzt, wenn ich die Toolbox-Seite öffne, sehe ich:

- **Heimstatus**: Ob die Tür geschlossen ist, Innen-/Außentemperatur, Schranktemperatur
- **Marktentwicklung**: Kurse von Xiaomi, Tesla und Gold
- **Krypto**: Echtzeitkurse von BTC und ETH
- **Router-Status**: CPU-Temperatur, Anzahl der Online-Nutzer
- **Homelab-Status**: Server-CPU, Speicher und Festplattennutzung
- **Weltzeituhr**: Uhrzeit in Peking, London und New York
- **Tägliches Gedicht**: Ein zufälliges klassisches chinesisches Gedicht

Die ganze Seite unterstützt auch PWA, kann also auf dem Handy-Startbildschirm abgelegt werden und funktioniert wie eine native App.

### Das Beste daraus machen

Der Wert dieser Toolbox liegt darin, Informationen, die über verschiedene Plattformen verstreut sind, an einem Ort zu bündeln.

Früher musste ich für die Türkontrolle die Mi-Home-App öffnen. Für den Router-Status den Browser und die IP-Adresse eingeben. Für Aktienkurse eine Trading-App öffnen.

Jetzt erledigt eine Seite alles.

Und weil ich sie selbst gebaut habe, kann ich jederzeit neue Funktionen hinzufügen. Zum Beispiel könnte ich später noch Wettervorhersagen, Paketverfolgung oder Kalendererinnerungen einbauen.

Aber ehrlich gesagt, mir fallen gerade keine weiteren Funktionen ein, die ich brauche. So ist es erstmal gut genug.
