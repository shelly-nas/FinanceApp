# FinanceApp — doorlichting

Doorloop van 42 bronbestanden (~4.510 regels) op commit `97cf4da`, 3 september 2026.
Bevindingen zijn genummerd op prioriteit, niet op vindplaats.

## Waar het staat

De architectuur is gezond: een duidelijke driedeling controller → manager → database,
RTK Query voor alle client-calls, en een classificatie-pipeline die in lagen is
opgezet (merchant-regels → Bayes → bankcategorie). Het ASN-werk uit de laatste
commits is zorgvuldig gedaan, inclusief de datum-valkuil en de losse aanhalingstekens.

De zwakke plek zit in het *model*, niet in de code-kwaliteit. De app kent één weg
naar binnen (CSV-upload) en één weg naar de data (het reviewscherm, dat alleen
opent vanuit een upload of vanuit een categorieselectie). Er is geen plek waar je
zomaar door alles heen kunt lopen. En de twee dingen die dubbeltellen —
overboekingen tussen eigen rekeningen, en dubbel geïmporteerde regels — worden
op geen enkel punt afgevangen.

---

## Blokkerend

### 1. Overboekingen tussen eigen rekeningen tellen dubbel mee

`server/src/managers/financeManager.ts:118` · `server/src/machineLearningModels/dutchMerchantRules.ts:61`

Er zit geen transfer-, dedup- of tegenboekingslogica in de code. Wat er wel is, is
de categorie `Overboekingen`, in `initProd.sql` als `income_outcome = 'Uitgaven'`
geclassificeerd.

Gevolg: €500 van de Rabobank-betaalrekening naar de ING-spaarrekening, beide CSV's
geïmporteerd, geeft twee regels — één Debit van €500, één Credit van €500. In
`getIncomeExpensesSum()` wordt de Rabobank-regel als €500 uitgave geteld en de
ING-regel als €500 inkomen. Het maandoverzicht laat €500 méér inkomen en €500 méér
uitgaven zien dan er werkelijk was, en de spaarquote is vertekend.

De `account_type`-verdeling in de accountstabel (Checking / Savings / Investments)
geeft wat nodig is om dit te herkennen: een transactie waarbij zowel `account` als
`counterparty` in `accounts.details` voorkomen, is per definitie intern.

### 2. Dubbele import wordt niet tegengehouden

`server/src/managers/financeManager.ts:12` · `database/initProd.sql:39`

`addTransactions()` doet een blinde `INSERT` per regel. Er is geen unieke constraint
op de transactietabel behalve de serial `id`. Bij een tweede import van hetzelfde
bestand — makkelijk gedaan bij overlappende exportperiodes — staat alles er twee
keer in en klopt elke som.

Banken leveren geen stabiel transactie-ID in deze CSV-formaten, dus een natuurlijke
sleutel is de praktische oplossing: een hash over datum + rekening + bedrag +
debit/credit + omschrijving.

```sql
ALTER TABLE public.transactions ADD COLUMN import_hash VARCHAR(64);

CREATE UNIQUE INDEX idx_transactions_import_hash
  ON public.transactions(import_hash)
  WHERE import_hash IS NOT NULL;
```

Randgeval: twee identieke pinbetalingen op dezelfde dag bij dezelfde zaak zijn
legitiem. Neem daarom een volgnummer per (datum, rekening, bedrag, omschrijving)
mee in de hash.

### 3. De twee schemabestanden zijn uit elkaar gelopen

`database/initTables.sql` · `database/initProd.sql`

`initProd.sql` heeft de kolom `income_outcome`, de tabellen `tags` en
`transaction_tags`, en de bijbehorende indexen. `initTables.sql` heeft dat niet.
Wie de app lokaal opzet met `initTables.sql` krijgt een database waarop
`getIncomeExpensesSum()` faalt en de tags-functionaliteit stukloopt.

In `initTables.sql` staan bovendien hardgecodeerde credentials (`financier / m0n3y`
en een superuser `admin / Buvpe_74`). Die staan in de git-historie en zijn dus hoe
dan ook verbrand.

