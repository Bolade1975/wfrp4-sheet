# WFRP 4e Character Sheet

Offline karakterark til **Warhammer Fantasy Roleplay 4th Edition** — optimeret til tablet i portrait og landscape. Ingen backend, login eller cloud: alt gemmes lokalt i browserens IndexedDB. PDF til GM genereres på enheden.

**Åbn appen:** https://bolade1975.github.io/wfrp4-sheet/ — intet skal installeres på pc'en.

> Brugerfladen er på engelsk med de officielle WFRP 4e-termer. Layoutet følger det officielle karakterarks opbygning (Cubicle 7), men er en selvstændig brugerflade uden kopieret grafik eller regeltekst. Appen er et karakterark til eksisterende karakterer — ikke en character builder.

## Faner

| Fane                 | Indhold                                                                                                                                                                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Combat**           | Kompakt kampvisning: Wounds, Advantage, Fortune og Resolve som tællere, WS/BS/S/T/I/Ag med bonusser, Max Wounds/Walk/Run, Melee/Ranged/Dodge/Cool, våben markeret Current (test-værdi og damage), Armour Points pr. hit location, Conditions og Critical Wounds. Samme data som resten af arket — ingen kopier. |
| **Current Loadout**  | Kun genstande markeret _Current_ (medbragt/tilgængeligt nu): våben, rustning, udstyr, AP-kort og Encumbrance.                                                                                                                                                                                                   |
| **Tests**            | Hurtigopslag: alle Characteristics, søgbar skill-liste (favoritter først), valgfri difficulty (Difficulty Table s. 153) og egne _quick tests_. Characteristic, Skill og situationel modifier er altid mærket hver for sig.                                                                                      |
| **Character**        | Navn, species, class, career, career tier, career path, status, alder m.m., Ambitions og Party.                                                                                                                                                                                                                 |
| **Characteristics**  | Initial / Advances / Current / Bonus, career-markering (★), Fate/Fortune, Resilience/Resolve/Motivation, Experience, Movement og Wounds.                                                                                                                                                                        |
| **Skills**           | Ubegrænset antal, én pr. række, søgning, filtre (Basic / Grouped & Advanced / Career / Favourites), sortering, tilføj fra regelbogens skill-liste eller som brugerdefineret, rediger, flyt og slet. Nye karakterer starter med de Basic Skills, der er fortrykt på det officielle ark.                          |
| **Talents & Traits** | Talents (times taken, max, tests, beskrivelse), Traits, Psychology, Corruption og Mutations med grænser.                                                                                                                                                                                                        |
| **Spells & Prayers** | Name, TN, Range, Target, Duration, Effect + Sin.                                                                                                                                                                                                                                                                |
| **Inventory**        | Alt ejet udstyr: våben (med tilknyttet attack skill), rustning (locations, AP, worn), trappings, Wealth (GC/SS/D) og Encumbrance.                                                                                                                                                                               |
| **Experience**       | XP-log (earned/spent, hvad ændrede sig, før/efter, XP, session/dato, noter) med afstemt Total − Spent = Current.                                                                                                                                                                                                |
| **Notes**            | Noter, mål, relationer, historik. **Eksporteres aldrig til PDF.**                                                                                                                                                                                                                                               |
| **Export**           | PDF med valgfrie sektioner og JSON-backup af karakteren.                                                                                                                                                                                                                                                        |

## Regelgrundlag og beregninger

Alle automatiske beregninger er kontrolleret mod WFRP 4e Core Rulebook (PDF-sidetal = trykte sidetal). Kilden vises ved hver beregning (tryk på værdien), og alle beregnede værdier kan erstattes af en manuel værdi, der markeres **MANUAL** i app og PDF.

