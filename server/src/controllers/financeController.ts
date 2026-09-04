import express, { Request, Response, NextFunction } from 'express';
import FinanceManager from '@/managers/financeManager';
import { bankMappings, asnCategoryMap } from '@/models/bankTransactionModel'
import { parseBankRow, stripWrappingQuotes } from '@/utils/parseBankRow';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import { classifyWith, trainModel } from '@/machineLearningModels/categoryModel';
import bodyParser from 'body-parser';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

router.post('/upload-transactions', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
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
      const entry = parseBankRow(data, bankType as string);
      if (!entry) return;

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
          // The bank's own category maps onto our taxonomy; it never reaches
          // the database itself, only the classifier.
          const bankHint = entry.bankCategory
            ? asnCategoryMap[stripWrappingQuotes(entry.bankCategory)] ?? null
            : null;
          delete entry.bankCategory;

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
        
        const { createdIds, imported, skipped } = await FinanceManager.addTransactions(entries);

        // Rows already present are skipped rather than rejected, so overlapping
        // export periods can be imported without thinking about it. The counts
        // tell the user what actually happened.
        res.status(200).json({
          message: 'Entries imported successfully',
          createdIds,
          imported,
          skipped,
        });
      } catch (error) {
        // The raw error would otherwise reach the browser carrying the failed
        // query and column names; the handler logs it and returns a reference.
        next(error);
      } finally {
        // Async unlink: unlinkSync blocks the event loop, and the upload of a
        // large export is exactly when the server has other requests to serve.
        await fs.promises.unlink(filePath).catch((cleanupError) => {
          console.warn(`Could not remove upload ${filePath}:`, cleanupError);
        });
      }
    })
    .on('error', async (error) => {
      await fs.promises.unlink(filePath).catch(() => undefined);
      next(error);
    });
});

router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, ids, limit, offset } = req.query;
  let idList: number[] = [];

  if (ids) {
    try {
      idList = JSON.parse(ids as string);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid IDs format' });
    }
  }

  // Capped rather than rejected: a caller asking for more than the ceiling gets
  // the ceiling, so a large history cannot be pulled in one response.
  const MAX_LIMIT = 5000;
  const parsedLimit = limit === undefined ? MAX_LIMIT : Number(limit);
  const parsedOffset = offset === undefined ? 0 : Number(offset);

  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ error: 'limit must be a positive number' });
  }
  if (!Number.isFinite(parsedOffset) || parsedOffset < 0) {
    return res.status(400).json({ error: 'offset must be zero or more' });
  }

  try {
    const transactions = await FinanceManager.getTransactions(
      startDate as string,
      endDate as string,
      idList,
      Math.min(parsedLimit, MAX_LIMIT),
      parsedOffset,
    );
    res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
});


router.get('/category-sums', async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  try {
    const categorySums = await FinanceManager.getCategorySums(startDate as string, endDate as string);
    res.status(200).json(categorySums);
  } catch (error) {
    next(error);
  }
});

router.get('/income-expenses-sum', async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  try {
    const categorySums = await FinanceManager.getIncomeExpensesSum(startDate as string, endDate as string);
    res.status(200).json(categorySums);
  } catch (error) {
    next(error);
  }
});

router.get('/empty-category-transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categorySums = await FinanceManager.getEmptyCategoryTransactions();
    res.status(200).json(categorySums);
  } catch (error) {
    next(error);
  }
});