`initProd.sql` draait alleen bij een lege volume. Een bestaande productiedatabase
krijgt nieuwe kolommen nooit te zien — er zijn migraties nodig, geen bootstrapscript.

### 4. De maandnavigatie muteert de Date in plaats van hem te vervangen

`client/src/scenes/dateRange/DateRangeContext.tsx:26`

`incrementMonth()` roept `dateOneMonthAgo.setMonth(...)` aan — dat wijzigt het
bestaande Date-object *in place* en zet vervolgens een andere state-variabele
(`setCurrentDate`). De state die het component uitleest, `dateOneMonthAgo`, wordt
nooit via zijn eigen setter bijgewerkt.

Twee gevolgen. De 31-daagse bug: vanuit 31 maart teruggaan geeft via `setMonth(1)`
geen 28 februari maar 3 maart — februari wordt overgeslagen. En het breekt zodra
React in StrictMode of met concurrent rendering dubbel rendert.

```ts
const [anchor, setAnchor] = useState(() => new Date());

const shiftMonth = (delta: number) =>
  setAnchor(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
```

Anker op dag 1 van de maand laat het overloopprobleem verdwijnen.

---

## Belangrijk, niet blokkerend

### 5. De RTK Query cache-tags kloppen niet

`client/src/api.ts:98` · `client/src/scenes/reviewTransactions/index.tsx:160`

Elke mutatie invalideert een eigen, unieke tag: `updateTransaction` invalideert
`"transaction"`, terwijl `getTransactions` de tag `"transactions"` aanbiedt. Die
twee raken elkaar nooit. Hetzelfde geldt voor `uploadTransactions` →
`"uploadTransactions"` en `deleteTransaction` → `"deleteTransactions"` — tags die
geen enkele query aanbiedt.

Netto-effect: na een wijziging ververst er niets, en dat is opgelost met
`window.location.reload()` op drie plekken (`subHeader/index.tsx:17`,
`reviewTransactions/index.tsx:160`). Dat gooit de React-state, de cache en de
scrollpositie weg.

```ts
updateTransaction: build.mutation({
  invalidatesTags: ["transactions", "categorySums",
                    "incomeExpensesSum", "emptyCategoryTransactions",
                    "accountOverview"],
})
```

### 6. Foutafhandeling lekt database-interne informatie

`server/src/controllers/financeController.ts` (12×)

Vrijwel elke route eindigt op `res.status(500).json({ error })` met het rauwe
pg-foutobject: de mislukte query, kolomnamen, constraint-namen. De upload-route
gaat verder en stuurt de stringificatie van de databasefout terug.

Eén error-middleware onderaan de router: log volledig serverside, stuur een vaste
boodschap plus correlatie-id naar de client. Ook `fs.unlinkSync()` vervangen door
de async variant — die staat in een `finally` en blokkeert de event loop.

### 7. Geen paginering: `/transactions` haalt alles op

`server/src/managers/financeManager.ts:41`

`getTransactions()` zonder datumfilter heeft geen `LIMIT`. `trainModel()` roept
precies die functie aan bij elke upload en laadt de volledige historie in geheugen.

Twee verbeteringen: `LIMIT`/`OFFSET` op de query, en `trainModel()` alleen de
kolommen laten ophalen die het gebruikt (`name_description`, `notifications`,
`category`) met `WHERE category IS NOT NULL`.

### 8. Geen migratiepad voor het schema

`docker-compose.prod.yml`

Het schema komt uitsluitend via `/docker-entrypoint-initdb.d` binnen, wat alleen
gebeurt bij een lege volume. De tags-tabellen zijn nooit in een draaiende
productiedatabase terechtgekomen tenzij handmatig aangemaakt — en de laatste commit
koppelt een bind mount aan de PostgreSQL-data, dus die volume blijft bestaan.

