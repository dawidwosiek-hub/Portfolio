# Uzupełnianie treści NADX

## Opublikowana realizacja Odwróceni

Zaakceptowany projekt jest opublikowany pod `/realizacje/odwroceni-projekty-oklejen`. Wpis w `site.json` dodaje go do strony głównej, filtrów „oklejenia” i „druk i reklama”, powiązanych projektów oferty oraz mapy witryny. Poprzedni link `/podglad/odwroceni-c0ec4c60be97` zwraca przekierowanie 301 do publicznej realizacji. Strona ma własny canonical i może być indeksowana.

`WrapProcess.astro` prowadzi przez kierunek graficzny, dwa warianty samochodu, rozmieszczenie na całej bryle, wizualizacje, adaptację na łódź i zdjęcia zastosowania. Materiały są widoczne podczas przewijania: bez rozwijanych źródeł i ukrytych filmów. Etapy opisują decyzje widoczne w materiałach; nie dorabiają nieudokumentowanych badań, kolejności akceptacji ani wyboru finalnego wariantu. Nowy szkic `public/media/odwroceni/studium-kompozycji.webp` jest retrospektywną ilustracją objaśniającą kompozycję, przygotowaną narzędziem imagegen na podstawie górnego wariantu samochodu. Publiczny podpis mówi wprost, że powstał na potrzeby prezentacji; nie przedstawia go jako historycznego szkicu autora. Obok są trzy objaśnienia dotyczące kierunku, punktu skupienia i ciągłości motywu.

`ProcessArtwork.astro` kadruje oryginalne plansze za pomocą widoków i masek SVG, usuwając z prezentacji wyłącznie zewnętrzne tło planszy. Nie zmienia pikseli grafiki, napisów, znaków, kolorów, kół ani szyb. Każdy bok, tył i góra mają własne miejsce na białej stronie i powiększenie dostępne myszką oraz klawiaturą. Dwa warianty samochodu i trzy widoki łodzi są wydzielone z dostarczonych zbiorczych plansz. Mały, osobny detal oznaczenia łodzi został usunięty na prośbę autora. Zdjęcia zachowują oryginalną zawartość; ich kadry na stronie określa CSS.

Nowe sceny `car-editorial-v2.webp` i `boat-editorial.webp` przygotowano narzędziem imagegen na podstawie oryginalnych plansz i dostarczonych materiałów. Pokazują samochód w jasnej scenie studyjnej oraz łódź na jeziorze. W poprawionej scenie samochodu przywrócono małe oznaczenie ODWROCENI.KLINIKA przy tylnej szybie na podstawie górnego wariantu oryginalnej planszy. Są opisane publicznie jako wizualizacje projektu, a oryginały i zdjęcia zastosowania pozostają osobnymi materiałami. Nie są dowodem wykonania fizycznego oklejenia samochodu ani sesji fotograficznej na wodzie. Nowe sceny mają 1536×1024 px, warianty 768 px i zachowują cały kadr również na telefonie. Powiązane plansze, filmy i zdjęcia zestawiono w zwarte kompozycje.

Mapa materiałów jest w `src/lib/odwroceni-media.ts`, a eksporty internetowe w `public/media/podglad/odwroceni-c0ec4c60be97/`. Otwarcie zawiera `odwroceni-story.mp4`: około 22 sekundy, najpierw plansza oryginalnego wariantu, następnie oba dostarczone filmy. Sekwencja zachowuje całe kadry klipów, ma 1280×720 px, H.264 i wyłączony dźwięk. Jest montażem materiałów prezentacyjnych, nie nagraniem fizycznej realizacji. Odtwarzacz nie używa autoplay; przyciski etapów przewijają do planszy, detali i kolejnych widoków bryły. Pełne klipy źródłowe pozostają dostępne z podpisanych linków pod odtwarzaczem. Główna scena samochodu ma osobny przycisk powiększenia. Prezentacja rozróżnia wizualizacje samochodu od zdjęć łodzi; zakres pracy obejmuje projektowanie grafiki i materiały wizualne. Nie przypisuje NADX oklejania ani produkcji. Ścieżki dotychczasowych plików multimedialnych zachowano, aby nie zmieniać działających adresów; nazwa katalogu „podglad” nie oznacza już statusu projektu.

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

