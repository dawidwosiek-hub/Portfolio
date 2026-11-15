# Sesja produktowa portfolio

Wspólna prezentacja czterech realizacji: Odwróceni, SHIRO, Diverto i OLSEN. Zestaw zawiera 35 ujęć kontrolnych, 141 eksportów WebP i trzy pliki MP4. Podmieniono 135 istniejących obrazów i trzy filmy; dodano sześć obrazów szczegółów łodzi. Dotychczasowe nazwy i rozmiary istniejących eksportów są zachowane.

[Arkusz kontrolny](public/media/studio-review/arkusz-kontrolny.jpg) · [Pełna lista plików](STUDIO-FILES.md) · [Manifest eksportów i źródeł](assets/studio-session/session-manifest.json)

## Jedna oprawa

- Neutralne studio: tło `#f0f0f0`, jasne powierzchnie w zakresie `#ececec–#f4f4f4`, docelowa temperatura 5500 K.
- Duży softbox z lewej-góry, miękkie cienie kontaktowe skierowane w prawo-dół. Kalibracja dotyczy pustych scen, przed nałożeniem grafiki klienta.
- Odzież: wspólne bazy tkaniny, widoki z góry, fałdy oraz niewielkie przemieszczenie nadruku zgodne z powierzchnią materiału. Haft korzysta z istniejących rastrowych wizerunków nici.
- Druk: fizyczne karty, papier i grubość krawędzi, powtarzalna perspektywa w obrębie rodziny produktów. CD ma rzeczywiste pudełko oraz płytę. Baner ma oczka i jest zamocowany na ścianie warsztatu; flagi i roll-up stoją na podstawach w jasnym otoczeniu stoiska.
- Łódź: dostarczona wizualizacja została umieszczona na fizycznych podporach. Prawdziwe fotografie i oryginalne widoki projektu są pokazane jako papierowa dokumentacja, z dostępem do plików źródłowych.

Nie potwierdzono, że Lamborghini jest samochodem klienta, dlatego wycofano je z okładek, aktywnej prezentacji Odwróconych oraz montażu filmów. Starsze plany samochodu zachowano w `assets/studio-session/originals/withdrawn-car/`. Historyczne nazwy niektórych eksportów z członem `car-editorial` pozostały dla zgodności adresów; aktualnie zawierają łódź.

## Oryginalne projekty

AI wykorzystano wyłącznie do pustych baz produktów i otoczenia, bez logo, napisów, danych kontaktowych i bez przesyłania grafik klienta. W `assets/studio-session/bases/` jest 16 nowych pustych baz oraz dwie wcześniejsze bazy bez grafiki: wizytówki i CD. Pusty wariant `boatroom.png` jest zachowany jako niewykorzystane źródło; prezentacja łodzi używa `cradle.png`.

Kompozytor `scripts/studio-session.py` odczytuje istniejące grafiki klienta. Nakłada je przez homografię, maski, multiply/screen i niewielkie przemieszczenie zgodne z fałdami. Nie przepisuje numerów telefonów ani nie odtwarza znaków przez generowanie. Przy banerze i flagach źródłem jest istniejący raster prezentacji, z którego wydzielono grafikę; repozytorium nie zawiera oryginalnego PDF tych dwóch projektów.

Źródłowe PNG, SVG i logo SHIRO pozostają niezmienione. Dla obrazów WebP, których adresy otrzymały nową prezentację, zachowano niezmienione kopie w `assets/studio-session/originals/`. Dwanaście plików przeznaczonych do powiększania dostępnych jest też w `public/media/originals/`. Porównanie SHA-256 z `original-hashes.json` potwierdza identyczność źródeł sprzed sesji. Perspektywa, dopasowanie do materiału i kompresja WebP zmieniają piksele wynikowej fotografii, zgodnie z dozwoloną obróbką; oryginalny projekt pozostaje osobnym, niezmienionym plikiem.