**Opgelost, herzien 4 september 2026.** Er staat een migratierunner in de server
die bij het opstarten pending `.sql`-bestanden uit `server/migrations/` toepast en
bijhoudt wat al gedraaid is.

Die map is nu bewust leeg: 1.0.0 is nog niet uit, dus er is geen geïnstalleerde
database om vanaf te migreren en het volledige schema staat in
`database/init.sql`. Vier migratiebestanden voor een schema dat nooit anders is
geweest, zijn ballast.

Zodra 1.0.0 ergens met data draait verandert dat: de entrypoint-scripts draaien
nooit opnieuw op een bestaand volume, dus vanaf dat moment is elke
schemawijziging een genummerde migratie — en moet `init.sql` mee, zodat een
verse installatie en een gemigreerde op hetzelfde schema uitkomen.

### 9. Nul tests

Drie plekken waar een fout stil verkeerde cijfers oplevert:

- De CSV-parsing per bank. Vijf mappings, drie datumformaten, twee bedragconventies,
  ASN's aanhalingstekens. Vijf fixtures en vijf assertions dekken dit af.
- `getIncomeExpensesSum()` en `getCategorySums()`. De debit/credit-tekenlogica zit
  op drie plekken los van elkaar in SQL.
- De datumreken in de DateRange-context, met name de maandgrenzen.

### 10. De rekeningtabel is met placeholder-IBAN's gevuld

`database/initProd.sql:63`

Negen van de tien rekeningen hebben `details` = `unique1` t/m `unique9`; alleen de
Rabobank-rekening heeft een echt IBAN. De koppeling transactie → rekening loopt via
`transactions.account = accounts.details`, dus een geïmporteerde transactie matcht
alleen bij die ene rekening. Bij alle andere valt het saldo terug op
`balance_when_created`, wat nul is.

Het net worth-cijfer weerspiegelt daarmee alleen de Rabobank-rekening. Dit is ook
de blokkade voor transfer-detectie, die echte IBAN's aan beide kanten nodig heeft.

### 11. De transactietabel bouwt kolommen op uit `Object.keys(row)`

`client/src/scenes/reviewTransactions/index.tsx:212`

De header is een vaste array van negen kolomnamen, de body rendert
`Object.keys(row).map(...)`. Die lopen alleen synchroon zolang Postgres de kolommen
in exact die volgorde teruggeeft. Bij een nieuwe kolom (`import_hash`,
`is_internal`) verschuift de tabel: waarden onder de verkeerde kop.

Ook: `SortableTransactionTable` gebruikt `key={date_str + name_description}`, wat
botst bij twee identieke pinbetalingen op één dag — gebruik `row.id`.

---

## Functioneel

### Hoe data binnenkomt, en of je er altijd bij kunt

Er is één ingang: CSV-upload. Om bij bestaande transacties te komen zijn er drie
indirecte routes:

- Direct na een upload, met de zojuist aangemaakte id's via router-state.
- Het reviewscherm zonder id's — toont uitsluitend transacties *zonder* categorie.
- Een categorie aanklikken in Spending Breakdown en op het potloodje drukken —
  filtert op één categorie binnen één maand.

Er is geen plek waar je door al je transacties kunt lopen. Zoeken kan niet.
Handmatig een transactie toevoegen kan niet — contant geld, een tikkie, een
correctie: er is geen weg naar binnen dan een CSV.

Voorstel:

1. **Eén zoek-endpoint.** `getTransactions()` uitbreiden met vrije tekst (ILIKE over
   `name_description`, `notifications`, `counterparty`) en filters op categorie,
   rekening, tag, bedragrange, debit/credit en datumrange. Met `LIMIT`/`OFFSET` en
   `total_count`. Dit endpoint bedient meteen het reviewscherm — dat wordt "zoeken
   met filter *categorie is leeg*".
2. **Eén transactietabel-component.** Nu bestaan `SortableTransactionTable` (lezen)
   en de inline tabel in `reviewTransactions` (bewerken) naast elkaar. Samenvoegen
   tot één component met een `editable`-vlag. De inline-editing (enkele klik, Enter
   opslaat, Escape annuleert, optimistische update met rollback) verdient het om
   overal te gelden.
