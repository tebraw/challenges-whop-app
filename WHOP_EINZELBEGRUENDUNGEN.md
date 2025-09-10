# 🔑 Whop API-Berechtigungen - Einzelbegründungen

## **📦 PLAN VERWALTUNG**

**plan:create**
Automatische Erstellung von Challenge-spezifischen Produkten (z.B. "30-Day Fitness Winner Package") direkt aus der App. Ermöglicht dynamische Produktgenerierung basierend auf Challenge-Erfolg und Teilnehmerleistung.

**plan:delete** 
Bereinigung abgelaufener Challenge-Produkte und zeitlich begrenzter Angebote. Wichtig für Katalog-Hygiene und Entfernung von nicht mehr relevanten Challenge-Belohnungen nach Kampagnenende.

**plan:stats:read**
Analyse welche Challenge-Produkte am erfolgreichsten sind. ROI-Tracking für Challenge-generierte Verkäufe und Optimierung des Produktmix basierend auf Teilnehmer-Kaufverhalten.

**plan:update**
Dynamische Preisanpassungen für Challenge-Teilnehmer (z.B. 20% Rabatt für aktive Members). Update von Produktbeschreibungen mit Challenge-Erfolgsstatistiken und Performance-Daten.

**plan:waitlist:manage**
Verwaltung exklusiver Produktzugänge für Challenge-Winner. Erstellung von limitierten "Top Performer Only" Produkten und priorisierten Zugängen für erfolgreiche Teilnehmer.

---

## **💰 AFFILIATE & REVENUE**

**company:balance:read**
Anzeige des aktuellen Guthabens im Company Owner Dashboard. Transparenz über durch Challenges generierte Einnahmen und verfügbare Mittel für Belohnungsauszahlungen.

**payment:basic:read**
Tracking aller Challenge-bezogenen Transaktionen für Revenue-Sharing-Berechnung. Ermöglicht automatische Berechnung der 10-20% App-Provision von Challenge-generierten Verkäufen.

**payment:charge**
Abwicklung von Premium Challenge-Features und In-App-Käufen. Automatische Berechnung und Einzug der App-Service-Gebühren für erweiterte Analytics und Automatisierungsfunktionen.

**affiliate:create**
Aufbau eines Challenge-basierten Affiliate-Systems. Automatische Registrierung von Challenge-Teilnehmern als Affiliates für empfohlene Produkte zur Maximierung der Community-Monetarisierung.

**affiliate:update**
Performance-basierte Anpassung von Affiliate-Provisionen. Bonus-Provisionen für Challenge-Winner und dynamische Provisionsstrukturen basierend auf Teilnehmer-Engagement und Verkaufsleistung.

**payout:destination:read**
Verwaltung von Auszahlungszielen für Challenge-Winner-Belohnungen. Setup multipler Auszahlungskonten für verschiedene Challenge-Typen und internationale Teilnehmer.

**payout:transfer:funds**
Automatische Auszahlung von Challenge-Gewinnen an erfolgreiche Teilnehmer. Sofortige Belohnungsverteilung und Revenue-Share-Auszahlungen an Top-Performer ohne manuelle Intervention.

---

## **👥 MITGLIEDERVERWALTUNG**

**member:basic:read**
Verifizierung der Mitgliedschaftsberechtigung für Challenge-Teilnahme. Zugriffskontrolle für Premium-Challenges und personalisierte Challenge-Empfehlungen basierend auf Membership-Level.

**member:manage**
Verwaltung Challenge-spezifischer Mitgliedschaftsupgrades. Automatische Beförderung zu "Elite Member" Status nach Challenge-Erfolgen und Verwaltung von Community-Hierarchien.

**company:authorized_user:read**
Identifikation von Company Owners und Team-Mitgliedern für Admin-Zugriff. Multi-User-Management für große Studios mit mehreren Challenge-Managern und delegierten Administratoren.

---

## **📊 ANALYTICS & STATISTIKEN**

**stats:read**
Comprehensive Company-Performance-Analyse für Challenge-Optimierung. ROI-Berechnung, Conversion-Tracking und Benchmarking gegen Industry-Standards zur datengetriebenen Strategieentwicklung.

**company:log:read**
Audit-Trail für alle Challenge-bezogenen Aktivitäten und Transaktionen. Wichtig für Troubleshooting, Compliance-Dokumentation und transparente Nachverfolgung aller automatisierten Prozesse.

---

## **🎯 GESAMTZWECK**
Challenge-App ermöglicht Company Owners automatisierte Community-Monetarisierung durch gamifizierte Engagement-Strategien. Revenue-Sharing-Modell zwischen App (10-20%), Company Owner (70-80%) und Teilnehmern (Affiliate-Provisionen) schafft nachhaltiges Wachstum für alle Beteiligten im Whop-Ökosystem.