| Værdi                  | Regel                                                                       | Side        |
| ---------------------- | --------------------------------------------------------------------------- | ----------- |
| Current characteristic | Initial + Advances                                                          | 35, 47      |
| Characteristic Bonus   | tierciffer                                                                  | 34          |
| Skill                  | Characteristic + Advances; Advanced Skill uden Advances kan ikke testes     | 47, 117–118 |
| Wounds                 | SB + 2×TB + WPB (Halfling: 2×TB + WPB)                                      | 33–34       |
| Hardy                  | + TB (taget én gang; flere gange → manuel værdi, da bogen ikke angiver det) | 138         |
| Walk / Run             | 2× / 4× Movement                                                            | 35, 165     |
| Encumbrance-grænse     | SB + TB; overskridelse vises kun som påmindelse                             | 293         |
| Weapon damage          | "+SB+X" omregnes med Strength Bonus                                         | 293–294     |
| Difficulty             | modifier lægges til target (kun visning)                                    | 153         |
| Advantage              | +10 pr. Advantage — vises som påmindelse, lægges ikke til                   | 164         |
| Corruption-grænser     | mutationer > TB, mentale > WPB (reference)                                  | 183         |

**Manuelt (bevidst):** XP-omkostninger (du indtaster dem; app'en beregner dem ikke), samlet AP pr. hit location (bogen giver ingen generel regel for lag ud over Flexible armour, s. 299–300 — "Use sum" er en eksplicit knap), Fate/Resilience, Movement, conditions, critical wounds og alle genstandes stats.

## PDF til GM

Fanen **Export**: vælg sektioner (eller forvalg: Full sheet, Play summary, Inventory only, Loadout only). Side 1 viser hvilke sektioner der er med, hvad der er udeladt og eventuelle manuelle værdier. Hver side har karakternavn, eksportdato og "Page X of Y". Tabeller gentager kolonneoverskrifter på nye sider, rækker deles ikke, og overskrifter efterlades ikke alene nederst på en side. **Notes-fanen eksporteres aldrig**; noter på skills, talents og genstande følger med deres sektion.

## Lokal udvikling

Kræver Node.js 24+.

```bash
npm install
npm run dev        # udviklingsserver
npm run test       # Vitest (regler, XP, import/eksport, PDF)
npm run typecheck
npm run lint
npm run build      # production build i dist/
npm run preview    # server den byggede app lokalt (PWA aktiv)
```

`PDF_OUT=<mappe> npx vitest run src/pdf` skriver eksempel-, stress- og tomme PDF'er til inspektion.

## Backup og flytning mellem enheder

- **Characters → Download full backup** gemmer alle karakterer i én JSON-fil.
- **Import / restore…** validerer filen før noget skrives; ved konflikt vælger du _Add as copy_ (standard), _Replace existing_ eller _Skip_.
- Enkelte karakterer: **Export JSON** på listen eller fanen **Export**.
- Tag backup jævnligt — browserdata kan slettes, hvis man rydder webstedsdata.

## Installér som app (PWA)

Appen ligger på GitHub Pages: https://bolade1975.github.io/wfrp4-sheet/ — den bruges direkte i browseren, og der skal ikke installeres noget på pc'en.

På tablet (valgfrit): åbn adressen i Chrome/Samsung Internet, vent til siden er indlæst én gang, og vælg **Installer app** / **Føj til startskærm**. Herefter virker alt offline, også PDF.

## Deploy til GitHub Pages

Repository: https://github.com/Bolade1975/wfrp4-sheet (Settings → Pages → Source: GitHub Actions). Hvert push til `master` kører typecheck, lint, format-check, tests og build og deployer derefter (`.github/workflows/deploy.yml`). Appen bruger relativ `base`, så den virker under `/wfrp4-sheet/`.

Karakterdata kommer aldrig i repositoryet; `.gitignore` udelukker `*.wfrp4.json`, `wfrp4-backup-*.json` og `*.pdf`.

## Struktur

```
src/domain   datamodel (zod), migrering, import/eksport, eksempelkarakter
src/rules    ren beregningsmotor, regelreferencer, skill-liste, XP-afstemning
src/db       IndexedDB via Dexie
src/state    autosave-store
src/screens  karakterliste, karakterskærm og faner
src/ui       felter, lister, kampkomponenter
src/pdf      PDF-bygger (pdfmake) — separat lyst A4-layout
```
