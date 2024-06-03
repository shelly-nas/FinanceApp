import express, { Request, Response } from 'express';
import userManager from '@/managers/jointAccountManager';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import jointAccountManager from '@/managers/jointAccountManager';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const reformatDate = (dateStr: string) => { // Function to reformat date from YYYYMMDD to YYYY-MM-DD
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
};

const bankMappings = {
  ING: {
    'Date': 'date_str',
    'Name / Description': 'name_description',
    'Account': 'account',
    'Counterparty': 'counterparty',
    // 'Code': 'category',
    'Debit/credit': 'debit_credit',
    'Amount (EUR)': 'amount',
    'Transaction type': 'transaction_type',
    'Notifications': 'notifications'
  },
  Rabobank: {
    'IBAN/BBAN': 'account',
    // 'munt': 'currency',
    // 'bic': 'bic',
    // 'volgnur': 'sequence_number',
    'Datum': 'date_str',
    // 'rentedatum': 'rent_date',
    'Bedrag': 'amount',
    // 'saldo na trn': 'balance_after_transaction',
    'Tegerekening IBAN/BBAN': 'counterparty',
    // 'Naam tegenpartij': 'counterparty_name',
    // 'naam uiteindelijke partij': 'ultimate_party_name',
    // 'naam initiërende partij': 'initiating_party_name',
    // 'bic tegenpartij': 'counterparty_bic',
    // 'code': 'category',
    // 'batch id': 'batch_id',
    // 'tranactiereferentie': 'transaction_reference',
    // 'machtigingskenmerk': 'authorization_reference',
    // 'incassant id': 'creditor_identifier',
    // 'betalingskenmerk': 'payment_reference',
    'Omschrijving-1': 'notifications',
    // 'Omschrijving-2': 'description_2',
    // 'Omschrijving-3': 'description_3',
    // 'Reden retour': 'return_reason',
    // 'Oorspr bedrag': 'original_amount',
    // 'Oorspr munt': 'original_currency',
    // 'Koers': 'exchange_rate'
  }
};

// function detectBank(headers) {
//   if (headers.includes('date') && headers.includes('name/description')) {
//     return 'Rabobank';
//   } else if (headers.includes('datum') && headers.includes('munt')) {
//     return 'ING';
//   }
//   return null;
// }

// function mapCsvData(bank, data) {
//   const mapping = bankMappings[bank];
//   return data.map(row => {
//     const mappedRow = {};
//     for (const [csvKey, dbKey] of Object.entries(mapping)) {
//       mappedRow[dbKey] = row[csvKey] || null;
//     }
//     return mappedRow;
//   });
// }

// router.post('/upload', upload.single('file'), (req, res) => {
//   const { bank } = req.body;
//   const filePath = req.file.path;
//   const results = [];

//   fs.createReadStream(filePath)
//     .pipe(csv())
//     .on('headers', headers => {
//       const detectedBank = detectBank(headers);
//       if (detectedBank !== bank) {
//         return res.status(400).json({ error: 'Bank type mismatch' });
//       }
//       req.bank = detectedBank;
//     })
//     .on('data', data => results.push(data))
//     .on('end', () => {
//       const bank = req.bank;
//       const mappedData = mapCsvData(bank, results);
//       // Save mappedData to the database here
//       res.json({ message: 'File processed successfully', data: mappedData });
//     });
// });

router.post('/upload-transactions', upload.single('file'), async (req: Request, res: Response) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const entries: { date_str: string, name_description: string, account: string, counterparty: string | null, category: null, debit_credit: string, amount: number, transaction_type: string, notifications: string}[] = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (data) => {
      entries.push({
        date_str: reformatDate(data.Date),
        name_description: data['Name / Description'],
        account: data.Account,
        counterparty: data.Counterparty || null,
        category: null,
        debit_credit: data['Debit/credit'],
        amount: parseFloat(data['Amount (EUR)'].replace(',', '.')), // Convert to 0.00 value
        transaction_type: data['Transaction type'],
        notifications: data.Notifications,
      });
    })
    .on('end', async () => {
      try {
        await jointAccountManager.addMultipleTransactions(entries);
        res.status(200).send('Entries imported successfully');
      } catch (error) {
        res.status(500).send(`Error importing entries: ${error}`);
      } finally {
        fs.unlinkSync(filePath); // Remove the file after processing
      }
    })
    .on('error', (error) => {
      res.status(500).send(`Error reading file: ${error}`);
    });
});

router.get('/transactions', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  try {
    const transactions = await userManager.getTransactions(startDate as string, endDate as string);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/category-sums', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const categorySums = await userManager.getCategorySums(startDate as string, endDate as string);
    res.status(200).json(categorySums);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/income-expenses-sum', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const categorySums = await userManager.getIncomeExpensesSum(startDate as string, endDate as string);
    res.status(200).json(categorySums);
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default router;
