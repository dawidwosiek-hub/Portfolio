# Weryfikacja wykonanej wersji

Sprawdzono lokalnie w środowisku chmurowym:

- instalacja `npm ci` z lockfile, kontrola typów: 0 błędów i ostrzeżeń;
- produkcyjny build Astro i uruchomienie serwera Node;
- serwer deweloperski: odpowiedź zawiera właściwą stronę NADX;
- 7 testów Playwright: wszystkie podstrony na 375, 768 i 1440 px, brak poziomego przewijania i błędów konsoli, menu mobilne, obrazy, wybrana usługa, walidacja, zachowanie treści przy 503, symulowany sukces, 404, fokus, reduced motion, canonical i sitemap przy domenie testowej, odrzucenie złego Origin/body/tokena;
- test serwerowego API: błędne pola, honeypot, limit prób, klucz idempotencji oraz reakcje na symulowane przyjęcie, błąd dostawcy i błąd połączenia;
- test portfolio na odizolowanej kopii: filtry, pusty wynik, strony projektów, przekazanie projektu do formularza, porównanie z klawiatury i odtwarzanie wygenerowanego klipu;
- obrazy gotowych ekranów obejrzano i poprawiono fokus linku pomijającego nawigację oraz strzałki wymagające brakującego znaku fontu;
- `npm audit --omit=dev`: 0 podatności w momencie wykonania;
- publiczne pliki nie zawierają kluczy poczty ani sekretu formularza.

Nie wykonano: publikacji publicznej, weryfikacji HTTPS na hostingu, rzeczywistego doręczenia wiadomości, testów rzeczywistych filmów i realizacji (nie zostały dostarczone). Próby poczty były symulowane. Konfiguracja Render i Docker została przygotowana; nie uruchamiano wdrożenia ani builda Docker.

Prawdziwe portfolio pozostaje puste. Statystyki, opinie, logotypy klientów i porównania są ukryte do czasu dostarczenia potwierdzonych treści. Instrukcje środowiska i wymagania poczty zapisano w wersji roboczej konfiguracji; zapis nie publikuje środowiska ani strony.