Aktualna strona SHIRO korzysta z własnego komponentu `ShiroCase.astro`; Odwróceni używają `WrapProcess.astro`, a pozostałe realizacje zachowują układ ogólny. Otwarcie SHIRO stanowi plansza `.shiro-brand-board`: oryginalny znak na bieli, czerwony akcent H oraz powiększenie tej samej litery na czerwonym polu. Barwienie przez maskę CSS i kadr SVG korzystają z oryginalnego `logo.webp`, bez przerysowywania znaku. Eksporty `shiro-mark-presentation-*.webp` służą jako miniatury i obraz udostępniania. Odrzucone `shiro-brand-scene.webp` nie jest używane w stronie ani metadanych. Nowa scena koszulki i bluzy (`shiro-apparel-scene.webp`) otwiera część odzieżową. Scenę odzieżową przygotowano narzędziem imagegen na podstawie istniejących projektów i podglądów; jest podpisana jako wizualizacja i ma 1536×1024 px oraz wersję mobilną 768 px. Plansza logo jest renderem rzeczywistego komponentu strony, ma proporcję 1.85 i eksporty 1536×830 oraz 768×415 px. Można ją odtworzyć poleceniem `node scripts/render-business-card-preview.mjs http://localhost:4322 shiro-logo-i-wizytowki public/media/shiro/shiro-mark-presentation .shiro-brand-board 1.85`. Oryginalne logo, bezstratne projekty wizytówek, awers i rewers vouchera oraz naklejka pozostają widoczne jako osobne materiały; oryginalne animacje odzieży są widoczne jako dwa duże odtwarzacze obok sceny produktowej, z własnym sterowaniem i wyciszeniem. Powtarzany mockup wizytówek został zastąpiony jednym zestawieniem obu oryginałów; naklejka, baner i flagi tworzą wspólną kompozycję. Zmiana nie jest deklaracją wyprodukowania prezentowanych przedmiotów.

Pierwsza realizacja jest wpisana w `site.json` jako `shiro-logo-i-wizytowki`. Materiały internetowe znajdują się w `public/media/shiro/`. Wpis jest widoczny na stronie głównej, w portfolio oraz przy usługach logo i druku. Opcjonalna tablica `categories` dodaje kolejne kategorie, zachowując główną `category`.

`logo` zawiera `src`, `alt`, rzeczywiste `width` i `height` oraz `caption`. Obecny znak to oryginalny raster z przezroczystością wyodrębniony z obiektu osadzonego w dostarczonym `sh1.psd`. Nie został odtworzony przez AI ani zwektoryzowany. `invert: true` wyświetla biały znak w czerni na białym tle; plik źródłowy pozostaje biały. Po dostarczeniu docelowego kolorowego SVG można zastąpić `src`, wymiary i wyłączyć `invert`.

`scopeItems` to lista rzeczywiście wykonanych prac. `galleryTitle` i `galleryIntro` opisują galerię. Wpisy `gallery` mogą mieć `width`, `height`, `smallSrc`, `caption` i `kind`. `original` opisuje oryginał, a `visualization` — wizualizację. Źródła i dodatkowe detale są dostępne w rozwijanym podglądzie. Brak `kind` traktowany jest jak zwykła galeria. Dla obrazu głównego istnieją analogiczne `imageSmall`, `imageWidth`, `imageHeight` i `imageCaption`. Małe wersje powinny mieć 768 px szerokości; duże — podaną szerokość. Przeglądarka dobiera plik do ekranu.

Mockupy zastosowań SHIRO powstały z użyciem AI. Publiczne podpisy określają je jako wizualizacje projektu. Nie są dokumentacją fizycznego wydruku. Wizytówki korzystają z osobnej prezentacji opisanej poniżej, która zachowuje oryginalne projekty bez generowania ich zawartości. Autorstwo logo i projektów wizytówek potwierdził Dawid Wosiek. Wpis nie przypisuje autorstwa znaku COMPSPORT ani fotografii samochodu, nie podaje niepotwierdzonych wyników ani wykonania nakładu.