3. **Handmatig toevoegen.** Een knop bovenaan het zoekscherm met dezelfde velden.
   Serverzijde is dat `addTransactions()` met één entry.
4. **Bulkacties.** Met filters wil je "selecteer alles" → categorie of tag toekennen.
   Eén extra endpoint (`PATCH /transactions/bulk`).

### Totaal-widgets en maand-widgets op één scherm

| Widget | Afhankelijk van maandselectie? | Data |
|---|---|---|
| Account Overview | Nee — altijd het saldo van nu | `/account-overview` |
| Period Summary | Ja | `/income-expenses-sum` |
| Spending Breakdown | Ja | `/category-sums` |
| Transaction Details | Ja | `/transactions` |
| Add / Review / Investments | Nee — acties | — |

Het probleem is niet alleen dat ze door elkaar staan; de datumkiezer staat *onder*
de header en lijkt visueel voor alles te gelden, inclusief het accountoverzicht dat
er niets mee doet. Een maand terug verandert Account Overview niet — dat leest als
een bug, ook al is het correct.

**Opgelost, 4 september 2026.** De twee vragen zijn uit elkaar getrokken in plaats
van er één te kiezen:

- **De banner** staat boven elke tab en toont altijd *vandaag*, expliciet gelabeld
  "Net worth today". Uitklapbaar naar het detail per rekening. Dit is het vaste
  referentiepunt waartegen de rest gelezen wordt.
- **De widget op het dashboard** volgt wél de maandkiezer en toont het saldo per
  einde van die maand, met "as of 31 Aug 2026" eronder. Daarmee sluit hij aan op
  de inkomsten, uitgaven en breakdown ernaast.

`getAccountOverview()` accepteert nu een optionele `asOf`, waarbij transacties na
die datum wegvallen en een beleggingsrekening het laatst bekende saldo op of vóór
die datum aanneemt. Zonder `asOf` is het antwoord "nu".

Voor het historische verloop is er `GET /api/net-worth-history`, dat het vermogen
per maandeinde teruggeeft, opgesplitst naar rekeningtype. Zie het voorstel voor de
rapportagetab hieronder.

### Acties uit de widgetkolom naar een menu

De rechterkolom bevat drie widgets die geen data tonen: Add Transactions, Review
Transactions, Add Investments. Ze nemen 1,5 van de 12 kolommen in beslag en zien er
hetzelfde uit als de widgets die wél data tonen — dezelfde `DashboardBox` met
dezelfde rand, radius en achtergrond. Visueel zeggen ze "ik ben een overzicht",
terwijl het knoppen zijn.

Naar een `⋯`-menu in de tabbalk: *Transacties importeren*, *Beleggingen bijwerken*,
*Categorieën beheren*, *Rekeningen beheren*. "Review transactions" is geen actie
maar een filterstand van het transactiescherm, dus dat wordt een badge op de
Transacties-tab: `Transacties (12)`. Informatiever dan de huidige knop, die niet
laat zien of er iets te doen valt.

Hetzelfde geldt voor het potlood-icoontje in Transaction Details en het oog-icoontje
in Account Overview: die zitten geabsoluut-gepositioneerd in de widgetkop, wat de
reden is dat in beide bestanden een identiek blok
`position:'absolute', right:0, top:'50%', transform:'translateY(-50%)'` staat.

**Opgelost, 4 september 2026.** De tabbalk heeft nu een `⋯`-menu met *Import
transactions*, *Update investments*, *Manage accounts* en *Manage categories*. De
drie actie-widgets zijn verdwenen; het dashboard heeft nog twee kolommen in plaats
van drie. "Review transactions" is een badge op de Transactions-tab geworden, die
bij aanklikken direct op het filter *needs a category* opent.

