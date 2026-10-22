# Stały odczyt materiałów z Google Drive

Ta opcja rozwiązuje ograniczenie środowiska, które blokuje bezpośrednie połączenia z Google Drive. Serwer NADX na Renderze pośredniczy w prywatnym odczycie plików. Nie trzeba codziennie pobierać ZIP-ów, udostępniać publicznie projektów ani przenosić ich z Dysku.

**Stan:** kod integracji jest gotowy; połączenie z rzeczywistym Dyskiem wymaga jednorazowej konfiguracji poniżej. Bez konfiguracji endpoint zwraca 404. Testy używają symulowanych odpowiedzi Google i nie potwierdzają dostępu do materiałów właściciela.

## 1. Konto techniczne Google — jednorazowo

1. Otwórz [Google Cloud Console](https://console.cloud.google.com/) na swoim koncie. Utwórz osobny projekt, np. `NADX portfolio`. Nie kupuj hostingu ani planu Google Cloud do tej integracji.
2. W wybranym projekcie otwórz [Google Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) i kliknij **Włącz / Enable**.
3. Otwórz [IAM i administracja → Konta usługi](https://console.cloud.google.com/iam-admin/serviceaccounts). Utwórz konto, np. `nadx-portfolio`. Nie potrzebuje ról Owner/Editor projektu ani delegowania dostępu do całej domeny.
4. Skopiuj adres e-mail utworzonego konta, kończący się na `.iam.gserviceaccount.com`.
5. W Google Drive udostępnij temu adresowi wyłącznie foldery z projektami do portfolio jako **Przeglądający**. Możesz udostępnić jeden folder nadrzędny, jeśli zawiera tylko te materiały. Dostęp „Każda osoba mająca link” nie jest potrzebny.
6. W szczegółach konta usługi otwórz **Klucze → Dodaj klucz → Utwórz nowy klucz → JSON**. Pobierz plik i przechowuj prywatnie. Nie wysyłaj go na czacie ani nie dodawaj do Git.

Jeżeli organizacja Google blokuje tworzenie kluczy lub udostępnianie folderów kontom usługi, nie wyłączaj jej zabezpieczeń. Potrzebna będzie zgoda administratora lub integracja OAuth dostosowana do tej organizacji.

## 2. Render — trzy prywatne zmienne

W istniejącej usłudze **Portfolio → Environment → Add variable** ustaw:

| Zmienna | Wartość |
| --- | --- |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` | Cała zawartość pobranego pliku JSON, wklejona jako jeden sekret. Zachowaj zapis `\n` wewnątrz `private_key`; nie zamieniaj go ręcznie na nowe linie. |
| `DRIVE_LIBRARY_FOLDERS` | Identyfikatory dozwolonych folderów oddzielone przecinkami, bez pełnych adresów URL. |
| `DRIVE_LIBRARY_KEY` | Losowy klucz dostępu do mostu, zgodny z prywatnym plikiem roboczym opisanym poniżej. |

Identyfikator folderu to fragment adresu po `/folders/`. Lista 12 folderów wskazanych przez właściciela:

```text
1in7ubThS7l-4G5gLpNg3hyby9v3J4d3B,1SMpkPexPu2Brr9t1-rsFEuHW_WKY1dub,1cKHgYQ61OWu7Hxzs_r8SS8evX9MjMz-8,1yv5-hrvFKuAa1yNZZfG_K18pwvYPje9y,1ugDNSntLGp885Lj_2TNkxrKGWHoEuFXb,1dYi6ZkKqn-WS0DAJ8Qq1oJ30TsTScViF,1Vx9oWiJwFNXMDTFhCUWTjtHH0UblCUBw,15mvcVAoWHb4F-dpDWPVJyOXX2EoDRl3q,11oyJ4KvQBKsp20iqCt_fmTh683DJfusf,1vYyLddHy7NX-D9jXlqZa9SfCbTUiSHZG,17VkaWVJDaCXt7Cr3CXXwCSGYRjkP9TUt,1uDugiWM3sB2o-44LDpo_YxdMYOZ9U7bu
```

Można wpisać mniej folderów. Jeżeli użyjesz jednego wspólnego folderu nadrzędnego, wpisz jego identyfikator zamiast tej listy. Konto techniczne musi mieć uprawnienia do każdego wskazanego folderu.

W katalogu roboczym repozytorium jednorazowo uruchom:

```sh
node scripts/drive-library.mjs init
```

Polecenie tworzy `.env.drive-review` z losowym kluczem i adresem istniejącego Rendera. Plik ma uprawnienia 600, jest wykluczony z Git oraz obrazu Dockera. Nie wypisuje sekretu na czacie ani w logach. Właściciel otwiera lub pobiera ten prywatny plik z przestrzeni roboczej i kopiuje wartość `DRIVE_LIBRARY_KEY` do Rendera. Ten sam klucz musi pozostać w lokalnym pliku, aby narzędzie mogło odczytywać bibliotekę. Nie publikuj pliku ani nie wklejaj wartości klucza w wiadomości czatu.

Zapisz zmienne i wykonaj deploy/restart usługi. Nie trzeba zmieniać DNS, formularza, domeny ani planu hostingu.

## 3. Sprawdzenie dostępu i codzienna praca

Lista dozwolonych folderów:

```sh
node --env-file=.env.drive-review scripts/drive-library.mjs roots
```

Lista plików w folderze, z automatyczną obsługą kolejnych stron wyników:

```sh
node --env-file=.env.drive-review scripts/drive-library.mjs list ID_FOLDERU
```

Pobranie oryginału do prywatnego katalogu przeglądu, poza plikami publicznej strony:

```sh
node --env-file=.env.drive-review scripts/drive-library.mjs download ID_PLIKU /workspace/drive-review/wybrany-projekt.pdf
```

Od tej chwili właściciel dodaje i aktualizuje materiały zwyczajnie w udostępnionych folderach Google Drive. Podczas pracy nad portfolio asystent może ponownie odczytywać ich zawartość. To odczyt na żądanie; asystent nie pracuje sam w tle poza aktywną sesją. Zmiany na Dysku **nie publikują się automatycznie** na stronie. Nowe realizacje nadal wymagają przeglądu i uzgodnionej akceptacji prezentacji.

## Zakres i utrzymanie

- API ma tylko operacje odczytu: foldery, lista plików, pobranie. Żądania zapisu są odrzucane.
- Wymaga `Authorization: Bearer …`; klucz nigdy nie trafia do URL, HTML, analityki ani kodu przeglądarki. Brak publicznego panelu i zmian w interfejsie strony.
- Przed pobraniem sprawdza przynależność pliku do dozwolonego drzewa folderów. Odrzuca kosz i skróty prowadzące poza tę strukturę.
- Uprawnienie Google to `drive.readonly`. Konto usługi widzi tylko zasoby, które mu udostępniono; nie przejmuje całego prywatnego Dysku.
- Limit: 60 uwierzytelnionych żądań na minutę na proces oraz 100 MB na plik. Większe PSD należy wyeksportować do lżejszego podglądu. Dokumenty Google są eksportowane do PDF, z dodatkowym limitem eksportu narzuconym przez Google.
- Pliki są przesyłane strumieniowo, bez zapisywania ich na efemerycznym dysku Rendera. Pobrania i odpowiedzi mają `no-store`, `noindex`; istniejący robots blokuje `/api/`.
- Nie dodano nowych zależności npm. Serwer wymaga połączeń wychodzących do `oauth2.googleapis.com` i `www.googleapis.com`. Środowisko robocze łączy się tylko z istniejącym adresem Rendera.
- Darmowy Render może potrzebować czasu na wybudzenie. Narzędzie czeka do 120 sekund. Błąd 502 wymaga sprawdzenia API Google, klucza konta i udostępnienia; nie oznacza sukcesu synchronizacji.
- Aby wyłączyć dostęp, usuń `DRIVE_LIBRARY_KEY` w Renderze i zrestartuj usługę. Możesz też cofnąć udostępnienie folderu lub usunąć klucz konta Google.
- Po zmianie środowiska roboczego przywróć jego prywatną zmienną/plik z kluczem. Nie obiecujemy trwałości sekretów na maszynie, którą platforma może odtworzyć.

Przed uznaniem połączenia za działające sprawdź rzeczywistą listę folderów i pobierz jeden testowy plik. Symulowane testy jednostkowe tego nie zastępują.