Zachowano alty i podpisy istniejących materiałów. Wyjątkiem są opisy wycofanego samochodu, dawnych plenerowych mockupów i filmu: zastąpiono je opisami zgodnymi z aktualną prezentacją łodzi i czterech realizacji.

## Odtworzenie eksportów

Wymagane: Python 3, zależności z `assets/studio-session/requirements.txt` oraz font `/usr/share/fonts/truetype/open-sans/OpenSans-Regular.ttf`. Filmy dodatkowo wymagają FFmpeg/ffprobe, Node, zależności npm i Chromium. Generowanie baz nie jest częścią ponownego eksportu: wszystkie puste bazy znajdują się już w repozytorium.

```sh
python3 -m venv /tmp/nadx-studio-venv
/tmp/nadx-studio-venv/bin/pip install -r assets/studio-session/requirements.txt
/tmp/nadx-studio-venv/bin/python scripts/studio-session.py

NADX_FILM_SOURCE_ROOT=/tmp/nadx-studio-staging \
NADX_FILM_OUTPUT=/tmp/nadx-studio-staging/public/media/nadx \
npm run motion:render

NADX_FILM_SOURCE_ROOT=/tmp/nadx-studio-staging \
NADX_FILM_OUTPUT=/tmp/nadx-studio-staging/public/media/podglad/odwroceni-c0ec4c60be97 \
node scripts/render-nadx-cinematic.mjs --edit assets/studio-session/boat-film-edit.json

/tmp/nadx-studio-venv/bin/python scripts/studio-session.py --finish-review
```

Wyniki powstają w `/tmp/nadx-studio-staging`, bez nadpisywania publicznych plików. `scenes/` zawiera pełne ujęcia, a `arkusz-kontrolny.jpg` cały zestaw, z czterema okładkami w pierwszym rzędzie.

Przed zastosowaniem należy obejrzeć arkusz i pełne ujęcia oraz poprawić odstające elementy. Po rzeczywistej ocenie wpisuje się w manifest pole `quality_review` z `completed: true` oraz ustaleniami przeglądu. Następnie zapisuje się SHA-256 bieżącego `manifest.json` w `/tmp/nadx-studio-staging/REVIEWED`. Skrypt `--apply` odrzuca brak pieczęci, pieczęć dla starszego manifestu i pliki o zmienionej sumie SHA-256.

```sh
/tmp/nadx-studio-venv/bin/python scripts/studio-session.py --apply
/tmp/nadx-studio-venv/bin/python tests/studio-session.test.py
```

Nowy render unieważnia wcześniejszą ocenę. To zabezpieczenie kolejności pracy; nie zastępuje oględzin.

## Wykonana kontrola

Arkusz oceniono przed podmianą plików. W trakcie przeglądu poprawiono prostokątne pozostałości tła na flagach, kadry kart i voucherów, maskę płyty, drobne obce fragmenty w wycięciu motywu buta oraz podparcie łodzi. Odstający detal łodzi usunięto z zestawu. Film ma łagodne przenikania bez przejść przez czarną planszę.

Zachowano zmiany strony głównej z PR #1, pobrane przez `git pull --ff-only origin nadx-site` do `0bbf1fa`. `index.astro` i `Process.astro` nie były edytowane. Jedna poprawka w `Projects.astro` wyrównuje szerokość okładek między parzystymi i nieparzystymi wierszami przy 761–1050 px, utrzymując układ naprzemienny z PR.

Testy źródeł, sum eksportów, rozmiarów i projekcji; kontrola Astro; 29 testów przeglądarkowych; testy API; test projekcji mockupów i odizolowany test portfolio zakończyły się powodzeniem. Obejrzano strony przy 390 i 1440 px, testy obejmują także 768 px. Nie występuje poziome przewijanie ani błędy pobierania zasobów w tych widokach. Szczegóły: [VALIDATION.md](VALIDATION.md).