router.patch('/update-transaction/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedTransaction = await FinanceManager.updateTransaction(id, updates);
    res.status(200).json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

router.get('/account-overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedTransaction = await FinanceManager.getAccountOverview();
    res.status(200).json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

router.get('/category-list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedTransaction = await FinanceManager.getCategoryList();
    res.status(200).json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

router.get('/investment-accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedTransaction = await FinanceManager.getInvestmentAccounts();
    res.status(200).json(updatedTransaction);
  } catch (error) {
    next(error);
  }
});

router.use('/upload-investments', bodyParser.json(), (req, res, next) => {
  if (req.is('application/json') && req.body && Object.keys(req.body).length > 0) {
    next();
  } else {
    res.status(400).json({ error: 'Invalid request: Content-Type must be application/json and body must not be empty' });
  }
});

router.post('/upload-investments', async (req: Request, res: Response, next: NextFunction) => {
  const investments = req.body;

  try {  
    const createdIds = await FinanceManager.addInvestments(investments);
    res.status(200).json({ message: 'Entries imported successfully', createdIds });
  } catch (error) {
    next(error);
  }
});

router.delete('/remove-transaction/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    await FinanceManager.deleteTransaction(id);
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// --- Search and bulk edits --------------------------------------------------

const parseJsonArray = (value: unknown): any[] | undefined => {
  if (value === undefined) return undefined;
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

// The one query behind every transaction list: the review screen passes
// uncategorised=true, a category drill-down passes categories, the search screen
// passes whatever was typed.
router.get('/transactions/search', async (req: Request, res: Response, next: NextFunction) => {
  const {
    query, startDate, endDate, categories, accounts, tagIds,
    debitCredit, minAmount, maxAmount, uncategorised, includeInternal,
    sortBy, sortDir, limit, offset,
  } = req.query;

  const parsedLimit = limit === undefined ? 100 : Number(limit);
  const parsedOffset = offset === undefined ? 0 : Number(offset);

  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    return res.status(400).json({ error: 'limit must be a positive number' });
  }
  if (!Number.isFinite(parsedOffset) || parsedOffset < 0) {
    return res.status(400).json({ error: 'offset must be zero or more' });
  }
  if (debitCredit !== undefined && debitCredit !== 'Debit' && debitCredit !== 'Credit') {
    return res.status(400).json({ error: "debitCredit must be 'Debit' or 'Credit'" });
  }

  try {
    const result = await FinanceManager.searchTransactions({
      query: query as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      categories: parseJsonArray(categories),
      accounts: parseJsonArray(accounts),
      tagIds: parseJsonArray(tagIds),
      debitCredit: debitCredit as string | undefined,
      minAmount: minAmount === undefined ? undefined : Number(minAmount),
      maxAmount: maxAmount === undefined ? undefined : Number(maxAmount),
      uncategorised: uncategorised === 'true',
      includeInternal: includeInternal === 'true',
      sortBy: sortBy as string | undefined,
      sortDir: sortDir === 'asc' ? 'asc' : 'desc',
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Account identifiers actually present in transactions, for the filter list -
// including ones with no entry in the accounts table yet.
router.get('/transactions/accounts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await FinanceManager.getTransactionAccounts());
  } catch (error) {
    next(error);
  }
});

// One change applied to a selection: categorising an import row by row is the
// bulk of the work on the review screen.
router.patch('/transactions/bulk', async (req: Request, res: Response, next: NextFunction) => {
  const { ids, updates } = req.body;

  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ error: 'ids must be a non-empty array of integers' });
  }
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'updates must be an object' });
  }

  try {
    const updated = await FinanceManager.bulkUpdateTransactions(ids, updates);
    res.status(200).json({ updated });
  } catch (error: any) {
    if (error?.message === 'No updatable columns supplied') {
      return res.status(400).json({ error: error.message });
    }
    // 23503 = foreign_key_violation, an unknown category
    if (error?.code === '23503') {
      return res.status(400).json({ error: 'Unknown category' });
    }
    next(error);
  }
});

router.post('/transactions/bulk-tag', async (req: Request, res: Response, next: NextFunction) => {
  const { ids, tagId, mode } = req.body;

  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !Number.isInteger(id))) {
    return res.status(400).json({ error: 'ids must be a non-empty array of integers' });
  }
  if (!Number.isInteger(tagId)) {
    return res.status(400).json({ error: 'tagId must be an integer' });
  }
  if (mode !== 'add' && mode !== 'remove') {
    return res.status(400).json({ error: "mode must be 'add' or 'remove'" });
  }

  try {
    const affected = await FinanceManager.bulkSetTag(ids, tagId, mode);
    res.status(200).json({ affected });
  } catch (error: any) {
    if (error?.code === '23503') {
      return res.status(400).json({ error: 'Unknown transaction or tag id' });
    }
    next(error);
  }
});

// --- Accounts ---------------------------------------------------------------

router.get('/accounts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await FinanceManager.getAccounts());
  } catch (error) {
    next(error);
  }
});

// Account identifiers seen in transactions but absent from the accounts table.
// Their rows import fine, but without an entry they have no name, no opening
// balance, and cannot take part in transfer detection.
router.get('/accounts/unknown', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await FinanceManager.getUnknownAccounts());
  } catch (error) {
    next(error);
  }
});

const ACCOUNT_TYPES = ['Checking Account', 'Savings Account', 'Investments'];

router.post('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  const { account_type, account_name, details, balance_when_created } = req.body;

  if (!ACCOUNT_TYPES.includes(account_type)) {
    return res.status(400).json({ error: `account_type must be one of: ${ACCOUNT_TYPES.join(', ')}` });
  }
  if (!account_name || typeof account_name !== 'string' || !account_name.trim()) {
    return res.status(400).json({ error: 'account_name is required' });
  }
  if (!details || typeof details !== 'string' || !details.trim()) {
    return res.status(400).json({ error: 'details (the IBAN or account identifier) is required' });
  }
  if (balance_when_created !== undefined && balance_when_created !== null && Number.isNaN(Number(balance_when_created))) {
    return res.status(400).json({ error: 'balance_when_created must be a number' });
  }

  try {
    const account = await FinanceManager.createAccount({
      account_type,
      account_name: account_name.trim(),
      details: details.trim(),
      balance_when_created: balance_when_created === undefined || balance_when_created === null
        ? 0
        : Number(balance_when_created),
    });
    res.status(201).json(account);
  } catch (error: any) {
    // 23505 = unique_violation on details
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'An account with that identifier already exists' });
    }
    next(error);
  }
});

