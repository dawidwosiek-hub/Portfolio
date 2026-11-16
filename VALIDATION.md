# Weryfikacja aktualnej wersji

Sprawdzono lokalnie:

- `npm run check`: 56 plików, 0 błędów, ostrzeżeń i uwag.
- Produkcyjny build Astro i cztery publiczne realizacje; finalny build korzysta z `SITE_URL=https://nadx.pl`.
- 29 testów Playwright: galeria, nawigacja, filtry, białe tło, brak poziomego przewijania, wczytywanie obrazów, klawiatura i filmy na telefonie, tablecie i komputerze; kontekst zapytań, canonical, sitemap i obsługa błędów formularza. Sześć scenariuszy filmu na pierwszym ekranie sprawdza odtwarzanie i pauzę, zatrzymanie poza ekranem, ograniczenie ruchu, oszczędzanie danych, plik mobilny, statyczny obraz przy błędzie oraz duży odtwarzacz. Dialog zatrzymuje podgląd, zamyka się przez Escape i przycisk, przywraca fokus oraz zachowuje ręczną pauzę. Przy ograniczeniu ruchu otwarcie dużego filmu jest świadomą decyzją użytkownika.
- Test projekcji oryginalnych grafik: wszystkie cztery rogi każdej grafiki trafiają w wskazane narożniki powierzchni zdjęcia z dokładnością poniżej 0,001 px.
- Wizualna kontrola nowych mockupów SHIRO, Diverto i OLSEN, w tym liternictwa, danych kontaktowych i położenia haftu. Oryginalne pliki źródłowe pozostają niezmienione.
- Kontrola całej galerii w wersji produkcyjnej na 390, 768 i 1440 px. Duże kadry 3:2, wspólna biała stylistyka i żółty detal NADX; wszystkie sceny są podpisane jako wizualizacje projektu.
- Eksporty 1536×1024 px i 768×512 px są używane na stronie głównej, w portfolio, przy usługach i w metadanych udostępniania. Dotychczasowe szczegóły projektów i oryginalne materiały są zachowane.
- Techniczne podglądy składania scen `/podglad-studio/:scene` zwracają 404 na produkcji i nie wchodzą do mapy witryny.
- Film Odwróceni na pierwszym ekranie: H.264 bez dźwięku, 16 s, 384 klatki przy 24 kl./s, warianty 1280×720 i 768×432 px. Obejrzano sekwencję ujęć, oba statyczne podglądy oraz pierwszy ekran i duży odtwarzacz przy 390, 768 i 1440 px; brak poziomego przewijania. Film pokazuje kompozycję, detale, ruch kamery wokół samochodu i animowane kadrowanie wizualizacji łodzi, zakończone znakiem NADX. Nie używa poprzedniej bryły logo. Plan montażu i skrypt ponownego eksportu są w repozytorium; źródła i zakres opisuje `MOTION.md`.
- Formularz bez konfiguracji pocztowej przygotowuje wiadomość w programie pocztowym. Scenariusze API są symulowane; testy nie potwierdzają rzeczywistego doręczenia poczty.

W `render.yaml` pozostaje `plan: free`. Przygotowany, nieaplikowany plik `deploy/render-always-on.patch` przechodzi `git apply --check` i pokazuje zmianę na instancję bez usypiania. Nie zmieniono aktywnego planu ani ustawień konta Render. Alternatywa statyczna wymaga osobnego dostosowania tras serwerowych.

Bezpośrednia kontrola domeny nadx.pl w tym środowisku jest blokowana przez proxy (403 przy zestawianiu tunelu HTTPS). Wynik lokalnych testów i wysłanie zmian do repozytorium nie potwierdzają zakończenia wdrożenia na Render.