`identity` opisuje typografię i kolory prezentowanych materiałów. SHIRO korzysta z Red Hat Display wskazanego w dostarczonej planszy identyfikacji. Font jest lokalny (`public/fonts/red-hat-display.woff2`), z licencją SIL OFL w pliku `red-hat-display-OFL.txt`; źródło: Google Fonts / Red Hat. Kolory służą prezentacji materiałów; nie są opisane jako ustalone specyfikacje produkcyjne.

`applications` to uporządkowane zastosowania marki. Każdy wpis ma `slug`, `label`, `title`, `description` oraz obraz `image` zgodny ze schematem galerii. Opcjonalny `original` udostępnia projekt źródłowy w rozwijanym podglądzie i pozwala go powiększyć. `concept: true` oznacza pracę koncepcyjną. Strona automatycznie tworzy skróty do zastosowań i numery rozdziałów.

Naklejkę wyeksportowano z `Shiro_WLEPY.psd`, a planszę obuwia z `sh1.psd`. Wizualizacja flag opiera się na dostarczonej planszy Wulkanizacja / Mechanika. Wszystkie nowe mockupy mają białe tło i podpis wskazujący wizualizację projektu. Koncepcja obuwia nie jest oferowana jako wyprodukowany model ani jako usługa produkcji obuwia. Adres realizacji pozostaje bez zmian, aby zachować istniejące linki.

Vouchery: `SHIRO_VOUCHER_FRONT.pdf` i `voucher_2_poprawka1.pdf` zawierają awers i rewers tego samego materiału. Oba oryginały wyeksportowano do WebP; w `originals` można dodać wiele obrazów źródłowych do jednego zastosowania. Mockup pokazuje oba projekty na białym tle. Wizualizacja banera opiera się na dosłanej grafice SHIRO Mechanic & Chiptuning. Zdjęcia samochodów nie są przypisane jako autorstwo fotograficzne NADX.

`applications[].videos` obsługuje listę filmów z `src`, `poster`, `title`, `caption`, `width` i `height`. Zastosowanie może zawierać same filmy, bez `image`. Oryginalne `TS_BLACK.mp4` i `Bluza.mp4` to animowane wizualizacje odzieży SHIRO. Eksporty H.264/AAC mają 720×1280 px, około 8,3 s, zachowaną ścieżkę audio i metadane usunięte z plików. Odtwarzacze mają sterowanie, `preload="none"`, `playsinline` i domyślne wyciszenie; nie używają autoplay. Plakat jest kadrem z odpowiedniego filmu. Prezentacje nie są opisane jako zdjęcia wykonanych nadruków.

Główne tło całej witryny jest białe (`--paper: #ffffff` w `src/styles/global.css`). Pomocnicze panele mają neutralne szarości, a sekcje czarne i żółte zachowują kolory NADX.

### Spójna prezentacja na bieli

Mockupy zastosowań SHIRO używają plików `*-cutout-*.webp` oraz `*-studio-*.webp` z rzeczywistym kanałem alfa. Przezroczystość dotyczy otoczenia obiektów; kolory druku i projekty pozostają częścią wizualizacji. Pliki przygotowano narzędziem imagegen i wyeksportowano w dwóch szerokościach. Nie dodawaj pod nimi szarego tła ani obramowania — kompozycja ma łączyć się bezpośrednio z bielą strony. Zdjęcia i oryginalne projekty produkcyjne zachowują własną zawartość.

Każde zastosowanie ma teraz jedną dużą prezentację, wspólną maksymalną szerokość i tę samą hierarchię opisu. Komponent `ProjectSources.astro` udostępnia oryginały w natywnym rozwijanym podglądzie; pliki źródłowe można nadal otworzyć w pełnym rozmiarze. Dodatkowe zbliżenie wizytówki jest w tym podglądzie, zamiast powtarzać materiał na końcu strony.

`videos[].preview` wskazuje jasny podgląd odzieży w schemacie `ProjectMedia`. Jest to wizualizacja AI oparta na kadrze; sam film pozostaje dostarczoną animacją. `ProjectFilms.astro` otwiera oryginalną animację w natywnym oknie dialogowym po kliknięciu. Zamknięcie przyciskiem lub Escape zatrzymuje film i przywraca fokus. Plik nie uruchamia się przy wejściu na stronę.

`shareImage` pozwala użyć oddzielnego, nieprzezroczystego obrazu Open Graph do udostępniania linków. Dla SHIRO zachowano wariant na bieli, aby podgląd pozostał czytelny także w aplikacjach z ciemnym tłem.