router.patch('/accounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (req.body.account_type !== undefined && !ACCOUNT_TYPES.includes(req.body.account_type)) {
    return res.status(400).json({ error: `account_type must be one of: ${ACCOUNT_TYPES.join(', ')}` });
  }

  try {
    const account = await FinanceManager.updateAccount(id, req.body);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.status(200).json(account);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'An account with that identifier already exists' });
    }
    next(error);
  }
});

router.delete('/accounts/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const { deleted, blockedBy } = await FinanceManager.deleteAccount(id);

    if (blockedBy) {
      return res.status(409).json({
        error: `This account still has ${blockedBy} transaction(s) or investment(s). Reassign or remove those first.`,
      });
    }
    if (!deleted) return res.status(404).json({ error: 'Account not found' });

    res.status(200).json({ message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
});

// --- Internal transfers -----------------------------------------------------

// Candidate pairs for review. ?ids=[..] narrows it to a fresh import, so the
// review screen proposes pairs for the rows just added instead of the whole
// history.
router.get('/transfer-candidates', async (req: Request, res: Response, next: NextFunction) => {
  const { ids, windowDays } = req.query;
  let idList: number[] = [];

  if (ids) {
    try {
      idList = JSON.parse(ids as string);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid IDs format' });
    }
  }

  const days = windowDays ? Number(windowDays) : 3;
  if (!Number.isFinite(days) || days < 0 || days > 31) {
    return res.status(400).json({ error: 'windowDays must be between 0 and 31' });
  }

  try {
    const candidates = await FinanceManager.getTransferCandidates(idList, days);
    res.status(200).json(candidates);
  } catch (error) {
    next(error);
  }
});

router.get('/transfers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const transfers = await FinanceManager.getTransfers();
    res.status(200).json(transfers);
  } catch (error) {
    next(error);
  }
});

// Confirm a suggested pair: both rows drop out of the income/expense summaries
// and are categorised as a transfer, which also clears them off the review list.
router.post('/transfers', async (req: Request, res: Response, next: NextFunction) => {
  const { fromTransactionId, toTransactionId, matchBasis } = req.body;

  if (!Number.isInteger(fromTransactionId) || !Number.isInteger(toTransactionId)) {
    return res.status(400).json({ error: 'fromTransactionId and toTransactionId must be integers' });
  }
  if (fromTransactionId === toTransactionId) {
    return res.status(400).json({ error: 'A transfer needs two different transactions' });
  }
  if (matchBasis !== 'iban' && matchBasis !== 'amount') {
    return res.status(400).json({ error: "matchBasis must be 'iban' or 'amount'" });
  }

  try {
    const transfer = await FinanceManager.confirmTransfer(fromTransactionId, toTransactionId, matchBasis);
    if (!transfer) {
      return res.status(409).json({ error: 'One of these transactions is already part of a transfer' });
    }
    res.status(201).json(transfer);
  } catch (error) {
    next(error);
  }
});

// Reject a suggestion, so it is not proposed again after the next import.
router.post('/transfers/reject', async (req: Request, res: Response, next: NextFunction) => {
  const { fromTransactionId, toTransactionId } = req.body;

  if (!Number.isInteger(fromTransactionId) || !Number.isInteger(toTransactionId)) {
    return res.status(400).json({ error: 'fromTransactionId and toTransactionId must be integers' });
  }

  try {
    await FinanceManager.rejectTransfer(fromTransactionId, toTransactionId);
    res.status(200).json({ message: 'Suggestion dismissed' });
  } catch (error) {
    next(error);
  }
});

router.delete('/transfers/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const removed = await FinanceManager.unlinkTransfer(id);
    if (!removed) return res.status(404).json({ error: 'Transfer not found' });
    res.status(200).json({ message: 'Transfer unlinked' });
  } catch (error) {
    next(error);
  }
});

// --- Tags -------------------------------------------------------------------

router.get('/tags', async (req: Request, res: Response, next: NextFunction) => {
  // ?includeClosed=false hides finished events from pickers.
  const includeClosed = req.query.includeClosed !== 'false';

  try {
    const tags = await FinanceManager.getTags(includeClosed);
    res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
});

router.post('/tags', async (req: Request, res: Response, next: NextFunction) => {
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
    next(error);
  }
});

router.patch('/tags/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const tag = await FinanceManager.updateTag(id, req.body);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json(tag);
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'A tag with that name already exists' });
    }
    next(error);
  }
});

router.delete('/tags/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const tag = await FinanceManager.deleteTag(id);
    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/tags/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const summary = await FinanceManager.getTagSummary(id);
    if (!summary) return res.status(404).json({ error: 'Tag not found' });
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
});

router.get('/transactions/:id/tags', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  try {
    const tags = await FinanceManager.getTagsForTransaction(id);
    res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
});

// Replaces the transaction's tags with the supplied set.
router.put('/transactions/:id/tags', async (req: Request, res: Response, next: NextFunction) => {
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
    next(error);
  }
});


export default router;
