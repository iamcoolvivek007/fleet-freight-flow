interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
}

interface Expense {
  id: string;
  amount: number;
  payment_method: string;
}

interface Charge {
  id: string;
  amount: number;
  charged_to: string;
  status: string;
}

interface LoadAssignment {
  commission_amount: number | null;
  commission_percentage: number | null;
}

interface Load {
  provider_freight: number;
  truck_freight: number | null;
  payment_model?: string;
}

export const isInflow = (transactionType: string): boolean => {
  return ['advance_from_provider', 'balance_from_provider', 'commission'].includes(transactionType);
};

export const isOutflow = (transactionType: string): boolean => {
  return ['advance_to_driver', 'balance_to_driver'].includes(transactionType);
};

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
