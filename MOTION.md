# Filmy portfolio NADX

Pierwszy ekran pokazuje 16-sekundowy montaż czterech realizacji: łódź Odwróceni, wizytówki SHIRO, odzież OLSEN, CD Diverto i zamocowany baner SHIRO. Na końcu pojawia się oryginalny znak NADX, a obraz wraca do ujęcia otwierającego. Wszystkie ujęcia korzystają z ocenionej sesji produktowej w jasnoszarym studiu. Krótkie przenikania nie przechodzą przez czarne plansze.

Na podstronie Odwróceni jest osobny film 22-sekundowy: cała łódź, plansza kompozycji, pierwsza burta, druga burta i rufa. Oba montaże używają delikatnego kadrowania gotowych obrazów. Nie są nową animacją modelu 3D ani nowo nakręconym materiałem. Wycofano niepotwierdzone ujęcia Lamborghini. Starsze materiały źródłowe oraz dawna scena Blender pozostają archiwalne i nie są aktywnymi ujęciami filmów.

## Źródła

- `assets/nadx-cinematic/edit.json`: kolejność, czas i przejścia filmu głównego.
- `assets/studio-session/boat-film-edit.json`: montaż prezentacji łodzi.
- Obrazy z [manifestu sesji](assets/studio-session/session-manifest.json): oryginalne projekty nałożone na puste bazy. Zasady pracy ze źródłami: [STUDIO-SESSION.md](STUDIO-SESSION.md).
- `public/brand/nadx-logo.svg` i lokalne fonty Inter: oryginalny znak oraz typografia planszy końcowej.

Prezentacja opisuje projektowanie grafiki i jej wizualizację; nie przypisuje NADX fizycznego oklejania ani wykonania nowych modeli 3D.

## Eksport

```sh
npm run motion:render
node scripts/render-nadx-cinematic.mjs --edit assets/studio-session/boat-film-edit.json
```

Wymagane są zależności npm, FFmpeg/ffprobe z `libx264`, `libwebp`, `ffv1` oraz Chromium (domyślnie `/usr/bin/chromium`, zmieniane przez `PLAYWRIGHT_CHROMIUM_EXECUTABLE`). Chromium przygotowuje wyłącznie oryginalny znak i nakładki typograficzne. FFmpeg montuje obrazy oraz sprawdza liczbę klatek i brak ścieżki audio.

Pole `outputDirectory` w montażu łodzi kieruje wynik do jej katalogu. `auxiliary: false` pomija dodatkowy plik mobilny i plakaty. Film główny domyślnie zapisuje cztery pliki w `public/media/nadx/`:

| Plik | Parametry |
| --- | --- |
| `portfolio-cinematic-v2.mp4` | 1280×720, 24 kl./s, 384 klatki, 16 s |
| `portfolio-cinematic-v2-mobile.mp4` | 768×432, ten sam montaż |
| `portfolio-cinematic-v2-poster.webp` | 1280×720 |
| `portfolio-cinematic-v2-poster-768.webp` | 768×432 |

Film łodzi: `public/media/podglad/odwroceni-c0ec4c60be97/odwroceni-story.mp4`, 1280×720, 24 kl./s, 528 klatek, 22 s. MP4 korzystają z H.264 i `faststart`. Dotychczasowe nazwy zostały zachowane zgodnie z zakresem tej aktualizacji.

Pliki robocze i raport trafiają do `/tmp/nadx-cinematic-<wersja>`; katalog zmienia `NADX_FILM_WORK`. `NADX_FILM_SOURCE_ROOT` wskazuje katalog źródeł, a `NADX_FILM_OUTPUT` katalog wyników. Pozwala to eksportować do stagingu przed podmianą publicznych plików. Pełną procedurę renderowania, oględzin, pieczęci SHA-256 i zastosowania eksportów opisuje [STUDIO-SESSION.md](STUDIO-SESSION.md).

## Zachowanie na stronie

`HeroMotion.astro` wyświetla od razu statyczny plakat. Film ładuje się przy widocznej sekcji; do 760 px wybiera mniejszy wariant. Przy ograniczeniu ruchu i oszczędzaniu danych MP4 nie pobiera się do świadomego uruchomienia przez odwiedzającego.

Ręczna pauza działa z klawiatury i pozostaje po przewinięciu strony. Odtwarzanie zatrzymuje się poza ekranem i w ukrytej karcie. Przycisk „Obejrzyj film” otwiera duży natywny dialog, rozpoczyna film od początku i zatrzymuje podgląd. Zamknięcie przyciskiem lub Escape zatrzymuje film oraz przywraca fokus. Film łodzi ma natywne sterowanie i zatrzymuje się poza ekranem.

Przy błędzie filmu i bez JavaScript pozostaje plakat oraz odnośnik do realizacji. Strona nie wymaga WebGL ani biblioteki 3D.
