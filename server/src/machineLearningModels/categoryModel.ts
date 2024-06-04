import natural from 'natural';
import FinanceManager from '@/managers/financeManager';

async function trainModel() {
	const data = await FinanceManager.getTransactions();
	const classifier = new natural.BayesClassifier();

	data.forEach((row: any) => {
		const combinedText = `${row.name_description} ${row.account} ${row.notifications}`;
		classifier.addDocument(combinedText, row.category);
	  });

	classifier.train();
	return classifier;
}

async function predictCategory(name_description: string, account: string, notifications: string) {
	const classifier = await trainModel();
	const combinedText = `${name_description} ${account} ${notifications}`;
	const probabilityThreshold = parseFloat(process.env.ML_PROBABILITY_THRESHOLD || '0.25');
	const classifications = classifier.getClassifications(combinedText);

	console.log("classifications: ", classifications);

	if (classifications.length > 0 && classifications[0].value >= probabilityThreshold) {
		return classifications[0].label;
	}

	return null;
}

export { predictCategory };
