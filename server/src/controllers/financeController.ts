import express, { Request, Response } from 'express';
import FinanceManager from '@/managers/financeManager';
import { bankMappings } from '@/models/bankTransactionModel'
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const reformatDate = (dateStr: string) => { // Function to reformat date from YYYYMMDD to YYYY-MM-DD
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
};

type BankType = 'ING' | 'ING_CC' | 'Rabobank' | 'Rabobank_CC';

router.post('/upload-transactions', upload.single('file'), async (req: Request, res: Response) => {
  const { bankType } = req.query;
  const filePath = req.file?.path;

  if (!filePath) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mapping = bankMappings[bankType as keyof typeof bankMappings];

  if (!mapping) {
    return res.status(400).json({ error: 'Invalid bank type' });
  }

  const entries: any[] = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (data) => {
      const entry: any = {};

      for (const [csvKey, dbKey] of Object.entries(mapping)) {
        entry[dbKey] = data[csvKey] || null;
      }

      // Special handling for reformatting the date if the key is 'date_str'
      if (entry['date_str'] && !entry['date_str'].includes('-')) {
        entry['date_str'] = reformatDate(entry['date_str']);
      }

      // Replace ',' with '.' in the amount and convert it to a number
      if (entry['amount']) {
        entry['amount'] = parseFloat(entry['amount'].replace(',', '.'));
      }

      // Replace multiple whitespaces in name_description with a single whitespace
      if (entry['name_description']) {
        entry['name_description'] = entry['name_description'].replace(/\s+/g, ' ');
      }

      entries.push(entry);
    })
    .on('end', async () => {
      try {
        await FinanceManager.addTransactions(entries);
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
    const transactions = await FinanceManager.getTransactions(startDate as string, endDate as string);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/category-sums', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const categorySums = await FinanceManager.getCategorySums(startDate as string, endDate as string);
    res.status(200).json(categorySums);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/income-expenses-sum', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const categorySums = await FinanceManager.getIncomeExpensesSum(startDate as string, endDate as string);
    res.status(200).json(categorySums);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/empty-category-transactions', async (req: Request, res: Response) => {
  try {
    const categorySums = await FinanceManager.getEmptyCategoryTransactions();
    res.status(200).json(categorySums);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.patch('/update-transaction/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedTransaction = await FinanceManager.updateTransaction(id, updates);
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/account-overview', async (req: Request, res: Response) => {
  try {
    const updatedTransaction = await FinanceManager.getAccountOverview();
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default router;
