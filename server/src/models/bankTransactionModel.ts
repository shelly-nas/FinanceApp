export const bankMappings = {
	ING_NL: {
		'Datum': 'date_str',
		'Naam / Omschrijving': 'name_description',
		'Rekening': 'account',
		'Tegenrekening': 'counterparty',
		'Af Bij': 'debit_credit',
		'Bedrag (EUR)': 'amount',
		'Mededelingen': 'notifications'
	},
	ING_SAVINGS_NL: {
		'Datum': 'date_str',
		'Omschrijving': 'name_description',
		'Rekening naam': 'account',
		'Tegenrekening': 'counterparty',
		'Af Bij': 'debit_credit',
		'Bedrag': 'amount',
		'Mededelingen': 'notifications'
	},
	ASN: {
		'Datum': 'date_str',
		'Naam': 'name_description',
		'Je rekening': 'account',
		'Van / naar': 'counterparty',
		'Bedrag bij / af': 'amount',
		'Omschrijving': 'notifications'
	},
	Rabobank: {
		'Datum': 'date_str',
		'Naam tegenpartij': 'name_description',
		'IBAN/BBAN': 'account',
		'Tegerekening IBAN/BBAN': 'counterparty',
		'Bedrag': 'amount',
		'Omschrijving-1': 'notifications',
	},
	Rabobank_CC: {
		'Datum': 'date_str',
		'Omschrijving': 'name_description',
		'Creditcard Nummer': 'account',
		'Tegerekening IBAN': 'counterparty',
		'Bedrag': 'amount'
	}
};

// ASN exports its own category per transaction. It is a useful hint on a first
// import, but it uses ASN's taxonomy rather than ours, so it has to be mapped.
// Deliberately incomplete: ASN's 'Overig' is a catch-all covering a third of a
// typical export and carries no information, so it stays unmapped and the row
// is left for review instead of being mislabelled.
export const asnCategoryMap: Record<string, string> = {
	'Boodschappen': 'Boodschappen',
	'Eten & drinken': 'Uiteten, Drankjes',
	'Verzekeringen': 'Verzekeringen',
	'Belastingen & Toeslagen': 'Belastingen',
	'Gas water & licht': 'Utiliteiten',
	'Internet TV & Bellen': 'Utiliteiten',
	'Huur & hypotheek': 'Woonlasten',
	'Verzorging & gezondheid': 'Verzorging',
	'Kleding': 'Kleding, Shoppen, Elektronica',
	'Klussen & onderhoud': 'Inboedel, Huishouden',
	'Hobby sport & vrije tijd': "Vrijetijdsbesteding, Hobby's",
	'Vakantie': 'Vakanties',
	'Sparen': 'Sparen, Beleggen',
	'Contanten': 'Overboekingen',
	'Bankkosten': 'Bankkosten',
	'Goede doelen': 'Cadeaus, Verjaardagen',
	'Dier & tuin': 'Inboedel, Huishouden',
};

// Column holding the bank's own category, per bank type.
export const bankCategoryColumns: Partial<Record<string, string>> = {
	ASN: 'Categorie',
};
