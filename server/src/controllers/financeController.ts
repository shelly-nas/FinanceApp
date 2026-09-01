import express, { Request, Response } from 'express';
import FinanceManager from '@/managers/financeManager';
import { bankMappings, asnCategoryMap, bankCategoryColumns } from '@/models/bankTransactionModel'
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import { classifyWith, trainModel } from '@/machineLearningModels/categoryModel';
import bodyParser from 'body-parser';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const reformatDate = (dateStr: string) => { // Function to reformat date from YYYYMMDD to YYYY-MM-DD
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}-${month}-${day}`;
};

// ASN exports dates as DD-MM-YYYY. These already contain hyphens, so they skip
// the YYYYMMDD branch above and would otherwise reach Postgres ambiguously -
// 01-08-2026 is 1 August here but reads as 8 January under a US datestyle.
const isDayFirstDate = (dateStr: string) => /^\d{2}-\d{2}-\d{4}$/.test(dateStr);
const reformatDayFirstDate = (dateStr: string) => {
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
};

// ASN wraps free-text columns (description, category) in literal single quotes,
// which are part of the value rather than CSV quoting and must be stripped.
const stripWrappingQuotes = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 1 && trimmed.startsWith("'") && trimmed.endsWith("'")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
};

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

      // Map the of the csv headers to the database keys
      for (const [csvKey, dbKey] of Object.entries(mapping)) {
        entry[dbKey] = data[csvKey] || null;
      }

      // Keep the bank's own category (if it ships one) as a prediction hint.
      // It is not written to the database directly - it only feeds the
      // classifier, which maps it onto our own taxonomy.
      const categoryColumn = bankCategoryColumns[bankType as string];
      if (categoryColumn && data[categoryColumn]) {
        entry['__bankCategory'] = data[categoryColumn];
      }

      // Special handling for reformatting the date if the key is 'date_str'
      if (entry['date_str'] && !entry['date_str'].includes('-')) {
        entry['date_str'] = reformatDate(entry['date_str']);
      } else if (entry['date_str'] && isDayFirstDate(entry['date_str'])) {
        entry['date_str'] = reformatDayFirstDate(entry['date_str']);
      }

      // Strip ASN's literal single quotes from the free-text columns
      for (const key of ['name_description', 'notifications', 'counterparty']) {
        if (typeof entry[key] === 'string') {
          entry[key] = stripWrappingQuotes(entry[key]) || null;
        }
      }

      // Replace ',' with '.' in the amount and convert it to a number
      if (entry['amount']) {
        entry['amount'] = parseFloat(entry['amount'].replace(',', '.'));
      }

      // Set debit_credit NL to ENG
      if (entry['debit_credit'] !== undefined) {
        if (entry['debit_credit'] == 'Af') {
          entry['debit_credit'] = 'Debit';
        } else if (entry['debit_credit'] == 'Bij') {
            entry['debit_credit'] = 'Credit';
        }
      }

      // Set debit_credit based on the amount if it's null
      if (entry['debit_credit'] === undefined) {
        entry['debit_credit'] = entry['amount'] < 0 ? 'Debit' : 'Credit';
      }

      // Convert amount to absolute value
      entry['amount'] = Math.abs(entry['amount']);

      // ASN leaves 'Naam' empty for card payments and direct debits - the merchant
      // only appears at the start of the description. Fall back to that leading
      // segment so the row is identifiable and can still be auto-categorised.
      if (!entry['name_description'] && entry['notifications']) {
        const merchant = entry['notifications'].split('>')[0].trim();
        if (merchant) {
          entry['name_description'] = merchant;
        }
      }

      // Replace multiple whitespaces in name_description with a single whitespace
      if (entry['name_description']) {
        entry['name_description'] = entry['name_description'].replace(/\s+/g, ' ').trim();
      }

      entries.push(entry);
    })
    .on('end', async () => {
      try {
        // Train the classifier once for the whole batch - training reads every
        // stored transaction, so doing it per row is quadratic on large imports.
        // With no prior transactions this returns null, and classification
        // falls back to the merchant rules and the bank's own category.
        let classifier: Awaited<ReturnType<typeof trainModel>> | null = null;
        try {
          classifier = await trainModel();
        } catch (trainingError) {
          console.warn('Category prediction skipped, model could not be trained:', trainingError);
        }

        // Runs even without a trained classifier: the merchant rules and the
        // bank's own category still categorise a first import, which is when
        // there is nothing to learn from.
        for (const entry of entries) {
          const bankHint = entry['__bankCategory']
            ? asnCategoryMap[stripWrappingQuotes(entry['__bankCategory'])] ?? null
            : null;
          delete entry['__bankCategory']; // hint only - not a database column

          if (entry['name_description']) {
            const predictedCategory = await classifyWith(
              classifier,
              entry['name_description'],
              entry['account'],
              entry['notifications'],
              bankHint,
            );
            if (predictedCategory) {
              entry['category'] = predictedCategory;
            }
          }
        }
        
        const createdIds = await FinanceManager.addTransactions(entries);
        res.status(200).json({ message: 'Entries imported successfully', createdIds });
      } catch (error) {
        res.status(500).send(`Error importing entries: ${error}`);
      } finally {
        fs.unlinkSync(filePath);
      }
    })
    .on('error', (error) => {
      res.status(500).send(`Error reading file: ${error}`);
    });
});

router.get('/transactions', async (req: Request, res: Response) => {
  const { startDate, endDate, ids } = req.query;
  let idList: number[] = [];

  if (ids) {
    try {
      idList = JSON.parse(ids as string);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid IDs format' });
    }
  }

  try {
    const transactions = await FinanceManager.getTransactions(startDate as string, endDate as string, idList);
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

router.get('/category-list', async (req: Request, res: Response) => {
  try {
    const updatedTransaction = await FinanceManager.getCategoryList();
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/investment-accounts', async (req: Request, res: Response) => {
  try {
    const updatedTransaction = await FinanceManager.getInvestmentAccounts();
    res.status(200).json(updatedTransaction);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.use('/upload-investments', bodyParser.json(), (req, res, next) => {
  if (req.is('application/json') && req.body && Object.keys(req.body).length > 0) {
    next();
  } else {
    res.status(400).json({ error: 'Invalid request: Content-Type must be application/json and body must not be empty' });
  }
});

router.post('/upload-investments', async (req: Request, res: Response) => {
  const investments = req.body;

  try {  
    const createdIds = await FinanceManager.addInvestments(investments);
    res.status(200).json({ message: 'Entries imported successfully', createdIds });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.delete('/remove-transaction/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await FinanceManager.deleteTransaction(id);
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// --- Tags -------------------------------------------------------------------

router.get('/tags', async (req: Request, res: Response) => {
  // ?includeClosed=false hides finished events from pickers.
  const includeClosed = req.query.includeClosed !== 'false';

  try {
    const tags = await FinanceManager.getTags(includeClosed);
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.post('/tags', async (req: Request, res: Response) => {
  const { tag_name, color, budget, notes } = req.body;

  if (!tag_name || typeof tag_name !== 'string' || !tag_name.trim()) {
    return res.status(400).json({ error: 'tag_name is required' });
  }

  try {
    const tag = await FinanceManager.createTag({ tag_name: tag_name.trim(), color, budget, notes });
    res.status(201).json(tag);
  } catch (error: any) {
    // 23505 = unique_violation on tag_name
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'A tag with that name already exists' });
    }
    res.status(500).json({ error });
  }
});

router.patch('/tags/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tag = await FinanceManager.updateTag(id, req.body);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json(tag);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'A tag with that name already exists' });
    }
    res.status(500).json({ error });
  }
});

router.delete('/tags/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tag = await FinanceManager.deleteTag(id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/tags/:id/summary', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const summary = await FinanceManager.getTagSummary(id);
    if (!summary) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error });
  }
});

router.get('/transactions/:id/tags', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tags = await FinanceManager.getTagsForTransaction(id);
    res.status(200).json(tags);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// Replaces the transaction's tags with the supplied set.
router.put('/transactions/:id/tags', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tagIds } = req.body;

  if (!Array.isArray(tagIds) || tagIds.some((t) => !Number.isInteger(t))) {
    return res.status(400).json({ error: 'tagIds must be an array of integers' });
  }

  try {
    const tags = await FinanceManager.setTransactionTags(id, tagIds);
    res.status(200).json(tags);
  } catch (error: any) {
    // 23503 = foreign_key_violation (unknown transaction or tag)
    if (error?.code === '23503') {
      return res.status(400).json({ error: 'Unknown transaction or tag id' });
    }
    res.status(500).json({ error });
  }
});


export default router;