## Kontakt i prywatność

`email`, `phone`, `portrait`: puste pola są ukryte. `socials`: obiekty `{"label":"Nazwa profilu","url":"https://prawdziwy-adres"}`. `about`: naturalny opis w pierwszej osobie. `administrator`: pełna prawdziwa tożsamość administratora i dane adresowe, `privacyContact`: rzeczywisty kontakt do spraw danych, `hostingProvider`: faktyczny hosting. Samo uzupełnienie e-maila w JSON nie konfiguruje wysyłania serwerowego. Bez niej strona przygotowuje lokalny szkic wiadomości z adresem odbiorcy, tematem i treścią. Użytkownik otwiera swoją pocztę lub kopiuje treść; interfejs nie ogłasza wysłania wiadomości. Przy awarii skonfigurowanego API oferuje ten sam wariant bez utraty danych. Termin jest opcjonalny; pusty trafia do wiadomości jako „Do ustalenia”. Dane administratora i kontakt prywatności uzupełniono istniejącymi publicznymi danymi Dawida Wośka, a hosting wskazuje faktyczny Render.

## Statystyki, opinie i zgody

- `statistics`: `{"label":"Nazwa wskaźnika","value":"Potwierdzona wartość","confirmed":true,"context":"Źródło; dla filmu: materiał, platforma i data pomiaru"}`. Niepotwierdzone wpisy są ukryte.
- `testimonials`: `{"quote":"Prawdziwa opinia","author":"Autor","role":"Kontekst","consent":true}`. Wymagana rzeczywista zgoda na publikację.
- `clientLogos`: `{"src":"/media/klient.svg","name":"Nazwa klienta","consent":true}`. Tylko logotypy z prawem publikacji.
- `comparisons`: `{"title":"Opis porównania","before":"/media/przed.webp","after":"/media/po.webp","beforeAlt":"Opis przed","afterAlt":"Opis po","published":true}`. Identyczne proporcje i porównywalne kadry. Suwak obsługuje dotyk i klawiaturę. Pusta tablica ukrywa całą sekcję.

Nie dodawaj danych wrażliwych ani sekretów do publicznych treści. Podglądy, prace koncepcyjne i demonstracyjne powinny pozostać oddzielone od prawdziwego portfolio.

## Logo i ikony

Oryginał marki: `public/brand/nadx-logo.svg`. Nagłówek, stopka i kompozycje strony korzystają z tego pliku bez odtwarzania kształtu znaku. Po jego zmianie uruchom `npm run brand:assets` (wymaga Chromium wskazanego w README), a następnie build. Skrypt eksportuje SVG, PNG 32×32 i ikonę Apple 180×180 oraz obraz Open Graph 1200×630. Nową wersję favicony można wymusić przez zmianę parametru wersji w `src/layouts/Layout.astro`.

### Wierne wizytówki i mockupy odzieży

`presentation: "business-cards"` włącza komponent `BusinessCards.astro`. Pobiera pierwsze dwa oryginały z `gallery` i pokazuje je z delikatnym obrotem i cieniem CSS, bez zmieniania logo, tekstów ani układu. Odrzucone wizualizacje AI wizytówek i zbliżenia nie są używane. Sekcja źródeł pozwala powiększyć oba płaskie projekty.

Pomocnicze eksporty `wizytowki-native-*.webp` pozostają w zasobach; aktualną miniaturą i obrazem udostępniania SHIRO jest scena fotograficzna opisana wyżej. Do eksportu aktualnego zestawienia oryginalnych wizytówek można użyć selektora `.print-pair`. Uruchom lokalną stronę na porcie 4322, a w drugim terminalu:

```sh
node scripts/render-business-card-preview.mjs http://localhost:4322 shiro-logo-i-wizytowki public/media/shiro/wizytowki-native .print-pair
```

Skrypt wymaga Chromium dostępnego w tym środowisku (inny plik wykonywalny można wskazać przez `PLAYWRIGHT_CHROMIUM_EXECUTABLE`). Generuje przezroczyste miniatury 768/1536/3072 px i nieprzezroczysty obraz udostępniania. Wszystkie trzy ścieżki są zapisane w `site.json`.

