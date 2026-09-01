import natural from 'natural';
import FinanceManager from '@/managers/financeManager';
import { matchMerchantRule } from './dutchMerchantRules';

// Dutch stop words plus the boilerplate that Dutch bank statements repeat on
// nearly every line. Left in, these dominate the token counts and drown out the
// merchant name that actually carries the signal.
const DUTCH_STOP_WORDS = new Set([
    'de', 'het', 'een', 'en', 'van', 'voor', 'naar', 'met', 'op', 'aan', 'bij',
    'is', 'in', 'te', 'ter', 'tot', 'uit', 'om', 'door', 'over', 'als', 'dat',
    'die', 'deze', 'dit', 'er', 'of', 'ook', 'maar', 'niet', 'geen',
    // Statement boilerplate
    'betaling', 'betaald', 'incasso', 'europese', 'sepa', 'machtiging',
    'referentie', 'omschrijving', 'kenmerk', 'transactie', 'volgnummer',
    'mandaat', 'apple', 'pay', 'google', 'contactloos', 'pinnen', 'pinbetaling',
    'nlnederland', 'nederland', 'eur', 'mcc', 'ideal', 'overboeking',
]);

// Tokens that are pure noise: terminal ids, card sequence numbers, dates and
// long reference strings. Keeping them lets the classifier memorise a single
// transaction's reference instead of learning the merchant.
function isNoiseToken(token: string): boolean {
    if (token.length < 2) return true;
    if (/^\d+$/.test(token)) return true;              // pure numbers
    if (/^\d{2}u\d{2}$/.test(token)) return true;      // times like 11u28
    if (token.length > 12 && /\d/.test(token)) return true; // long refs with digits
    return false;
}

// The merchant name in a Dutch card transaction sits before the '>' that
// precedes the city. Splitting there keeps the useful half and drops the
// location/date/terminal tail.
function extractMerchantSegment(text: string): string {
    return text.split('>')[0];
}

async function preprocessText(textArray: string[]): Promise<string[]> {
    const tokenizer = new natural.WordTokenizer();
    // Dutch stemmer, not the English PorterStemmer: without it "verzekering"
    // and "verzekeringen" are treated as unrelated words, which is exactly the
    // kind of match this classifier depends on.
    const stemmer = natural.PorterStemmerNl;

    return textArray.map(text => {
        const lowercased = extractMerchantSegment(text).toLowerCase();
        const withoutPunctuation = lowercased.replace(/[^\w\s]/gi, ' ');
        const tokens = tokenizer.tokenize(withoutPunctuation) || [];
        const meaningful = tokens.filter(
            (t) => !DUTCH_STOP_WORDS.has(t) && !isNoiseToken(t),
        );
        const stemmed = meaningful.map(token => stemmer.stem(token));
        return stemmed.join(' ');
    });
}

// Below this many categorised rows, Bayes produces noise rather than signal
// and the merchant rules do better on their own.
const MIN_TRAINING_DOCUMENTS = 10;

async function trainModel() {
    const data = await FinanceManager.getTransactions();
    const classifier = new natural.BayesClassifier();
    let documentCount = 0;

    for (const row of data) {
        // Only learn from rows a human actually categorised.
        if (!row.category) continue;

        const combinedText = [`${row.name_description}`, `${row.notifications}`];
        const preprocessedText = await preprocessText(combinedText);
        const document = preprocessedText.join(' ').trim();

        if (!document) continue;

        classifier.addDocument(document, row.category);
        documentCount++;
    }

    // BayesClassifier.train() throws on an empty corpus, and a handful of
    // documents produces noise rather than predictions. Below that, the rules
    // do the work on their own.
    if (documentCount < MIN_TRAINING_DOCUMENTS) {
        return null;
    }

    classifier.train();
    return classifier;
}


// Classify against an already-trained classifier. Training loads every
// transaction and is far too expensive to repeat per row, so callers importing
// a batch should call trainModel() once and reuse the result.
//
// Two layers, most reliable first:
//   1. Merchant rules - work on a first import, when nothing has been learned.
//   2. Naive Bayes over previously categorised transactions - picks up personal
//      and local merchants no rule list can know about.
//
// The learned model wins when it is confident, because it reflects this user's
// own corrections; otherwise the rules provide the floor.
async function classifyWith(
    classifier: natural.BayesClassifier | null,
    name_description: string,
    account: string,
    notifications: string,
    bankCategoryHint?: string | null,
) {
    const ruleText = `${name_description} ${notifications}`;
    const ruleMatch = matchMerchantRule(ruleText);

    let learnedLabel: string | null = null;
    let learnedConfidence = 0;

    if (classifier) {
        const preprocessedText = await preprocessText([`${name_description}`, `${notifications}`]);
        const document = preprocessedText.join(' ').trim();

        if (document) {
            const classifications = classifier.getClassifications(document);
            const best = classifications[0];
            if (best) {
                // getClassifications returns unnormalised scores; normalising
                // makes the threshold mean "share of total probability" rather
                // than depending on how many categories exist.
                const total = classifications.reduce((sum, c) => sum + c.value, 0);
                learnedLabel = best.label;
                learnedConfidence = total > 0 ? best.value / total : 0;
            }
        }
    }

    const confidentThreshold = parseFloat(process.env.ML_CONFIDENT_THRESHOLD || '0.65');
    const fallbackThreshold = parseFloat(process.env.ML_PROBABILITY_THRESHOLD || '0.35');

    // A confident learned prediction reflects the user's own past corrections.
    if (learnedLabel && learnedConfidence >= confidentThreshold) {
        return learnedLabel;
    }

    // Otherwise fall back to the rules, which are deterministic and safe.
    if (ruleMatch) {
        return ruleMatch;
    }

    // The bank's own category, mapped onto our taxonomy, is weaker than both of
    // the above but better than leaving the row blank.
    if (bankCategoryHint) {
        return bankCategoryHint;
    }

    // Last resort: a weak learned guess still beats nothing, since every import
    // lands on the review screen anyway.
    if (learnedLabel && learnedConfidence >= fallbackThreshold) {
        return learnedLabel;
    }

    return null;
}

// Convenience wrapper for one-off predictions; trains a fresh classifier.
async function predictCategory(name_description: string, account: string, notifications: string) {
    const classifier = await trainModel();
    return classifyWith(classifier, name_description, account, notifications);
}

export { predictCategory, classifyWith, trainModel, preprocessText };
