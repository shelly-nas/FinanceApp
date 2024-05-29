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
        amount: parseFloat(data['Amount (EUR)']),
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

export default router;
