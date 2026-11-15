# Weryfikacja sesji produktowej

Sprawdzono lokalnie 15 listopada 2026. Bazą jest `nadx-site` po pobraniu PR #1 (`0bbf1fa`).

| Kontrola | Wynik |
| --- | --- |
| `npm run check` | 57 plików, 0 błędów, ostrzeżeń i uwag |
| `npm run test:studio` | 5 testów: źródła, eksporty, rozmiary, projekcja, tła okładek i zachowanie PR #1 |
| `npx playwright test --workers=4` | 29 testów przeglądarkowych |
| `npm run test:api` | 3 zestawy API: formularz, biblioteka Drive, Vertex |
| `node --import tsx --test tests/mockup-projection.test.ts` | 1 test projekcji |
| `npm run test:portfolio` | 1 odizolowany test portfolio z osobnym buildem i przeglądarką |
| `SITE_URL=https://nadx.pl npm run build` | Build produkcyjny |
| `git diff --check` | Bez błędów formatowania patcha |

## Obrazy i źródła

[Arkusz kontrolny](public/media/studio-review/arkusz-kontrolny.jpg) obejmuje 35 ujęć. Oceniono je przed podmianą plików oraz obejrzano pełne kadry odzieży, papieru, płyty, banera, flag i łodzi. Poprawiono odstające kadry i maski. Wszystkie 141 WebP oraz trzy filmy mają zapisane sumy SHA-256 w [manifeście](assets/studio-session/session-manifest.json). Test sprawdza, że opublikowane pliki odpowiadają ocenionym eksportom, a istniejące obrazy zachowały wcześniejsze wymiary.

Niezmienione PNG, SVG, logo oraz kopie źródłowych WebP porównano z sumami sprzed sesji. Model generatywny tworzył wyłącznie puste sceny. Wszystkie napisy, znaki i dane kontaktowe pochodzą z istniejących rastrów. Homografie trafiają w cztery zadane narożniki powierzchni z błędem poniżej 0,001 px. Szczegóły: [STUDIO-SESSION.md](STUDIO-SESSION.md).

Każdy obraz i plakat filmu wyświetlany w czterech aktywnych realizacjach znajduje się w nowym zestawie. Surowe oryginały są dostępne jako materiały źródłowe w powiększeniach. Niepotwierdzone Lamborghini wycofano z aktywnej prezentacji oraz montażu.

## Telefon, tablet i komputer

Oceniono widoki strony głównej, `/realizacje` i wszystkich czterech projektów przy 390 i 1440 px. W dwunastu widokach nie ma poziomego przewijania ani nieudanych żądań zasobów. Testy przeglądarkowe obejmują także 768 px, a test portfolio 375 px.

Sprawdzono filtrowanie, nawigację, widoczność całych produktów, ostrość źródeł, zoom, Escape, fokus klawiatury, przekazanie projektu do zapytania, canonical, sitemap i formularz przy błędzie. Naprzemienny układ okładek z PR #1 jest zachowany; poprawiono tylko nierówne szerokości parzystych wierszy na tablecie.

Filmy: pierwszy ekran 16 s / 384 klatki / 24 kl./s, wersje 1280×720 i 768×432; prezentacja łodzi 22 s / 528 klatek / 24 kl./s. MP4 H.264, bez dodatkowych ścieżek audio, z indeksem na początku. Przenikania nie przechodzą przez czerń. Testy sprawdzają odtwarzanie, ręczną pauzę, zatrzymanie poza ekranem i w ukrytej karcie, ograniczenie ruchu, oszczędzanie danych, plik mobilny, statyczny obraz przy błędzie i duży dialog odtwarzacza.

Testy API korzystają z symulowanych usług. Nie potwierdzają rzeczywistego doręczenia poczty ani nie wywołują płatnego generowania. Nie zmieniano planu Render, konfiguracji kont ani sekretów. Bezpośrednia kontrola domeny nadx.pl jest w tym środowisku blokowana przez proxy (403 przy tunelu HTTPS); lokalne testy i push nie potwierdzają zakończenia wdrożenia hostingu.
