# Animacja 3D NADX

Pierwszy ekran strony pokazuje przestrzenny znak NADX na białym tle: czarne wypukłe litery, żółtą emaliowaną płaszczyznę i miękki cień. Czterosekundowa pętla zawiera lekki obrót bryły i unoszenie liter, które wracają do układu logo. Kształty liter pochodzą bezpośrednio z `public/brand/nadx-logo.svg`; znak nie został zastąpiony fontem.

## Pliki

- `assets/nadx-motion/identity-motion-v1.blend` — edytowalna scena Blender z geometrią, materiałami, kamerą, światłami i kluczami animacji. Nie wymaga zewnętrznych tekstur ani fontów.
- `scripts/render-nadx-motion.py` — odtwarza scenę z oryginalnego SVG i renderuje klatki; sprawdzono w Blenderze 4.3.2, silnik Eevee.
- `scripts/encode-nadx-motion.sh` — eksportuje filmy i statyczne podglądy; wymaga FFmpeg z `libx264` i `libwebp` oraz `ffprobe`.
- `public/media/nadx/identity-motion-v1.mp4` — H.264, 800×700 px, 96 klatek, 24 kl./s, 4 s, bez dźwięku, poniżej 0,5 MB.
- `identity-motion-v1-mobile.mp4` — ta sama pętla w 640×560 px, poniżej 0,25 MB.
- `identity-motion-v1-poster.webp` i `identity-motion-v1-poster-768.webp` — statyczne kadry 1120×980 i 768×672 px.

Pliki publiczne mieszczą się w `public/media/nadx/`. Źródłowa scena Blender pozostaje poza katalogiem publicznym.

## Ponowny eksport

Z katalogu repozytorium:

```sh
npm run motion:render
npm run motion:poster
npm run motion:encode
```

Domyślne katalogi klatek to `/tmp/nadx-motion-final` i `/tmp/nadx-motion-poster`. Po ich usunięciu trzeba ponownie wykonać render przed kodowaniem. Szybki podgląd jednej klatki:

```sh
npm run motion:render -- --preview --output /tmp/nadx-motion-preview
```

Scena ma klucze od 1 do 97, a eksport obejmuje klatki 1–96: połączenie pętli nie powtarza pierwszej klatki. Otwierając `.blend` na innym komputerze, ustaw własny katalog wyjściowy przed renderowaniem.

Kodowanie normalizuje biel tła, ustawia zakres i macierz BT.709 oraz przenosi indeks MP4 na początek pliku. Filtry pracują w jednym wątku, aby uniknąć przesuniętych pasów obrazu przy przetwarzaniu RGBA w użytej wersji FFmpeg. Po zmianie eksportu obejrzyj również oba statyczne podglądy — samo poprawne dekodowanie pliku nie potwierdza jakości obrazu.

## Zachowanie na stronie

`src/components/HeroMotion.astro` wyświetla od razu responsywny obraz, następnie uruchamia lokalny film, gdy sekcja jest widoczna. Telefon do 760 px otrzymuje mniejszy plik. Przeglądarka nie pobiera MP4 przy włączonym ograniczeniu ruchu lub oszczędzaniu danych, dopóki odwiedzający sam nie naciśnie „Odtwórz”.

Przycisk pauzy działa także z klawiatury. Ręczna pauza pozostaje aktywna po przewinięciu; odtwarzanie zatrzymuje się automatycznie poza ekranem i w ukrytej karcie. Przy błędzie filmu albo braku JavaScript pozostaje statyczny znak. Animacja nie wymaga WebGL ani biblioteki 3D w przeglądarce.

Zmiana samego SVG nie aktualizuje gotowego filmu — po zmianie znaku trzeba wykonać ponowny eksport. Przy kolejnej publikacji zmień też wersję nazw plików i bazę adresów w komponencie, aby uniknąć starej kopii w pamięci podręcznej.