Het beheer van categorieën bestond nog niet en is erbij gekomen (`/categories`):
naam, kleur, vast/variabel en inkomsten/uitgaven zijn nu instelbaar, met het aantal
transacties per categorie erbij. Verwijderen wordt geweigerd zolang er transacties
aan hangen.

De gedupliceerde absolute-positionering is vervangen door één `WidgetHeader`.

Twee bugs kwamen daarbij naar boven, beide gevonden doordat de nieuwe beheerschermen
hernoemen mogelijk maakten: `transactions.category` en `investments.account`
verwijzen op naam, en hun foreign keys blokkeerden de eerste van de twee benodigde
UPDATEs. **Een categorie of beleggingsrekening hernoemen was daardoor onmogelijk.**
Beide constraints zijn nu `DEFERRABLE` in `database/init.sql`, zodat de twee
tabellen samen worden bijgewerkt en pas bij commit gecontroleerd.

### Voorstel: een rapportagetab voor historisch verloop

*Toegevoegd 4 september 2026, na de beslissing om net worth historisch te maken.*

De banner beantwoordt "waar sta ik nu", het dashboard "wat deed deze maand".
Wat geen van beide kan is "hoe heeft dit zich ontwikkeld" — en dat is precies de
vraag waarvoor je een jaar aan geïmporteerde data hebt. Een derde scherm dus, met
een eigen tijdas in plaats van de maandkiezer van het dashboard.

#### Wat het scherm beantwoordt

Vier vragen, in deze volgorde van waarde:

1. **Groeit mijn vermogen?** Net worth per maandeinde, gestapeld naar
   rekeningtype, zodat zichtbaar is of groei uit sparen komt of uit koersstijging.
   De data hiervoor bestaat al: `GET /api/net-worth-history`.
2. **Waar gaat het heen, over tijd?** Uitgaven per categorie per maand — als
   gestapelde staven voor de verhouding, of als lijnen per categorie om er één te
   volgen. Beantwoordt "geven we structureel meer uit aan boodschappen".
3. **Hoeveel houd ik over?** Inkomsten, uitgaven en spaarquote per maand, met een
   voortschrijdend gemiddelde over drie maanden — één dure maand zegt niets,
   een dalende trend van zes maanden wel.
4. **Wat is er veranderd?** Deze periode tegenover de vorige, per categorie, met
   het verschil in euro's en procenten. Dit is waar een abonnement dat verdubbeld
   is naar boven komt.

#### Filters

De tijdas is de hoofdcontrole en werkt anders dan op het dashboard: geen enkele
maand maar een **bereik** — snelknoppen voor 6 / 12 / 24 maanden en dit jaar,
plus een vrije van-tot. Daarnaast dezelfde filters als het transactiescherm
(categorie, rekening, event), zodat "wat kostte de verbouwing per maand" te
beantwoorden is door op dat event te filteren.

Twee schakelaars die inhoudelijk verschil maken:

- **Interne overboekingen meetellen** — standaard uit, net als overal. Aan zetten
  laat zien hoeveel er structureel naar de spaarrekening gaat.
- **Vaste versus variabele lasten** — de kolom `category_type` bestaat al maar
  wordt buiten de Period Summary nergens gebruikt. Splitsen laat zien welk deel
  van je uitgaven je op korte termijn kunt beïnvloeden.

#### Wat de server nog mist

`getNetWorthHistory()` dekt vraag 1. Voor de rest zijn drie queries nodig, alle
drie varianten op wat er al staat:

| Endpoint | Geeft | Bouwt voort op |
|---|---|---|
| `GET /api/reports/category-history` | Categorie × maand, met dezelfde filters als het zoekscherm | `getCategorySums()` plus een `GROUP BY` op maand |
| `GET /api/reports/cashflow` | Inkomsten, uitgaven, netto en spaarquote per maand | `getIncomeExpensesSum()` per maand in plaats van per periode |
| `GET /api/reports/comparison` | Twee periodes naast elkaar per categorie, met het verschil | Twee keer `getCategorySums()`, in SQL verschild |

