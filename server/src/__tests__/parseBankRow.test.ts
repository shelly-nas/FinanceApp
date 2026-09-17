import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseBankRow } from '@/utils/parseBankRow';

// One realistic row per supported bank. These formats differ in ways that fail
// silently rather than loudly: a misread date lands in the wrong month, a
// misread amount sign turns spending into income, and either one only shows up
// as a figure that looks slightly off.

describe('ING (NL)', () => {
  const row = {
    'Datum': '20260805',
    'Naam / Omschrijving': 'Albert Heijn 1234',
    'Rekening': 'NL61RABO0128050403',
    'Tegenrekening': '',
    'Af Bij': 'Af',
    'Bedrag (EUR)': '42,15',
    'Mededelingen': 'Pasvolgnr 003 05-08-2026 11u28 Betaalautomaat',
  };

  test('parses YYYYMMDD dates', () => {
    assert.equal(parseBankRow(row, 'ING_NL')!.date_str, '2026-08-05');
  });

  test("maps 'Af' to Debit and 'Bij' to Credit", () => {
    assert.equal(parseBankRow(row, 'ING_NL')!.debit_credit, 'Debit');
    assert.equal(
      parseBankRow({ ...row, 'Af Bij': 'Bij' }, 'ING_NL')!.debit_credit,
      'Credit',
    );
  });

  test('reads the comma as a decimal separator', () => {
    assert.equal(parseBankRow(row, 'ING_NL')!.amount, 42.15);
  });

  test('leaves an empty counterparty null rather than an empty string', () => {
    assert.equal(parseBankRow(row, 'ING_NL')!.counterparty, null);
  });
});

describe('ASN', () => {
  const row = {
    'Datum': '05-08-2026',
    'Naam': "'Jumbo Supermarkten'",
    'Je rekening': 'NL02ASNB0123456789',
    'Van / naar': 'NL91ABNA0417164300',
    'Bedrag bij / af': '-42,15',
    'Omschrijving': "'Betaalautomaat 12:04'",
    'Categorie': "'Boodschappen'",
  };

  test('reads DD-MM-YYYY as day-first, not month-first', () => {
    // 05-08-2026 is 5 August. Read as month-first it becomes 8 May, which is a
    // valid date - so this never errors, it just files the row in a different
    // month and quietly skews that month's totals.
    assert.equal(parseBankRow(row, 'ASN')!.date_str, '2026-08-05');
  });

  test('strips the literal single quotes ASN wraps text in', () => {
    const parsed = parseBankRow(row, 'ASN')!;
    assert.equal(parsed.name_description, 'Jumbo Supermarkten');
    assert.equal(parsed.notifications, 'Betaalautomaat 12:04');
  });

  test('derives the direction from the amount sign, and stores it absolute', () => {
    const debit = parseBankRow(row, 'ASN')!;
    assert.equal(debit.debit_credit, 'Debit');
    assert.equal(debit.amount, 42.15);

    const credit = parseBankRow({ ...row, 'Bedrag bij / af': '1250,00' }, 'ASN')!;
    assert.equal(credit.debit_credit, 'Credit');
    assert.equal(credit.amount, 1250);
  });

  test('keeps the bank category as a hint, out of the row itself', () => {
    assert.equal(parseBankRow(row, 'ASN')!.bankCategory, "'Boodschappen'");
  });

  test('falls back to the description when the merchant name is empty', () => {
    // ASN leaves 'Naam' blank on card payments; the merchant is the segment
    // before the '>' that precedes the city.
    const parsed = parseBankRow(
      { ...row, 'Naam': '', 'Omschrijving': "'GAMMA ROTTERDAM > Rotterdam 12:04'" },
      'ASN',
    )!;
    assert.equal(parsed.name_description, 'GAMMA ROTTERDAM');
  });
});

describe('ING savings', () => {
  const row = {
    'Datum': '20260805',
    'Omschrijving': 'Naar spaarrekening',
    'Rekening naam': 'NL02INGB0009876543',
    'Tegenrekening': 'NL61RABO0128050403',
    'Af Bij': 'Bij',
    'Bedrag': '500,00',
    'Mededelingen': 'maandelijkse inleg',
  };

  test('uses its own column names for the same fields', () => {
    const parsed = parseBankRow(row, 'ING_SAVINGS_NL')!;
    assert.equal(parsed.account, 'NL02INGB0009876543');
    assert.equal(parsed.counterparty, 'NL61RABO0128050403');
    assert.equal(parsed.debit_credit, 'Credit');
    assert.equal(parsed.amount, 500);
  });
});

describe('general', () => {
  test('returns null for an unknown bank rather than a half-mapped row', () => {
    assert.equal(parseBankRow({ Datum: '20260805' }, 'Bunq'), null);
  });

  test('collapses repeated whitespace in the description', () => {
    const parsed = parseBankRow(
      {
        'Datum': '20260805',
        'Naam / Omschrijving': 'Albert   Heijn\t 1234 ',
        'Rekening': 'NL61RABO0128050403',
        'Af Bij': 'Af',
        'Bedrag (EUR)': '10,00',
      },
      'ING_NL',
    )!;
    assert.equal(parsed.name_description, 'Albert Heijn 1234');
  });
});
