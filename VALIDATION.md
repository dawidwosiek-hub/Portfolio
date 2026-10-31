# Weryfikacja aktualnej wersji — 31.10.2026

Sprawdzono lokalnie:

- `npm run check`: 48 plików, 0 błędów i ostrzeżeń.
- Produkcyjny build Astro: cztery publiczne realizacje, w tym Odwróceni.
- 19 testów Playwright: nawigacja, białe tło, brak poziomego przewijania, obrazy, klawiatura i filmy na telefonie, tablecie i komputerze; filtry, kontekst zapytania, canonical, sitemap oraz obsługa błędów formularza.
- Publikacja Odwróconych w portfolio, na stronie głównej i przy ofercie druku; przekierowanie 301 z dawnego podglądu; zachowanie dziewięciu widoków oryginalnych grafik oraz powiększenie nowego szkicu z podpisem wyjaśniającym jego pochodzenie.
- Zastąpienie odrzuconego otwarcia SHIRO planszą opartą na oryginalnym logo, również w miniaturach i metadanych udostępniania.
- Kontrola wizualna nowego otwarcia SHIRO, szkicu Odwróconych i układu czterech realizacji. Kadry sprawdzono na 390 i 1440 px; testy obejmują także 768 px.
- Formularz bez konfiguracji pocztowej przygotowuje wiadomość w programie pocztowym. Scenariusze API są symulowane; testy nie potwierdzają rzeczywistego doręczenia poczty.

Końcowy build używa `SITE_URL=https://nadx.pl`. Zmiany są przeznaczone do gałęzi wdrożeniowej `nadx-site`. Bezpośrednia kontrola strony produkcyjnej w tym środowisku jest blokowana przez proxy (403 przy zestawianiu tunelu HTTPS); wynik lokalnych testów nie potwierdza zakończenia wdrożenia na Render.

Statystyki, opinie, logotypy klientów i porównania nadal pojawiają się wyłącznie po uzupełnieniu potwierdzonych treści.
