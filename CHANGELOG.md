# Changelog

Versioner følger [Semantic Versioning](https://semver.org/). Datamodellens version (`CHARACTER_SCHEMA_VERSION`) står separat.

## 0.4.0 — 2026-11-20

### Ændret

- Character-fanen: **Career** er nu en drop-down med karriererne fra din importerede regelbog (grupperet efter klasse; uden import vises navnelisten). **Career Path** er en drop-down med de fire niveauer for den valgte karriere og udfylder Career Tier og Status. Begge har "Other (type manually)…" til fri indtastning.
- Career Tier og Career Path holdes i trit: vælger du niveau, opdateres Path og Status, når niveauerne kendes.

## 0.3.0 — 2026-11-20

### Tilføjet

- Ny fane **Careers**: alle 64 karrierer fra Core Rulebook grupperet efter klasse. Vælg karriere og niveau (Path) med ét tryk; Career, Career Tier, Career Path, Status og Class på Character-fanen udfyldes automatisk.
- **Import fra din egen regelbogs-PDF** direkte i browseren (pdf.js, intet installeres, intet uploades). Niveautitler, status, skills, talents, trappings og Advance Scheme-niveau 1 læses automatisk. Niveau 2–4 i Advance Scheme vælger du selv (de er grafik i PDF'en). Data gemmes kun på enheden og i fuld backup — aldrig på GitHub.
- Boksen **Career advancement** på Character-fanen: hvad du kan bruge XP på nu (characteristics op til dit niveau, skills fra niveau 1 til dit niveau, talents fra dit niveau, s. 47–48), status for at fuldføre niveauet (s. 48), "+ Add" for manglende skills og "Mark as Career skills". XP-omkostninger beregnes stadig ikke.
- Fuld backup indeholder karrierebiblioteket, så en import på pc kan flyttes til tablet.

### Ændret

- Wealth-noterne er nu fire store tekstfelter med flere linjer, der fylder boksen ud.

## 0.2.0 — 2026-11-20

### Tilføjet

- **Career** og **Race** markering ud for hver skill (to tryk-knapper i skill-rækken, også i Edit). Nyt filter "Race" på Skills-fanen. Markeringerne er til reference og ændrer ingen værdier.
- **Wealth**-boksen har fire små notefelter (gæld, opsparing mv.). Udfyldte noter kommer med i PDF'en.
- PDF: skill-tabellerne har kolonnerne Career og Race.

Eksisterende karakterer indlæses uændret (nye felter er tomme/umarkerede).

## 0.1.0 — 2026-11-20

Første version (datamodel v1). Ikke udgivet eller deployet.

- Offline WFRP 4e-karakterark (PWA) med flere karakterer, autosave og JSON-backup/gendannelse.
- Faner: Combat, Current Loadout, Tests, Character, Characteristics, Skills, Talents & Traits, Spells & Prayers, Inventory, Experience, Notes, Export.
- Verificerede beregninger med sidehenvisninger og manuelle overrides (markeret MANUAL).
- XP-log med manuelt indtastede omkostninger og afstemning (Total − Spent = Current).
- A4-PDF med valgfrie sektioner; Notes-fanen eksporteres aldrig.
