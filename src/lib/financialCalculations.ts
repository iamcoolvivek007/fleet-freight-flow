/**
 * @interface Transaction
 * @description The transaction interface.
 * @property {string} id - The transaction ID.
 * @property {string} transaction_type - The transaction type.
 * @property {number} amount - The transaction amount.
 * @property {string} payment_method - The payment method.
 */
interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
}

/**
 * @interface Expense
 * @description The expense interface.
 * @property {string} id - The expense ID.
 * @property {number} amount - The expense amount.
 * @property {string} payment_method - The payment method.
 */
interface Expense {
  id: string;
  amount: number;
  payment_method: string;
}

/**
 * @interface Charge
 * @description The charge interface.
 * @property {string} id - The charge ID.
 * @property {number} amount - The charge amount.
 * @property {string} charged_to - The person charged to.
 * @property {string} status - The charge status.
 */
interface Charge {
  id: string;
  amount: number;
  charged_to: string;
  status: string;
}

/**
 * @interface LoadAssignment
 * @description The load assignment interface.
 * @property {number | null} commission_amount - The commission amount.
 * @property {number | null} commission_percentage - The commission percentage.
 */
interface LoadAssignment {
  commission_amount: number | null;
  commission_percentage: number | null;
}

/**
 * @interface Load
 * @description The load interface.
 * @property {number} provider_freight - The provider freight.
 * @property {number | null} truck_freight - The truck freight.
 * @property {string} [payment_model] - The payment model.
 */
interface Load {
  provider_freight: number;
  truck_freight: number | null;
  payment_model?: string;
}

/**
 * @name isInflow
 * @description Checks if a transaction type is an inflow.
 * @param {string} transactionType - The transaction type.
 * @returns {boolean} - Whether the transaction type is an inflow.
 */
export const isInflow = (transactionType: string): boolean => {
  return ['advance_from_provider', 'balance_from_provider', 'commission'].includes(transactionType);
};

/**
 * @name isOutflow
 * @description Checks if a transaction type is an outflow.
 * @param {string} transactionType - The transaction type.
 * @returns {boolean} - Whether the transaction type is an outflow.
 */
export const isOutflow = (transactionType: string): boolean => {
  return ['advance_to_driver', 'balance_to_driver'].includes(transactionType);
};

/**
 * @name calculateLoadFinancials
 * @description Calculates the financials for a load.
 * @param {Load} load - The load.
 * @param {LoadAssignment | null} assignment - The load assignment.
 * @param {Transaction[]} transactions - The transactions.
 * @param {Expense[]} expenses - The expenses.
 * @param {Charge[]} charges - The charges.
 * @returns {object} - The financials for the load.
 */
export const calculateLoadFinancials = (
  load: Load,
  assignment: LoadAssignment | null,
  transactions: Transaction[],
  expenses: Expense[],
  charges: Charge[]
) => {
  const isCommissionOnly = load.payment_model === 'commission_only';

  if (isCommissionOnly) {
    // Commission-only model: party pays driver directly
    const commissionAmount = assignment?.commission_amount || 0;
    const commissionReceived = transactions
      .filter(t => t.transaction_type === 'commission')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const chargesFromParty = charges
      .filter(c => c.charged_to === 'party' && c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const chargesToDriver = charges
      .filter(c => c.charged_to === 'supplier' && c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalRevenue = commissionReceived + chargesFromParty;
    const totalCosts = totalExpenses + chargesToDriver;
    const netProfit = totalRevenue - totalCosts;
    
    return {
      totalRevenue,
      totalExpenses: totalCosts,
      netProfit,
      cashInHand: totalRevenue - totalCosts,
      balanceToReceive: commissionAmount - commissionReceived,
      balanceToPay: 0,
      commissionAmount,
      commissionReceived,
      isCommissionOnly: true,
    };
  } else {
    // Standard model: we handle all payments
    const providerFreight = load.provider_freight || 0;
    const truckFreight = load.truck_freight || 0;
    
    const advanceFromProvider = transactions
      .filter(t => t.transaction_type === 'advance_from_provider')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balanceFromProvider = transactions
      .filter(t => t.transaction_type === 'balance_from_provider')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const advanceToDriver = transactions
      .filter(t => t.transaction_type === 'advance_to_driver')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balanceToDriver = transactions
      .filter(t => t.transaction_type === 'balance_to_driver')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalReceived = advanceFromProvider + balanceFromProvider;
    const totalPaid = advanceToDriver + balanceToDriver;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const chargesFromParty = charges
      .filter(c => c.charged_to === 'party' && c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const chargesToDriver = charges
      .filter(c => c.charged_to === 'supplier' && c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);
    
    const totalRevenue = totalReceived + chargesFromParty;
    const totalCosts = totalPaid + totalExpenses + chargesToDriver;
    const netProfit = totalRevenue - totalCosts;
    
    return {
      totalRevenue,
      totalExpenses: totalCosts,
      netProfit,
      cashInHand: totalReceived - totalPaid - totalExpenses,
      balanceToReceive: providerFreight - totalReceived,
      balanceToPay: truckFreight - totalPaid,
      advanceFromProvider,
      balanceFromProvider,
      advanceToDriver,
      balanceToDriver,
      isCommissionOnly: false,
    };
  }
};

export const getCashBalanceByMethod = (
  transactions: Transaction[],
  expenses: Expense[],
  method: 'cash' | 'upi' | 'bank_transfer'
) => {
  const inflows = transactions
    .filter(t => t.payment_method === method && isInflow(t.transaction_type))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const outflows = [
    ...transactions
      .filter(t => t.payment_method === method && isOutflow(t.transaction_type))
      .map(t => ({ amount: t.amount })),
    ...expenses.filter(e => e.payment_method === method)
  ].reduce((sum, item) => sum + item.amount, 0);
  
  return inflows - outflows;
};

export const getPartialPaymentProgress = (
  transactions: Transaction[],
  transactionType: string,
  targetAmount: number
) => {
  const payments = transactions.filter(t => t.transaction_type === transactionType);
  const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0);
  const percentage = targetAmount > 0 ? (totalPaid / targetAmount) * 100 : 0;
  
  return {
    payments,
    totalPaid,
    remaining: targetAmount - totalPaid,
    percentage: Math.min(percentage, 100),
  };
};
