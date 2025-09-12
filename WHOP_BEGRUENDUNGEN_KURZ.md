# 🔑 Whop API-Berechtigungen - Kurze Begründungen (1-2 Sätze)

## **📦 PLAN VERWALTUNG**

**plan:create**
Automatische Erstellung von Challenge-spezifischen Produkten wie "Fitness Winner Packages" direkt aus der App. Ermöglicht dynamische Belohnungserstellung basierend auf Challenge-Erfolg.

**plan:delete**
Bereinigung abgelaufener Challenge-Produkte und zeitlich begrenzter Angebote nach Kampagnenende. Wichtig für sauberen Produktkatalog und Entfernung irrelevanter Inhalte.

**plan:stats:read**
Analyse welche Challenge-Produkte am erfolgreichsten verkauft werden. ROI-Tracking für Challenge-generierte Verkäufe zur Optimierung des Produktangebots.

**plan:update**
Dynamische Preisanpassungen für Challenge-Teilnehmer (z.B. 20% Rabatt für aktive Members). Update von Produktbeschreibungen mit aktuellen Challenge-Statistiken.

**plan:waitlist:manage**
Verwaltung exklusiver Produktzugänge für Challenge-Winner und Top-Performer. Erstellung limitierter "Elite Member Only" Produkte mit priorisiertem Zugang.

---

## **💰 AFFILIATE & REVENUE**

**company:balance:read**
Anzeige des aktuellen Guthabens im Company Owner Dashboard. Transparenz über durch Challenges generierte Einnahmen und verfügbare Mittel.

**payment:basic:read**
Tracking aller Challenge-bezogenen Transaktionen für Revenue-Sharing-Berechnung. Automatische Berechnung der 10-20% App-Provision von Challenge-Verkäufen.

**payment:charge**
Abwicklung von Premium Challenge-Features und In-App-Käufen. Automatische Berechnung der App-Service-Gebühren für erweiterte Funktionen.

**affiliate:create**
Aufbau eines Challenge-basierten Affiliate-Systems für Community-Monetarisierung. Automatische Registrierung von Challenge-Teilnehmern als Affiliates für Produktempfehlungen.

**affiliate:update**
Performance-basierte Anpassung von Affiliate-Provisionen für Challenge-Winner. Bonus-Provisionen und dynamische Strukturen basierend auf Teilnehmer-Engagement.

**payout:destination:read**
Verwaltung von Auszahlungszielen für Challenge-Winner-Belohnungen. Setup multipler Auszahlungskonten für verschiedene Challenge-Typen.

**payout:transfer:funds**
Automatische Auszahlung von Challenge-Gewinnen an erfolgreiche Teilnehmer. Sofortige Belohnungsverteilung ohne manuelle Intervention erforderlich.

---

## **👥 MITGLIEDERVERWALTUNG**

**member:basic:read**
Verifizierung der Mitgliedschaftsberechtigung für Challenge-Teilnahme. Zugriffskontrolle für Premium-Challenges basierend auf Membership-Level.

**member:manage**
Verwaltung Challenge-spezifischer Mitgliedschaftsupgrades. Automatische Beförderung zu "Elite Member" Status nach Challenge-Erfolgen.

**company:authorized_user:read**
Identifikation von Company Owners und Team-Mitgliedern für Admin-Zugriff. Multi-User-Management für große Studios mit mehreren Challenge-Managern.

---

## **📊 ANALYTICS & STATISTIKEN**

**stats:read**
Comprehensive Company-Performance-Analyse für Challenge-Optimierung. ROI-Berechnung und Benchmarking zur datengetriebenen Strategieentwicklung.

**company:log:read**
Audit-Trail für alle Challenge-bezogenen Aktivitäten und Transaktionen. Wichtig für Troubleshooting und transparente Nachverfolgung automatisierter Prozesse.
