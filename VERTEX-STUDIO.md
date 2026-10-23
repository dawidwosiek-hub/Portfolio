# Prywatna integracja NADX z Vertex AI

Projekt: `pro-landing-512512-v7`.
Konto usługi: `nadx-projekt@pro-landing-512512-v7.iam.gserviceaccount.com`.

Kod obsługuje prywatne sprawdzenie połączenia oraz generowanie jednego obrazu PNG na operację. Nie dodaje panelu ani publicznych funkcji do portfolio. Nie obsługuje obecnie Veo, wideo ani edycji istniejących grafik. Połączenia wychodzące wykonuje istniejący serwer Render, ponieważ środowisko pracy blokuje bezpośredni dostęp do API Google.

## Stan

Integracja jest przygotowana w kodzie i przetestowana na symulowanych odpowiedziach Google. Do rzeczywistego połączenia brakuje prywatnego klucza konta usługi w Renderze. Generowanie jest domyślnie wyłączone. Utworzenie konta usługi i samo włączenie API nie potwierdzają dostępności konkretnego modelu, uprawnień do niego ani wykorzystania kredytu próbnego.

## 1. Klucz Google w Secret Files Rendera

1. Otwórz [konta usługi właściwego projektu](https://console.cloud.google.com/iam-admin/serviceaccounts?project=pro-landing-512512-v7).
2. Kliknij `nadx-projekt@pro-landing-512512-v7.iam.gserviceaccount.com`.
3. Otwórz **Klucze → Dodaj klucz → Utwórz nowy klucz → JSON** i pobierz plik prywatnie.
4. W Render otwórz istniejącą usługę **Portfolio → Environment**. W sekcji **Secret Files** kliknij **Add secret file**.
5. Jako nazwę pliku wpisz dokładnie `nadx-vertex.json`. W jego treść wklej całą zawartość pobranego JSON-a. Render udostępni go serwerowi jako `/etc/secrets/nadx-vertex.json`.

JSON-a nie wysyłaj w wiadomości, nie dodawaj do repozytorium, treści strony ani zwykłego folderu z portfolio. Nie zmieniaj ręcznie zawartości `private_key`.

Konto potrzebuje roli **Vertex AI User** w projekcie, a API `aiplatform.googleapis.com` musi być włączone w tym samym projekcie. Nie potrzebuje roli Owner/Editor. Jeśli organizacja blokuje tworzenie kluczy, przerwij tę ścieżkę; nie wyłączaj jej polityki bezpieczeństwa. Wtedy należy dostosować integrację do uwierzytelnienia bez klucza.

## 2. Prywatne ustawienia Rendera

W środowisku roboczym przygotowuje je polecenie:

```sh
node scripts/vertex-studio.mjs init
```

Tworzy dwa pliki z uprawnieniami 600, wykluczone z Git i obrazu Dockera:

- `.env.vertex-review` — zostaje w środowisku asystenta; zawiera adres mostu i jego prywatny klucz.
- `.env.vertex-render` — właściciel otwiera/pobiera go prywatnie i importuje jego zawartość do istniejącej usługi Render.

W Render, w sekcji **Environment Variables**, wybierz **Add from .env** (jeżeli jest pod menu przy „Add variable”) i wklej treść `.env.vertex-render`. Możesz też dodać te zmienne osobno. Nie usuwaj istniejących ustawień strony, domeny, formularza ani integracji Drive.

| Zmienna | Wartość |
| --- | --- |
| `VERTEX_BRIDGE_KEY` | Losowy sekret zgodny z prywatnym plikiem roboczym; nie publikować. |
| `VERTEX_PROJECT_ID` | `pro-landing-512512-v7` |
| `VERTEX_REGION` | `us-central1` |
| `VERTEX_SERVICE_ACCOUNT_EMAIL` | `nadx-projekt@pro-landing-512512-v7.iam.gserviceaccount.com` |
| `VERTEX_SERVICE_ACCOUNT_FILE` | `/etc/secrets/nadx-vertex.json` |
| `VERTEX_IMAGE_MODEL` | `imagen-4.0-generate-001` — wybrany model; jego aktualną dostępność i warunki trzeba potwierdzić w projekcie Google. |
| `VERTEX_GENERATION_ENABLED` | `false` podczas pierwszego sprawdzenia połączenia. |
| `VERTEX_IMAGES_PER_HOUR` | `3` |

Zapisz plik i zmienne, a następnie wykonaj **Save, rebuild and deploy** / restart zgodnie z opcjami panelu Render.

## 3. Sprawdzenie połączenia

Po restarcie asystent uruchamia:

```sh
node --env-file=.env.vertex-review scripts/vertex-studio.mjs status
```

To uwierzytelnia konto i odczytuje lokalizację Vertex AI. Nie wywołuje modelu generatywnego i nie generuje obrazu. Sukces ma `connected: true`, identyfikator projektu, konto i `generationEnabled: false`.

Następnie trzeba sprawdzić w konsoli Google dostępność modelu i regionu oraz warunki kredytu. Kredyt widoczny na wcześniejszym ekranie dotyczy okresu próbnego; dostępność funkcji generatywnych może wymagać dodatkowych warunków. Nie należy automatycznie aktualizować konta do płatnego ani zakładać, że dowolny model zostanie pokryty kredytem. Integracja nie odczytuje salda ani daty ważności środków.

## 4. Generowanie — dopiero po sprawdzeniu warunków

Po uzgodnieniu zakresu użycia ustaw w Render `VERTEX_GENERATION_ENABLED=true` i zrestartuj usługę. Konto z kluczem ma wtedy możliwość korzystania z płatnego API w ramach swoich uprawnień. Zmiana nie uruchamia żadnego zadania samoczynnie.

Przygotuj opis w prywatnym pliku tekstowym. Następnie:

```sh
node --env-file=.env.vertex-review scripts/vertex-studio.mjs generate /workspace/drive-review/opis-sceny.txt /workspace/drive-review/wizualizacja.png 3:4
```

Obsługiwane proporcje: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`. Każde jawne uruchomienie generuje najwyżej jeden obraz. Opis ma 20–4000 znaków. Wersja początkowa wyłącza generowanie osób i zachowuje znak wodny dostawcy. Do prezentacji autorskich prac generuj puste nośniki/sceny; logo i tekst z oryginalnych projektów należy zachować, nie przedstawiać wygenerowanych napisów jako wiernego źródła.

Wynik jest zapisywany poza `public/` i `dist/`. Nie publikuje się na stronie i nie jest automatycznie dodawany do portfolio. Endpoint nie loguje opisów, nie zapisuje obrazów ani danych dostępowych na efemerycznym dysku Rendera.

## Ograniczenia i wyłączenie

- `/api/studio` wymaga nagłówka Bearer z kluczem mostu; nie ma sekretów w adresie URL, HTML ani analityce. Bez konfiguracji endpoint zwraca 404. Odpowiedzi są `no-store`, `noindex`; robots blokuje `/api/`.
- Google JSON jest odczytywany wyłącznie po stronie serwera i musi odpowiadać wskazanemu kontu. Odpowiedzi nie ujawniają tokenów Google ani surowych błędów dostawcy.
- Jedno generowanie naraz; domyślnie najwyżej trzy próby na godzinę na proces. Niepewna lub odrzucona próba też zajmuje limit. Limit nie jest pieniężnym limitem Google i resetuje się po restarcie Rendera; dla wielu instancji wymaga wspólnego magazynu.
- Identyfikator operacji nie jest powtarzany do Google przez 24 godziny w ramach procesu. Narzędzie nie ponawia wywołań automatycznie. Po restarcie pamięć znika; po timeout sprawdź wykorzystanie w Google przed nową operacją. Ponowne ręczne uruchomienie CLI jest nową próbą i może ponownie zużyć środki.
- API przyjmuje wyłącznie opis, proporcje i identyfikator operacji. Użytkownik żądania nie może podmienić projektu, modelu, konta, adresu dostawcy ani liczby obrazów.
- Maksymalny obraz: 20 MB. Brak nowych zależności npm. Serwer łączy się z `oauth2.googleapis.com` i regionalnym `us-central1-aiplatform.googleapis.com` (lub skonfigurowanym regionem).
- Generowanie wyłączysz przez `VERTEX_GENERATION_ENABLED=false` i restart. Cały most wyłączysz przez usunięcie `VERTEX_BRIDGE_KEY`; klucz Google można osobno unieważnić w IAM.
- Nie ma pracy w tle poza aktywną sesją i jawnym wywołaniem. Nie zmieniono DNS, planu Render ani konta rozliczeniowego Google.

Dokumentacja dostawcy: [Imagen API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api), [uprawnienia Vertex AI](https://cloud.google.com/vertex-ai/docs/general/access-control). Symulowane testy nie zastępują rzeczywistego sprawdzenia po dodaniu sekretów.
