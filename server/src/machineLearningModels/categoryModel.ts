import natural from 'natural';
import FinanceManager from '@/managers/financeManager';

async function preprocessText(textArray: string[]): Promise<string[]> {
	const tokenizer = new natural.WordTokenizer();
	const stemmer = natural.PorterStemmer;

	const processedArray = textArray.map(text => {
		text = text.toLowerCase();
		text = text.replace(/[^\w\s]/gi, '');
		let tokens = tokenizer.tokenize(text);
		tokens = tokens.map(token => stemmer.stem(token));
		return tokens.join(' ');
	});

	// return processedArray;
	return textArray
}

async function trainModel() {
	const data = await FinanceManager.getTransactions();
	const classifier = new natural.BayesClassifier();

	for (const row of data) {
		const combinedText = [`${row.name_description}`, `${row.account}`, `${row.notifications}`];
		const preprocessedText = await preprocessText(combinedText);
		classifier.addDocument(preprocessedText, row.category);
	}

	classifier.train();
	return classifier;
}

async function predictCategory(name_description: string, account: string, notifications: string) {
	const classifier = await trainModel();
	const combinedText = [`${name_description}`, `${account}`, `${notifications}`];
	const preprocessedText = await preprocessText(combinedText);
	const probabilityThreshold = parseFloat(process.env.ML_PROBABILITY_THRESHOLD || '0.03');
	const classifications = classifier.getClassifications(preprocessedText);

	if (classifications.length > 0 && classifications[0].value >= probabilityThreshold) {
		return classifications[0].label;
	}

	return null;
}

export { predictCategory };
