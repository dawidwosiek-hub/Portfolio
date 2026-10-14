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

## Kontakt i prywatność

`email`, `phone`, `portrait`: puste pola są ukryte. `socials`: obiekty `{"label":"Nazwa profilu","url":"https://prawdziwy-adres"}`. `about`: naturalny opis w pierwszej osobie. `administrator`: pełna prawdziwa tożsamość administratora i dane adresowe, `privacyContact`: rzeczywisty kontakt do spraw danych, `hostingProvider`: faktyczny hosting. Samo uzupełnienie e-maila w JSON nie konfiguruje wysyłania formularza.

## Statystyki, opinie i zgody

- `statistics`: `{"label":"Nazwa wskaźnika","value":"Potwierdzona wartość","confirmed":true,"context":"Źródło; dla filmu: materiał, platforma i data pomiaru"}`. Niepotwierdzone wpisy są ukryte.
- `testimonials`: `{"quote":"Prawdziwa opinia","author":"Autor","role":"Kontekst","consent":true}`. Wymagana rzeczywista zgoda na publikację.
- `clientLogos`: `{"src":"/media/klient.svg","name":"Nazwa klienta","consent":true}`. Tylko logotypy z prawem publikacji.
- `comparisons`: `{"title":"Opis porównania","before":"/media/przed.webp","after":"/media/po.webp","beforeAlt":"Opis przed","afterAlt":"Opis po","published":true}`. Identyczne proporcje i porównywalne kadry. Suwak obsługuje dotyk i klawiaturę. Pusta tablica ukrywa całą sekcję.

Nie dodawaj danych wrażliwych ani sekretów do publicznych treści. Podglądy, prace koncepcyjne i demonstracyjne powinny pozostać oddzielone od prawdziwego portfolio.