Alle drie moeten `is_internal IS NOT TRUE` respecteren, tenzij de schakelaar aan
staat — dezelfde regel als de bestaande sommaties.

#### Waar op te letten

- **Een lege maand is geen nul.** Bij net worth wordt het vorige saldo
  doorgedragen (dat doet `getNetWorthHistory()` al); bij uitgaven per categorie is
  een maand zonder uitgaven wél een echte nul. Die twee door elkaar halen levert
  grafieken op die naar nul duiken op plekken waar niets gebeurde.
- **De eerste maanden zijn onvolledig.** Als je historie in maart begint, is
  maart geen normale maand. Markeer het begin van de reeks, of laat de eerste
  onvolledige maand weg uit trendberekeningen.
- **De huidige maand loopt nog.** Toon hem gestippeld of sluit hem uit van
  vergelijkingen, anders lijkt elke maand halverwege een daling.
- **Categorieën die je hernoemt breken de historie**, want `transactions.category`
  verwijst op naam. Hetzelfde probleem als bij `accounts.details`, met dezelfde
  oplossing: bij hernoemen meeschrijven.

#### Status

**Stap 1 en 2 gebouwd, 4 september 2026.** De rapportagetab staat op `/reports`,
met een bereikkiezer (6 / 12 / 24 maanden, dit jaar, of vrij van-tot) en een
categoriefilter.

- **Net worth per maandeinde**, gestapeld naar rekeningtype, met het laatste
  bedrag en de verandering over de periode als kop. Draait op het bestaande
  `getNetWorthHistory()`.
- **Uitgaven per categorie per maand**, in twee vormen: gestapelde staven voor
  waar een maand uit bestond, en lijnen om één categorie over de maanden te
  volgen. Nieuw endpoint `GET /api/reports/category-history`.

Categorieën houden de kleur die in de database staat, dus een categorie ziet er
in de grafiek hetzelfde uit als in de Spending Breakdown. Voorbij acht reeksen
wordt de rest samengevoegd tot "Other" in plaats van nieuwe kleuren te verzinnen.

De drie kleuren voor rekeningtypes zijn gevalideerd met een palet-checker op
lichtheidsband, chroma, kleurenblind-scheiding van elk aangrenzend paar en
contrast tegen de ondergrond — in zowel de lichte als de donkere modus.

Drie fouten kwamen alleen aan het licht door de gerenderde pagina te bekijken:
inkomstencategorieën trokken de as onder nul, categorienamen met een komma
(`Kleding, Shoppen, Elektronica`) werden door de grafiekbibliotheek als
padexpressie gelezen waardoor elke reeks grijs werd, en de lijninterpolatie
dook onder nul tussen een piek en een lege maand.

Nog te bouwen: cashflow per maand en de periodevergelijking.

#### Bouwvolgorde

Net worth-grafiek eerst — de data staat er al, dus dat is puur frontend en levert
meteen het antwoord op de vraag die je stelde. Daarna cashflow per maand, dan
categorie-historie, en de periodevergelijking als laatste; die is het meeste werk
en het minst dagelijks nuttig.

Voor de grafieken zelf: de app heeft nog geen grafiekbibliotheek. Recharts past
bij de MUI-stack en kan alle vier de visualisaties aan.

### Overboekingen tussen eigen rekeningen

Drie niveaus, oplopend in werk:

| # | Aanpak | Wat het oplost | Werk |
|---|---|---|---|
| 1 | **Markeer intern bij import.** Kolom `is_internal BOOLEAN`. Bij het inlezen: als `counterparty` voorkomt in `accounts.details`, zet op true. | Beide zijden vallen uit de inkomsten/uitgaven-sommen. Maandcijfers kloppen weer. | klein |
| 2 | **Zonder intern uit in de sommaties.** `getIncomeExpensesSum()`, `getCategorySums()` en Spending Breakdown krijgen `AND NOT is_internal`. `getAccountOverview()` juist *niet* — daar moeten ze meetellen. | Het onderscheid tussen "geld verplaatst" en "geld uitgegeven" wordt consistent. | klein |
| 3 | **Koppel de twee kanten.** Tabel `transfers(from_transaction_id, to_transaction_id)`, gevuld door een matcher: zelfde bedrag, tegengesteld teken, datums binnen 3 dagen, rekeningen wederzijds elkaars tegenrekening. | Je ziet "€500 van Rabobank naar ING-spaar" als één regel, en merkt het als één helft ontbreekt. | middel |

