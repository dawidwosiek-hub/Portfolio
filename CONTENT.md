# Uzupełnianie treści NADX

`src/content/site.json` jest plikiem JSON — zachowaj cudzysłowy i przecinki. Po każdej zmianie uruchom build. Kopia przed edycją pozwala łatwo cofnąć zmianę.

## Prawdziwe realizacje

Do tablicy `projects` dodaj obiekt na podstawie poniższego **schematu**, zastępując wszystkie opisy i adresy własnymi materiałami. Nie publikuj tego przykładu jako realizacji.

```json
{
  "slug": "unikalny-adres-realizacji",
  "name": "Rzeczywista nazwa projektu",
  "category": "logo i identyfikacja",
  "scope": "Twój rzeczywisty zakres pracy",
  "client": "Krótki opis klienta z prawem publikacji",
  "need": "Potrzeba klienta",
  "solution": "Opis Twojego pomysłu i rozwiązania",
  "image": "/media/glowna-grafika.webp",
  "alt": "Opis głównej grafiki",
  "gallery": [{"src": "/media/detal.webp", "alt": "Opis detalu"}],
  "published": false,
  "featured": true
}
```

`published: false` ukrywa projekt i nie tworzy jego strony. `true` publikuj tylko po podłączeniu prawdziwych plików i sprawdzeniu praw do publikacji. Kategorie: `logo i identyfikacja`, `druk i reklama`, `filmy i social media`, `odzież i nadruki`, `oklejenia`. Pierwsze 6 oznaczonych `featured` pojawia się na stronie głównej. Powiązania z ofertą wynikają z kategorii.

Opcjonalne `result`: wyłącznie potwierdzony rezultat, z kontekstem platformy i datą pomiaru. Opcjonalne `video`: `{"src":"/media/film.mp4","poster":"/media/kadr.webp"}`. Film ma własne sterowanie, nie odtwarza automatycznie dźwięku. Eksportuj MP4 H.264, poster WebP, usuń zbędne metadane, ogranicz rozdzielczość i bitrate. Dla obrazów przygotuj WebP/AVIF o wymiarach faktycznego wyświetlania; nie wgrywaj surowych plików produkcyjnych.

Przycisk projektu przekazuje jego nazwę do kontaktu. Przy linku z nieznaną nazwą strona nie dodaje fikcyjnej realizacji.

### SHIRO i prezentacja logo

Pierwsza realizacja jest wpisana w `site.json` jako `shiro-logo-i-wizytowki`. Materiały internetowe znajdują się w `public/media/shiro/`. Wpis jest widoczny na stronie głównej, w portfolio oraz przy usługach logo i druku. Opcjonalna tablica `categories` dodaje kolejne kategorie, zachowując główną `category`.

`logo` zawiera `src`, `alt`, rzeczywiste `width` i `height` oraz `caption`. Obecny znak to oryginalny raster z przezroczystością wyodrębniony z obiektu osadzonego w dostarczonym `sh1.psd`. Nie został odtworzony przez AI ani zwektoryzowany. `invert: true` wyświetla biały znak w czerni na białym tle; plik źródłowy pozostaje biały. Po dostarczeniu docelowego kolorowego SVG można zastąpić `src`, wymiary i wyłączyć `invert`.

`scopeItems` to lista rzeczywiście wykonanych prac. `galleryTitle` i `galleryIntro` opisują galerię. Wpisy `gallery` mogą mieć `width`, `height`, `smallSrc`, `caption` i `kind`. `original` opisuje oryginał, a `visualization` — wizualizację. Źródła i dodatkowe detale są dostępne w rozwijanym podglądzie. Brak `kind` traktowany jest jak zwykła galeria. Dla obrazu głównego istnieją analogiczne `imageSmall`, `imageWidth`, `imageHeight` i `imageCaption`. Małe wersje powinny mieć 768 px szerokości; duże — podaną szerokość. Przeglądarka dobiera plik do ekranu.

Mockupy SHIRO powstały z użyciem AI i są tak podpisane. Nie są dokumentacją fizycznego wydruku; oryginalne wizytówki są dostępne w rozwijanym podglądzie. Autorstwo logo i projektów wizytówek potwierdził Dawid Wosiek. Wpis nie przypisuje autorstwa znaku COMPSPORT ani fotografii samochodu, nie podaje niepotwierdzonych wyników ani wykonania nakładu.

`identity` opisuje typografię i kolory prezentowanych materiałów. SHIRO korzysta z Red Hat Display wskazanego w dostarczonej planszy identyfikacji. Font jest lokalny (`public/fonts/red-hat-display.woff2`), z licencją SIL OFL w pliku `red-hat-display-OFL.txt`; źródło: Google Fonts / Red Hat. Kolory służą prezentacji materiałów; nie są opisane jako ustalone specyfikacje produkcyjne.

`applications` to uporządkowane zastosowania marki. Każdy wpis ma `slug`, `label`, `title`, `description` oraz obraz `image` zgodny ze schematem galerii. Opcjonalny `original` udostępnia projekt źródłowy w rozwijanym podglądzie i pozwala go powiększyć. `concept: true` oznacza pracę koncepcyjną. Strona automatycznie tworzy skróty do zastosowań i numery rozdziałów.

Naklejkę wyeksportowano z `Shiro_WLEPY.psd`, a planszę obuwia z `sh1.psd`. Wizualizacja flag opiera się na dostarczonej planszy Wulkanizacja / Mechanika. Wszystkie nowe mockupy mają białe tło i podpis AI. Koncepcja obuwia nie jest oferowana jako wyprodukowany model ani jako usługa produkcji obuwia. Adres realizacji pozostaje bez zmian, aby zachować istniejące linki.

