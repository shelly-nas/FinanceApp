class Transactions {
  id?: number;
  date_str: string;
  name_description: string;
  account: number;
  counterparty: string | null;
  category: string;
  debit_credit: string;
  amount: number;
  transaction_type: string;
  notifications: string;

  constructor(
    id: number,
    date_str: string,
    name_description: string,
    account: number,
    counterparty: string | null,
    category: string,
    debit_credit: string,
    amount: number,
    transaction_type: string,
    notifications: string
  ) {
    this.id = id
    this.date_str = date_str;
    this.name_description = name_description;
    this.account = account;
    this.counterparty = counterparty;
    this.category = category;
    this.debit_credit = debit_credit;
    this.amount = amount;
    this.transaction_type = transaction_type;
    this.notifications = notifications;
  }
}

export default Transactions;