Randgeval om nu al te beslissen: een overboeking naar de beleggingsrekening is
intern (geld verplaatst), maar de waardegroei daarna niet. De investments-tabel
houdt saldi bij, niet transacties, dus die twee bijten elkaar nog niet — maar zodra
je rendement wilt zien moet je onderscheiden tussen inleg en groei. De inleg is
precies wat een intern gemarkeerde overboeking geeft.

Praktische blokkade: dit werkt alleen met echte IBAN's in `accounts.details`.
Zolang daar `unique1` t/m `unique9` staat, matcht er niets.

Voor rekeningen waar de bank geen tegenrekening meelevert (creditcards vooral) valt
terug te vallen op een tekstregel: een omschrijving die een eigen IBAN of eigen
rekeningnaam bevat, is ook intern.

**Herzien, 4 september 2026.** Na het bouwen van het rekeningenbeheer en het
zoekscherm is de detectie opnieuw doorgemeten tegen een echte database. Vier
zwaktes kwamen naar boven; twee zijn opgelost, twee bewust laten liggen.

**Opgelost — eenzijdige overboekingen.** De matcher zocht uitsluitend naar paren,
maar een beleggingsrekening levert geen CSV: geld dat daarheen gaat verschijnt
alleen aan de uitgaande kant en kan per definitie geen tegenboeking hebben.
Gemeten: een inleg van €1.000 telde als uitgave. Dat is meestal niet een detail
maar de grootste "uitgave" van de maand.

De oplossing werkt pas sinds het rekeningenbeheer echte IBAN's mogelijk maakt:
staat de `counterparty` van een transactie in je eigen `accounts`, dan is die
transactie *aantoonbaar* intern — geen gok, dus wordt hij toegepast in plaats van
voorgesteld. `markCounterpartyTransfers()` draait bij elke import, de gemarkeerde
rijen verschijnen op het transactiescherm onder "Moved between your own accounts",
en per rij is er "Not a transfer" om het terug te draaien. Die afwijzing wordt
onthouden (`is_internal = FALSE`), zodat een volgende import hem niet opnieuw
markeert.

**Opgelost — het kruisproduct bij gelijke bedragen.** Elke debit werd gekoppeld
aan elke passende credit. Twee overboekingen van €500 op opeenvolgende dagen
leverden vier voorstellen op in plaats van twee, en het bevestigen van een verkeerd
paar blokkeerde het juiste. De query rangschikt nu per transactie op grondslag en
datumafstand, en houdt alleen paren over waarin beide kanten elkaar als beste
keuze zien. Gemeten: 4 → 2 voorstellen, met de juiste datums gekoppeld; een
maandelijkse vaste inleg levert nog steeds één paar per maand.

**Bewust niet gedaan — het venster van 3 dagen.** Een creditcard-aflossing met vijf
dagen tussen afschrijving en bijschrijving wordt niet gevonden. Verruimen naar
zeven dagen vangt dat op, maar levert bij veelvoorkomende bedragen meer zwakke
suggesties op. Het venster is een parameter (`windowDays`), dus dit is later te
verhogen zonder codewijziging.

**Bewust niet gedaan — bedragstolerantie.** €500 eruit en €498,50 erin (kosten bij
een buitenlandse overboeking) wordt niet herkend. Een marge van een paar euro zou
dat vangen, maar verlaagt de zekerheid van elke match. Alleen zinvol als je dit in
de praktijk tegenkomt.

