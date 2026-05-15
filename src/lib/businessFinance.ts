type BusinessSale = {
  status?: string;
  amount?: number;
  profit?: number;
  refund?: boolean;
  chargeback?: boolean;
};

export const isPaidBusinessSale = (sale: unknown): sale is BusinessSale => {
  if (!sale || typeof sale !== "object") return false;
  const s = sale as BusinessSale;
  return s.status === "Pago" && !s.refund && !s.chargeback;
};

export const getBusinessSalesTotal = (sales: unknown[]) =>
  sales.filter(isPaidBusinessSale).reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
