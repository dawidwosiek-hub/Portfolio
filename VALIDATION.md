# Weryfikacja aktualnej wersji — 11.11.2026

Sprawdzono lokalnie:

- `npm run check`: 54 pliki, 0 błędów i ostrzeżeń.
- Produkcyjny build Astro i cztery publiczne realizacje; finalny build korzysta z `SITE_URL=https://nadx.pl`.
- 23 testy Playwright: galeria, nawigacja, filtry, białe tło, brak poziomego przewijania, wczytywanie obrazów, klawiatura i filmy na telefonie, tablecie i komputerze; kontekst zapytań, canonical, sitemap i obsługa błędów formularza.
- Test projekcji oryginalnych grafik: wszystkie cztery rogi każdej grafiki trafiają w wskazane narożniki powierzchni zdjęcia z dokładnością poniżej 0,001 px.
- Wizualna kontrola nowych mockupów SHIRO, Diverto i OLSEN, w tym liternictwa, danych kontaktowych i położenia haftu. Oryginalne pliki źródłowe pozostają niezmienione.
- Kontrola całej galerii w wersji produkcyjnej na 390, 768 i 1440 px. Duże kadry 3:2, wspólna biała stylistyka i żółty detal NADX; wszystkie sceny są podpisane jako wizualizacje projektu.
- Eksporty 1536×1024 px i 768×512 px są używane na stronie głównej, w portfolio, przy usługach i w metadanych udostępniania. Dotychczasowe szczegóły projektów i oryginalne materiały są zachowane.
- Techniczne podglądy składania scen `/podglad-studio/:scene` zwracają 404 na produkcji i nie wchodzą do mapy witryny.
- Formularz bez konfiguracji pocztowej przygotowuje wiadomość w programie pocztowym. Scenariusze API są symulowane; testy nie potwierdzają rzeczywistego doręczenia poczty.

W `render.yaml` pozostaje `plan: free`. Przygotowany, nieaplikowany plik `deploy/render-always-on.patch` przechodzi `git apply --check` i pokazuje zmianę na instancję bez usypiania. Nie zmieniono aktywnego planu ani ustawień konta Render. Alternatywa statyczna wymaga osobnego dostosowania tras serwerowych.

Bezpośrednia kontrola domeny nadx.pl w tym środowisku jest blokowana przez proxy (403 przy zestawianiu tunelu HTTPS). Wynik lokalnych testów i wysłanie zmian do repozytorium nie potwierdzają zakończenia wdrożenia na Render.
