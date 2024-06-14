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