Podglądy koszulki i bluzy `*-studio-*.webp` to nowe, spójne mockupy AI na przezroczystym tle: odzież ułożona na płasko, naturalne fałdy i faktura bawełny, niewielki znak na środku klatki piersiowej zgodnie z dostarczonymi animacjami. Oryginalne filmy pozostały dostępne po kliknięciu. Ich zawartość nie została zmieniona.

### Diverto — materiały promocyjne

Realizacja `diverto-materialy-promocyjne` obejmuje wyłącznie dostarczoną oprawę CD i roll-up. Jest widoczna na stronie głównej, w kategorii `druk i reklama`, przy odpowiedniej usłudze i w sitemapie. Przycisk kontaktowy przekazuje nazwę Diverto i wybiera usługę druku. Ulotka nie została dodana, ponieważ przesłany PDF przekracza limit transferu 32 MiB; potrzebny jest lżejszy eksport.

Pliki `public/media/diverto/` są renderami oryginalnych PDF-ów. Usunięto marginesy techniczne i znaczniki cięcia zgodnie z formatem projektu; nie generowano ponownie zdjęć, napisów ani znaków. Okładka, trzy wkładki i nadruk na płytę pochodzą z pięciu stron `Diverto_płyta1_v1.pdf`; roll-up z `Diverto_rollup.pdf`. Źródłowych PDF-ów nie udostępnia się publicznie. Duże obrazy mają 1536 px szerokości, a pionowy roll-up 1024 px; wersje mobilne mają 768 px.

`mockup` w projekcie lub zastosowaniu pozwala wyświetlić oryginalne grafiki w komponencie `PrintMockup.astro`. `kind: "cd"` przyjmuje `cover` i `disc`, a `kind: "rollup"` — `artwork` (każdy obraz ma standardowy schemat `ProjectMedia`). Opakowanie, obrót, cienie i podstawa roll-upu są elementami CSS. To prezentacja projektów, nie zdjęcia fizycznej produkcji. Strona nie przypisuje NADX autorstwa fotografii ani logo zespołu i nie podaje niepotwierdzonych wyników.

`galleryLabel` ustala nazwę skrótu w nawigacji realizacji, a `accent` lokalny kolor akcentu. Diverto korzysta z bordo `#a51e3c` dopasowanego do oprawy płyty. Białe tło strony pozostaje wspólne dla portfolio.

Miniaturę i podgląd udostępniania wygenerujesz z działającej strony lokalnej:

```sh
node scripts/render-business-card-preview.mjs http://localhost:4322 diverto-materialy-promocyjne public/media/diverto/album-preview .album-stage
```

Opcjonalny czwarty argument skryptu wskazuje komponent do eksportu; domyślnie jest to `.card-stage` dla wizytówek SHIRO. Miniatury są eksportem tego samego układu, który widnieje na stronie projektu.

### Jakość źródeł wizytówek SHIRO

PDF-y wizytówek zawierają pojedyncze rastry 1110×638 px w CMYK, bez wektorów i warstw tekstowych. Bezstratne PNG `mechanic-source.png` i `car-rental-source.png` zostały wyodrębnione z osadzonych obrazów i przekonwertowane do RGB na potrzeby przeglądarki. Są używane bez pośredniego skalowania i kompresji stratnej, zarówno w mockupie, jak i przy powiększaniu źródeł. Maksymalna szerokość kompozycji na stronie jest ograniczona do 960 px. Wcześniejsze powiększone i skompresowane obrazy nie są już używane.

Eksporter miniatur renderuje komponent przy skali urządzenia 2× i zapisuje również obraz 3072 px. Większy rozmiar miniatury poprawia krawędzie kompozycji, ale nie zwiększa ilości szczegółów w oryginalnej grafice. Idealnie ostre większe zbliżenia wymagają źródłowego PSD albo PDF/SVG z zachowanym tekstem i wektorami. Nie należy odtwarzać napisów ani logo przez generowanie AI i przedstawiać tego jako niezmieniony oryginał.

Opcjonalne `imageMedium` (lub `mediumSrc` wewnątrz `ProjectMedia`) wskazuje wariant 1536 px, gdy duży plik ma 3072 px. Dzięki temu przeglądarka wybiera 768, 1536 albo 3072 px zależnie od wielkości obrazu i gęstości ekranu. Warianty 3072 px służą ostrzejszym miniaturom obu realizacji; oryginały SHIRO pozostają bezstratnymi obrazami 1110 px.

