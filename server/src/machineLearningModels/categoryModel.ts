import natural from 'natural';
import FinanceManager from '@/managers/financeManager';

async function preprocessText(textArray: string[]): Promise<string[]> {
    const tokenizer = new natural.WordTokenizer();
    const stemmer = natural.PorterStemmer;

    return textArray.map(text => {
        const lowercased = text.toLowerCase();
        const withoutPunctuation = lowercased.replace(/[^\w\s]/gi, '');
        const tokens = tokenizer.tokenize(withoutPunctuation);
        const stemmed = tokens.map(token => stemmer.stem(token));
        return stemmed.join(' ');
    });
}

async function trainModel() {
    const data = await FinanceManager.getTransactions();
    const classifier = new natural.BayesClassifier();

    for (const row of data) {
        const combinedText = [`${row.account}`, `${row.notifications}`];
        
        // Split row.name_description by spaces and append each word to the combinedText
        combinedText.push(...`${row.name_description}`.split(' '));
        
        const preprocessedText = await preprocessText(combinedText);
        classifier.addDocument(preprocessedText.join(' '), row.category);
    }
    

    classifier.train();
    return classifier;
}

async function predictCategory(name_description: string, account: string, notifications: string) {
    const classifier = await trainModel();
    const combinedText = [`${name_description}`, `${account}`, `${notifications}`];
    const preprocessedText = await preprocessText(combinedText);
    const probabilityThreshold = parseFloat(process.env.ML_PROBABILITY_THRESHOLD || '0.03');
    const classification = classifier.getClassifications(preprocessedText.join(' '))[0];

    return classification && classification.value >= probabilityThreshold ? classification.label : null;
}

export { predictCategory, trainModel, preprocessText };