Vouchery: `SHIRO_VOUCHER_FRONT.pdf` i `voucher_2_poprawka1.pdf` zawierają awers i rewers tego samego materiału. Oba oryginały wyeksportowano do WebP; w `originals` można dodać wiele obrazów źródłowych do jednego zastosowania. Mockup pokazuje oba projekty na białym tle. Wizualizacja banera opiera się na dosłanej grafice SHIRO Mechanic & Chiptuning. Zdjęcia samochodów nie są przypisane jako autorstwo fotograficzne NADX.

`applications[].videos` obsługuje listę filmów z `src`, `poster`, `title`, `caption`, `width` i `height`. Zastosowanie może zawierać same filmy, bez `image`. Oryginalne `TS_BLACK.mp4` i `Bluza.mp4` to animowane wizualizacje odzieży SHIRO. Eksporty H.264/AAC mają 720×1280 px, około 8,3 s, zachowaną ścieżkę audio i metadane usunięte z plików. Odtwarzacze mają sterowanie, `preload="none"`, `playsinline` i domyślne wyciszenie; nie używają autoplay. Plakat jest kadrem z odpowiedniego filmu. Prezentacje nie są opisane jako zdjęcia wykonanych nadruków.

Główne tło całej witryny jest białe (`--paper: #ffffff` w `src/styles/global.css`). Pomocnicze panele mają neutralne szarości, a sekcje czarne i żółte zachowują kolory NADX.

### Spójna prezentacja na bieli

Mockupy SHIRO używają plików `*-cutout-*.webp` z rzeczywistym kanałem alfa. Przezroczystość dotyczy otoczenia obiektów; kolory druku i projekty pozostają częścią wizualizacji. Pliki przygotowano narzędziem imagegen i wyeksportowano w dwóch szerokościach. Nie dodawaj pod nimi szarego tła ani obramowania — kompozycja ma łączyć się bezpośrednio z bielą strony. Zdjęcia i oryginalne projekty produkcyjne zachowują własną zawartość.

Każde zastosowanie ma teraz jedną dużą prezentację, wspólną maksymalną szerokość i tę samą hierarchię opisu. Komponent `ProjectSources.astro` udostępnia oryginały w natywnym rozwijanym podglądzie; pliki źródłowe można nadal otworzyć w pełnym rozmiarze. Dodatkowe zbliżenie wizytówki jest w tym podglądzie, zamiast powtarzać materiał na końcu strony.

`videos[].preview` wskazuje jasny podgląd odzieży w schemacie `ProjectMedia`. Jest to wizualizacja AI oparta na kadrze; sam film pozostaje dostarczoną animacją. `ProjectFilms.astro` otwiera oryginalną animację w natywnym oknie dialogowym po kliknięciu. Zamknięcie przyciskiem lub Escape zatrzymuje film i przywraca fokus. Plik nie uruchamia się przy wejściu na stronę.

`shareImage` pozwala użyć oddzielnego, nieprzezroczystego obrazu Open Graph do udostępniania linków. Dla SHIRO zachowano wariant na bieli, aby podgląd pozostał czytelny także w aplikacjach z ciemnym tłem.

## Kontakt i prywatność

`email`, `phone`, `portrait`: puste pola są ukryte. `socials`: obiekty `{"label":"Nazwa profilu","url":"https://prawdziwy-adres"}`. `about`: naturalny opis w pierwszej osobie. `administrator`: pełna prawdziwa tożsamość administratora i dane adresowe, `privacyContact`: rzeczywisty kontakt do spraw danych, `hostingProvider`: faktyczny hosting. Samo uzupełnienie e-maila w JSON nie konfiguruje wysyłania formularza.

## Statystyki, opinie i zgody

- `statistics`: `{"label":"Nazwa wskaźnika","value":"Potwierdzona wartość","confirmed":true,"context":"Źródło; dla filmu: materiał, platforma i data pomiaru"}`. Niepotwierdzone wpisy są ukryte.
- `testimonials`: `{"quote":"Prawdziwa opinia","author":"Autor","role":"Kontekst","consent":true}`. Wymagana rzeczywista zgoda na publikację.
- `clientLogos`: `{"src":"/media/klient.svg","name":"Nazwa klienta","consent":true}`. Tylko logotypy z prawem publikacji.
- `comparisons`: `{"title":"Opis porównania","before":"/media/przed.webp","after":"/media/po.webp","beforeAlt":"Opis przed","afterAlt":"Opis po","published":true}`. Identyczne proporcje i porównywalne kadry. Suwak obsługuje dotyk i klawiaturę. Pusta tablica ukrywa całą sekcję.

Nie dodawaj danych wrażliwych ani sekretów do publicznych treści. Podglądy, prace koncepcyjne i demonstracyjne powinny pozostać oddzielone od prawdziwego portfolio.

## Logo i ikony

Oryginał marki: `public/brand/nadx-logo.svg`. Nagłówek, stopka i kompozycje strony korzystają z tego pliku bez odtwarzania kształtu znaku. Po jego zmianie uruchom `npm run brand:assets` (wymaga Chromium wskazanego w README), a następnie build. Skrypt eksportuje SVG, PNG 32×32 i ikonę Apple 180×180 oraz obraz Open Graph 1200×630. Nową wersję favicony można wymusić przez zmianę parametru wersji w `src/layouts/Layout.astro`.