### OLSEN — odzież firmowa

Realizacja `olsen-odziez-firmowa` wykorzystuje pięć stron dostarczonego `olsen_wizu2.pdf`: kurtkę, bluzę z kapturem i czapkę z wizualizacjami haftu oraz dwa warianty koszulki DTF. Jest widoczna w portfolio, na stronie głównej i przy usłudze odzieży; kontakt zachowuje nazwę OLSEN i wybiera `odziez-i-nadruki`. Zakres opisuje projektowanie oznakowania i dokumentację. Nie potwierdza fizycznej produkcji ani autorstwa samego logo.

`public/media/olsen/` zawiera obrazy WebP plansz i eksporty SVG z oryginalnego PDF-a. Usunięto z kadru nagłówki akceptacyjne i stopki dokumentu; układ odzieży, znaków oraz wymiarowanie zachowano. Wektory z oryginału pozostają wektorami, a osadzone rastry nie zostały odrysowane. Opcjonalne `fullSrc` w `ProjectMedia` kieruje przy powiększeniu do SVG; na stronie ładowane są mniejsze WebP. Oryginalny PDF pozostaje poza publicznym katalogiem.

Bazy mockupów odzieży wygenerowano narzędziem imagegen z prawdziwym kanałem alfa i bez znaków. Komponent `ApparelPresentation.astro` nakłada na nie niezmienione grafiki PNG wyodrębnione z PDF-a. Nazwy, telefon i e-mail nie są generowane przez AI. `screen: true` usuwa optycznie czarny podkład wizualizacji haftu przez tryb mieszania CSS; oryginalny plik pozostaje niezmieniony. Mockupy mają publiczny podpis „Wizualizacja projektu” i nie są zdjęciami wykonanych produktów.

Pole `apparel` w projekcie lub zastosowaniu zawiera: `base` (standardowy `ProjectMedia`), `layout` (`pair` lub `single`), dostępny opis `label`, podpis `caption` oraz listę `marks`. Każdy znak ma `image`, pole `view` (`front`, `back` lub `single`), `centerX` (pozioma oś znaku), `top` i `width` w procentach konkretnego ujęcia. Dla par baza zawiera przód po lewej i tył po prawej; na telefonie oba ujęcia pokazują się jedno pod drugim, a rozmieszczenie znaków zostaje zachowane. Nie dodawaj pod mockupami szarych paneli ani obramowań.

Po zmianie układu kurtki zaktualizuj miniatury z działającej strony lokalnej:

```sh
node scripts/render-business-card-preview.mjs http://localhost:4322 olsen-odziez-firmowa public/media/olsen/ulozenie '.case-hero .apparel-stage'
```

Wizualizacja koszulki pokazuje pierwszy wariant DTF. Oba oryginały dostępne są pod wspólnym podglądem w sekcji koszulek. Projekt czapki zachowuje źródłową grafikę; wymiarów z dokumentacji nie przepisano do publicznego opisu jako specyfikacji produkcyjnej.

Rozmieszczenie OLSEN skorygowano względem oryginalnych plansz i osi odzieży. Przednie znaki są osadzone na panelu klatki piersiowej, a tylne na środku pleców; na bluzie uwzględniono dolną krawędź kaptura. Współrzędne dotyczą każdego ujęcia osobno. Znaki są pozycjonowane względem własnego środka, dzięki czemu zmiana szerokości nie przesuwa ich w bok. Aktualne miniatury mają prefiks `ulozenie-`, żeby przeglądarki nie wyświetlały z pamięci wcześniejszych wersji.

## Przejście od realizacji do zapytania

`ProjectInquiry.astro` kończy obie prezentacje konkretnym zakresem i linkiem do kontaktu. Dla opublikowanego SHIRO przekazuje nazwę oraz usługę; dla opublikowanych Odwróconych przekazuje nazwę projektu, temat oklejenia i usługę druku. Są też bezpośrednie linki e-mail i telefonu. Tematy kontaktu są wybierane z jawnej listy. Nie podano niepotwierdzonych terminów odpowiedzi, cen ani wyników sprzedaży.