**Blijft gelden:** de detectie staat of valt met echte rekeninggegevens. Ontbreekt
een rekening in `accounts`, dan is er geen bewijs en gebeurt er niets — de rij komt
dan wel als onbekende rekening op het transactiescherm te staan.

---

## Opruimwerk

### 12. Twee formatCurrency-definities, zeven keer gekopieerd

Dezelfde `Intl.NumberFormat('nl-NL', …)`-helper staat identiek in
`AccountOverview`, `PeriodSummary`, `SpendingBreakdown`, `SortableTransactionTable`,
`SortableSpendingTable`, `tags/index` en `TagDetails`. Eén `utils/format.ts` met
`formatCurrency`, `formatDate` en `formatMonth`. De knowledge graph markeert deze
cluster ook als eigen community (nr. 8).

### 13. Het `Transaction`-type staat vier keer opnieuw gedeclareerd

In `TransactionDetails`, `SortableTransactionTable`, `reviewTransactions` en
serverzijde in `financeModel.ts` — en ze verschillen onderling. De servervariant
heeft `account: number` en een veld `transaction_type` dat nergens in het schema
bestaat; de clientvarianten hebben `account: string`. Eén gedeeld type zou de
kolomvolgorde-bug uit bevinding 11 ook onmogelijk maken.

### 14. De `Transactions`-klasse is een lege huls

`server/src/models/financeModel.ts`

De klasse wordt nergens geïnstantieerd — `getTransactions()` geeft `result.rows`
terug, gewone objecten. Hij dient alleen als returntype. Een `interface` volstaat.

### 15. `getCategorySums` gebruikt vaste parameterindexen

`server/src/managers/financeManager.ts:95`

De query hardcodeert `$1` voor startDate en `$2` voor endDate. Bij een aanroep met
alleen `endDate` staat er `$2` in de SQL terwijl er één parameter meegaat — dat
gooit een fout. `getTransactions()` doet het een paar regels hoger wél goed met een
oplopende `paramIndex`. Dezelfde fout staat in `getIncomeExpensesSum()`. Nu
onbereikbaar omdat de client altijd beide meestuurt, maar het zoekscherm verandert dat.

### 16. Ongebruikte parameters en dode routes

`classifyWith()` en `predictCategory()` nemen allebei een `account`-parameter aan
die in geen enkele codepad wordt gebruikt. `predictCategory()` wordt nergens
aangeroepen sinds de controller op `trainModel` + `classifyWith` is overgestapt —
maar traint wel een compleet nieuw model per aanroep. `morgan` wordt in `index.ts`
ná de router geregistreerd en logt daardoor niets van de API-calls.

---

## Voorgestelde volgorde

De afhankelijkheden lopen één kant op: zonder echte IBAN's geen transfer-detectie,
zonder migraties geen schemawijziging op een draaiende database, zonder correcte
cache-tags blijft elk nieuw scherm hangen aan `window.location.reload()`.

1. **Migraties opzetten en de twee schemabestanden samenvoegen.** Alles daarna hangt
   hieraan. Meteen de credentials uit `initTables.sql` halen.
2. **Cache-tags rechttrekken, alle drie de `reload()`-aanroepen verwijderen.**
   Kleinste diff, grootste merkbare verbetering.
3. **Echte rekeninggegevens invullen** — handmatig of via een beheerscherm.
4. **`is_internal` toevoegen en uitzonderen in de sommaties.** Vanaf hier kloppen de
   maandcijfers.
5. **`import_hash` met unieke index.** Beschermt alles wat hierna wordt geïmporteerd.
6. **Zoek-endpoint plus zoekscherm**, met het reviewscherm als filterstand daarvan.
7. **Herindeling: banner, tabs, actiemenu.** Puur frontend, leunt op stap 6.
8. **DateRange herbouwen** met een onveranderlijk anker en de maand in de URL.

Wat kan blijven liggen: de transfer-koppelingstabel (niveau 3), tests voorbij de drie
genoemde plekken, en het historisch maken van het net worth. Alle drie nuttig, geen
van drieën blokkerend.
