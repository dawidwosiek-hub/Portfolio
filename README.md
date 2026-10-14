# NADX — grafika, film i produkcja

Kompletna aplikacja Astro z renderowaniem serwerowym i formularzem po stronie Node.js. Nie wymaga CMS. Projekt powstał w pustym repozytorium; nie zawiera fikcyjnych prac ani danych kontaktowych.

## Uruchomienie

Node.js 22.12+ (zalecany 24), npm. W katalogu repozytorium:

```sh
npm ci
npm run dev
```

Produkcja:

```sh
cp .env.example .env
# Uzupełnij konfigurację lokalnie, nie dodawaj .env do Git.
npm run check
npm run build
npm start
```

Domyślny port: 4321. Ustaw `SITE_URL` na finalny adres HTTPS **przed buildem oraz przy uruchomieniu**; statyczne podstrony usług i realizacji potrzebują tej wartości podczas budowania. Bez domeny witryna ma noindex, robots blokuje indeksowanie, a sitemap zwraca 503. To celowe zachowanie podglądu.

## Edycja

- `src/content/site.json`: projekty, kontakt, zdjęcie, opinie, statystyki, porównania i dane prywatności.
- `src/content/services.json`: opisy usług, zakres, ceny. `price: null` oznacza „Wycena indywidualna”. Pakiety potrzeb klientów i ich ceny znajdują się w `src/content/packages.json`.
- Pliki graficzne i filmy: `public/media/`, w treści użyj `/media/nazwa-pliku.webp`.
- Wygląd: `src/styles/global.css`; układ: `src/components/`, `src/layouts/`.
- Po zmianach: kontrola typów, build i ponowne wdrożenie. Pełny opis modeli: [CONTENT.md](CONTENT.md).

## Formularz

Formularz wysyła tekst wiadomości do **Resend**. Wymaga:

- `RESEND_API_KEY` — klucz z prawem wysyłki, tylko na serwerze;
- `CONTACT_FROM` — zweryfikowany nadawca w Resend;
- `CONTACT_TO` — Twoja skrzynka;
- `FORM_SECRET` — losowy sekret do podpisywania tokenów (minimum 32 losowe bajty);
- `SITE_URL` — dokładny publiczny adres strony.

Wartości wprowadź w ustawieniach sekretów hostingu. Nie umieszczaj ich w JSON ani repozytorium. W Resend zweryfikuj domenę i wymagane rekordy SPF/DKIM zgodnie z instrukcją dostawcy. Sprawdź istniejące rekordy poczty przed zmianą DNS. Darmowy adres testowy dostawcy może pozwalać tylko na wysyłkę do właściciela konta.

Ochrona: podpisany token ważny 2 godziny, minimum 1,5 sekundy od otwarcia, honeypot, kontrola Origin, maks. 16 KB body, walidacja serwerowa, limit 5 prób / 15 minut i klucz idempotencji Resend. Przy ponowieniu bez zmiany treści token zapobiega powtórnemu wysłaniu. Nie edytuj treści po niepewnym wyniku wysyłki; przy nowym zapytaniu odśwież formularz. Przy braku konfiguracji zwraca 503 i zachowuje wpisane dane. Przyjęcie przez Resend nie oznacza potwierdzenia dostarczenia do skrzynki — sprawdź logi dostawcy i folder spam. Formularz nie przyjmuje załączników; pole linku nie powoduje automatycznego pobierania plików.

Domyślny limit działa w pamięci jednego procesu. W środowisku z proxy bez zaufanego nagłówka wszyscy użytkownicy mogą dzielić limit adresu proxy. Dla wielu instancji skonfiguruj `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN` (HTTPS, sekret na serwerze). `TRUSTED_IP_HEADER` ustaw tylko, jeśli dostawca potwierdza nadpisywanie nagłówka IP; nie ufaj dowolnemu nagłówkowi klienta. Uzupełnij politykę prywatności o dostawcę Redis, jeśli go użyjesz. Awaria zewnętrznego limitera blokuje wysyłkę zamiast omijać ochronę.

Przed uruchomieniem zapytań uzupełnij administratora, kontakt prywatności, hosting, okres przechowywania i ustalenia dotyczące dostawców. Informacja o prywatności jest robocza do momentu uzupełnienia rzeczywistych danych. Wyślij próbne zapytanie ze strony na docelowym hostingu i potwierdź odbiór we własnej skrzynce.

## Wdrożenie

Konfiguracja Render w `render.yaml`; alternatywnie kontener w `Dockerfile`. Instrukcja domeny, HTTPS, aktualizacji i cofnięcia: [DEPLOYMENT.md](DEPLOYMENT.md). Sam plik konfiguracyjny nie publikuje strony. Nie skonfigurowano żadnego płatnego planu.

## Testy

```sh
npm run check
npm run build
npm run test:api
npm test
npm run test:portfolio
```

Playwright używa `/usr/bin/chromium` w tym środowisku. Na innym komputerze wskaż binarkę przez `PLAYWRIGHT_CHROMIUM_EXECUTABLE` albo zainstaluj Chromium. Testy API symulują odpowiedzi dostawcy poczty: nie są dowodem rzeczywistego doręczenia. Testy przeglądarki sprawdzają 375, 768 i 1440 px, nawigację, obrazy, 404, klawiaturę, walidację i zachowanie danych przy błędzie. `test:portfolio` buduje odizolowaną kopię z oznaczonymi danymi testowymi i sprawdza filtry, strony projektów, przekazanie nazwy do formularza, suwak i odtwarzanie wygenerowanego klipu. Po teście kopia jest usuwana.

Analityka: lokalne zdarzenia `nadx:analytics` dla `quote_click`, `service_select`, `portfolio_contact`, `inquiry_accepted`. Brak zewnętrznego odbiorcy, cookies i wysyłania danych osobowych. Integrując faktyczny system, zaktualizuj prywatność i wymagane zgody; nie wysyłaj treści formularza.

Font Inter jest przechowywany lokalnie na licencji SIL OFL (`public/fonts/OFL.txt`). Kompozycja pierwszego ekranu to grafika strony NADX, nie portfolio klienta i nie oficjalny plik logo.
