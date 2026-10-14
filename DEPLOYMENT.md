# Publikacja NADX

## Render (Node.js)

1. Kod udostępniono w repozytorium `dawidwosiek-hub/Portfolio` na gałęzi `nadx-site`. W Render wybierz tę gałąź. Nie wykonano publikacji strony na hostingu.
2. W Render wybierz nowy Web Service z repozytorium lub użyj Blueprint z `render.yaml`. Sprawdź aktualne warunki darmowego planu. Jeśli darmowy plan nie jest dostępny, nie przechodź na płatny bez decyzji właściciela.
3. Build: `npm ci && npm run build`. Start: `npm start`. Node 24. Health check: `/`. Render przekazuje `PORT`, aplikacja go respektuje.
4. Po przydzieleniu adresu `https://nazwa.onrender.com` ustaw `SITE_URL` na ten rzeczywisty adres. Ustaw go dla **builda i runtime**, potem wykonaj ponowny deploy. Dla podglądu bez indeksowania nie ustawiaj domeny do czasu finalizacji treści; formularz pozostanie nieaktywny.
5. W sekretnych zmiennych usługi ustaw klucz Resend, nadawcę, odbiorcę i `FORM_SECRET`. Weryfikację domeny pocztowej wykonaj u dostawcy poczty. Uzupełnij dane prywatności i kontaktu w treściach.
6. Po wdrożeniu sprawdź HTTPS, wszystkie podstrony, sitemap, formularz i rzeczywisty odbiór testowej wiadomości. Nie uznawaj symulowanych testów za doręczenie poczty.

Darmowy hosting może usypiać instancję; pierwsze wejście trwa wtedy dłużej. Render zapewnia certyfikat HTTPS na adresie usługi. Włącz przekierowanie HTTP → HTTPS zgodnie z ustawieniami hostingu.

## Własna domena

Dodaj domenę w ustawieniach hostingu i użyj wskazanych przez niego rekordów. Najpierw odczytaj istniejące DNS i przeznaczenie rekordów. Zachowaj MX, SPF, DKIM i DMARC dla istniejącej poczty. Nie zmieniaj całej strefy ani serwerów DNS w ciemno. Certyfikat musi mieć status aktywny. Zmień `SITE_URL`, przebuduj, sprawdź canonical i sitemap. Wybierz jeden wariant (www lub bez www); drugi przekieruj na główny.

## Kontener / inny hosting Node

```sh
docker build --build-arg SITE_URL=https://twoja-domena.pl -t nadx .
docker run --env-file .env -p 4321:4321 nadx
```

`.env` musi zawierać tę samą domenę. HTTPS zapewnia reverse proxy hostingu — sam kontener nie zarządza certyfikatem. Nie wystawiaj serwera produkcyjnego bez HTTPS. Zewnętrzne żądania serwera: `api.resend.com`; opcjonalnie konkretny host Twojego Redis. Instalacja pakietów: `registry.npmjs.org`. Nie jest potrzebny publiczny upload ani baza projektów.

## Aktualizacja i cofnięcie

Edytuj treści, wykonaj build i testy, zapisz commit i wdrażaj wersję z tego commitu. Na Render wybierz wcześniejszy poprawny deploy przez funkcję rollback; jeśli nie jest dostępna, wdroż poprzedni commit. Przy kontenerach zachowuj poprzedni tag obrazu i wdrażaj go ponownie. Sekrety i ustawienia domeny nie cofają się razem z kodem — sprawdź zgodność osobno.

## Braki przed finalną publikacją

Prawdziwe realizacje i zgody, dane kontaktowe, potwierdzony zakres wykonania nadruków, dane administratora i hostingu, finalna polityka retencji i dostawców, domena/adres usługi, konfiguracja Resend. Ceny i statystyki są opcjonalne; puste wartości nie tworzą fikcyjnych informacji.
