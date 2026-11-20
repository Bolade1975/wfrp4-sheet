# Changelog

Versioner følger [Semantic Versioning](https://semver.org/). Datamodellens version (`CHARACTER_SCHEMA_VERSION`) står separat.

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
