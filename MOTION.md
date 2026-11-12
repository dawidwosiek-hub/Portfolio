# Film na stronę główną NADX

Aktualny pierwszy ekran pokazuje 16-sekundowy film o projekcie Odwróceni: kompozycję grafiki, detale oklejenia, samochód oglądany z kilku stron oraz łódź. Panoramiczny kadr, krótkie cięcia i spokojniejsze zakończenie prowadzą do znaku NADX i zaproszenia do współpracy.

Obracająca się bryła z logo z poprzedniej wersji nie jest używana na stronie. Jej scena Blender i dawne skrypty pozostają źródłami archiwalnego wariantu.

## Źródła i montaż

`assets/nadx-cinematic/edit.json` zawiera kolejność ujęć, pliki źródłowe, wybrane fragmenty, czas w klatkach i długość przejść. Film powstaje z istniejących materiałów portfolio:

- Filmy samochodu `7c50e11d794032fc.mp4` i `963120ff2f667c01.mp4` — dostarczone materiały, z których pochodzą ruchy kamery i zbliżenia.
- `public/media/odwroceni/studium-kompozycji.webp` — studium kompozycji z prezentacji projektu, pokazane jako osobny etap wizualny. Nie jest opisane jako historyczny odręczny szkic.
- `boat-editorial.webp` — istniejąca wizualizacja łodzi nad wodą; w filmie kamera powoli odsłania cały kadr. To animowane kadrowanie obrazu, a nie nowy model 3D ani nowe zdjęcia filmowe łodzi.
- `public/brand/nadx-logo.svg` i lokalne fonty Inter — oryginalny znak oraz typografia końcowej planszy.

Montaż nie przypisuje NADX autorstwa zdjęć, nowych modeli 3D ani fizycznego wykonania oklejenia. Opisuje projektowanie grafiki i jej wizualizacje. Oryginalne pliki źródłowe pozostają niezmienione.

## Eksport

Z katalogu repozytorium:

```sh
npm run motion:render
```

Wymagane: Node, zależności projektu, Chromium (domyślnie `/usr/bin/chromium`, można zmienić przez `PLAYWRIGHT_CHROMIUM_EXECUTABLE`) i FFmpeg z `libx264`, `libwebp`, `ffv1` oraz `ffprobe`. Chromium eksportuje tylko nakładki typograficzne i planszę końcową; FFmpeg montuje obraz.

Pliki pośrednie i raport eksportu trafiają do `/tmp/nadx-cinematic-render`. Inny katalog można wskazać przez `NADX_FILM_WORK`. Skrypt pilnuje liczby klatek i braku dodatkowej ścieżki audio. Wszystkie filtry pracują w jednym wątku, a strumienie są normalizowane do wspólnego czasu i 24 kl./s przed przejściami.

Eksporty w `public/media/nadx/`:

- `portfolio-cinematic-v2.mp4`: 1280×720 px, H.264, 384 klatki, 24 kl./s, 16 s, bez dźwięku, indeks MP4 na początku pliku.
- `portfolio-cinematic-v2-mobile.mp4`: ten sam montaż w 768×432 px.
- `portfolio-cinematic-v2-poster.webp` i `portfolio-cinematic-v2-poster-768.webp`: kadry otwierające w 1280×720 i 768×432 px.

Końcowy kadr wraca do pierwszego ujęcia samochodu, aby film można było zapętlić. Przy kolejnej zmianie opublikowanego filmu zwiększ wersję nazw w planie montażu i bazę ścieżek w komponencie, aby przeglądarka pobrała nowy plik.

## Zachowanie na stronie

`src/components/HeroMotion.astro` pokazuje od razu statyczny kadr projektu. Film ładuje się dopiero przy widocznej sekcji; do 760 px wybierany jest mniejszy plik. Przy ograniczeniu ruchu i oszczędzaniu danych MP4 nie pobiera się do czasu świadomego uruchomienia przez odwiedzającego.

Pauza działa z klawiatury i pozostaje aktywna po przewinięciu strony. Film zatrzymuje się poza ekranem i w ukrytej karcie. Przycisk „Obejrzyj film” otwiera duży natywny dialog z odtwarzaczem, uruchamia film od początku i zatrzymuje mały podgląd. Zamknięcie przyciskiem lub Escape zatrzymuje duży film oraz przywraca fokus. Ręczna pauza podglądu jest zachowana.

Przy błędzie filmu albo braku JavaScript pozostaje obraz projektu i odnośnik do pełnej realizacji. Strona nie wymaga WebGL ani biblioteki 3D w przeglądarce.
