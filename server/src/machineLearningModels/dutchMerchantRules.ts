// Merchant rules for Dutch bank statements.
//
// These give the classifier something to work with on a first import, when
// there are no previously categorised transactions to learn from. They are
// deliberately plain data so new merchants can be added without touching the
// classifier itself.
//
// Patterns are matched against a lowercased "name + description" string.
// Note: no \b word boundary at the start - Dutch card statements glue terminal
// codes onto the merchant name (e.g. "3j5g01gammar'dambli" for Gamma), so a
// leading boundary would miss them.

export interface MerchantRule {
  pattern: RegExp;
  category: string;
}

// Categories must match category_name in the categories table.
export const dutchMerchantRules: MerchantRule[] = [
  // Supermarkets and daily groceries
  { pattern: /(lidl|hoogvliet|albert\s?heijn|\bah\s?to\s?go|jumbo|aldi|\bdirk\b|\bspar\b|coop\b|vomar|picnic|crisp|nettorama|poiesz|ekoplaza|marqt)/, category: 'Boodschappen' },
  { pattern: /(zuivelhandel|kaaswaag|visshop|bakkerij|bakker\b|slagerij|slager\b|groente|versmarkt|markt\b)/, category: 'Boodschappen' },

  // Household, interior, DIY
  { pattern: /(boels\s?verhuur|zaadhandel|tuincentrum)/, category: 'Inboedel, Huishouden' },
  { pattern: /(action|kruidvat|\betos\b|\bhema\b|blokker|xenos|flying\s?tiger|ikea|leen\s?bakker|jysk|kwantum|praxis|gamma|karwei|hornbach|hubo|bouwmaat|intratuin|welkoop)/, category: 'Inboedel, Huishouden' },

  // Eating out, takeaway, drinks
  { pattern: /(thuisbezorgd|uber\s?eats|deliveroo|domino|new\syork\spizza|kwalitaria|patisserie|starbucks|mcdonald|burger\s?king|\bkfc\b|subway|restaurant|brasserie|bistro|eetcafe|cafetaria|snackbar|\bcafe\b|\bbar\b|brouwerij)/, category: 'Uiteten, Drankjes' },

  // Clothing, shopping, electronics
  { pattern: /(zalando|\bh&m\b|zara|primark|c&a\b|wehkamp|bijenkorf|decathlon|perry\s?sport|bristol|van\s?haren|scapino|omoda|bol\.?com|coolblue|mediamarkt|amazon|alternate)/, category: 'Kleding, Shoppen, Elektronica' },

  // Utilities: energy, water, telecom
  { pattern: /(vattenfall|eneco|essent|greenchoice|budget\s?energie|oxxio|vandebron|pure\s?energie|engie)/, category: 'Utiliteiten' },
  { pattern: /(vitens|dunea|evides|waternet|brabant\s?water|\bpwn\b)/, category: 'Utiliteiten' },
  { pattern: /(ziggo|\bkpn\b|vodafone|t-mobile|odido|tele2|simyo|hollandsnieuwe|youfone|lebara|delta\s?fiber|caiway)/, category: 'Utiliteiten' },

  // Insurance
  { pattern: /(zilveren\s?kruis|\bvgz\b|\bcz\b|menzis|\bohra\b|\bfbto\b|univ[ée]|achmea|nationale.?nederlanden|aegon|centraal\s?beheer|interpolis|ditzo|\basr\b|allianz|verzekering|zorgverzekering)/, category: 'Verzekeringen' },

  // Taxes and government
  { pattern: /(belastingdienst|belasting|waterschap|hoogheemraadschap|\bcjib\b|\brdw\b|gemeente\s)/, category: 'Belastingen' },

  // Personal care and health
  { pattern: /(apotheek|huisarts|tandarts|fysio|ziekenhuis|kliniek|\bggz\b|kapper|kapsalon|drogist|opticien|hans\s?anders|pearle|specsavers)/, category: 'Verzorging' },

  // Leisure, hobby, subscriptions, sport
  { pattern: /(netflix|spotify|disney|videoland|\bhbo\b|viaplay|prime\s?video|path[ée]|kinepolis|vue\s?cinema|steam(games|powered)?|playstation|nintendo|xbox|basic.?fit|sportschool|fitness|zwembad|consumentenbond)/, category: "Vrijetijdsbesteding, Hobby's" },

  // Housing
  { pattern: /(hypotheek|huurbetaling|\bhuur\b|\bvve\b|woningcorporatie|vesteda|ymere|stadgenoot|portaal)/, category: 'Woonlasten' },

  // Travel, transport, fuel
  { pattern: /(\bns\b|ns-groep|9292|ov-?chipkaart|translink|\bnsr\b|greenwheels|swapfiets|shell|\bbp\b|\besso\b|tango|tinq|\bq8\b|texaco|total\s?energies|booking\.com|airbnb|transavia|\bklm\b|ryanair|tui\b|sunweb)/, category: 'Vakanties' },

  // Bank costs
  { pattern: /(kosten\s?gebruik\s?betaalrekening|bankkosten|kosten\s?betaalpakket)/, category: 'Bankkosten' },

  // Cash withdrawals - money moved rather than spent
  { pattern: /(geldmaat|\batm\b|geldautomaat)/, category: 'Overboekingen' },

  // Savings and investing
  { pattern: /(spaarrekening|\bsparen\b|degiro|\bbux\b|meesman|brand\s?new\s?day|robeco|beleggen)/, category: 'Sparen, Beleggen' },

  // Charity
  { pattern: /(goede\s?doelen|\bgiro\s?555\b|unicef|greenpeace|\bknrm\b|artsen\s?zonder\s?grenzen|rode\s?kruis|natuurmonumenten|stichting\s)/, category: 'Cadeaus, Verjaardagen' },
];

// Returns the category for the first matching rule, or null when nothing matches.
export function matchMerchantRule(text: string): string | null {
  const haystack = text.toLowerCase();
  const rule = dutchMerchantRules.find((r) => r.pattern.test(haystack));
  return rule ? rule.category : null;
}
