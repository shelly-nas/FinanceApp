export const bankMappings = {
	ING: {
		'Date': 'date_str',
		'Name / Description': 'name_description',
		'Account': 'account',
		'Counterparty': 'counterparty',
		'Debit/credit': 'debit_credit',
		'Amount (EUR)': 'amount',
		'Notifications': 'notifications'
	},
	ING_CC: {
		'Date': 'date_str',
		'Name / Description': 'name_description',
		'Account': 'account',
		'Counterparty': 'counterparty',
		'Debit/credit': 'debit_credit',
		'Amount (EUR)': 'amount',
		'Notifications': 'notifications'
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
