export interface Order {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  openTime: string;
  sl: number;
  tp: number;
}

export interface PendingOrder {
  ticket: number;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP' | 'BUY_STOP_LIMIT' | 'SELL_STOP_LIMIT';
  lots: number;
  openPrice: number;
  sl: number;
  tp: number;
  expiration: string | null;
}

export interface Account {
  id: string;
  name: string;
  broker: string;
  accountNumber: string;
  apiKey: string;
  status: 'online' | 'offline';
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  drawdown: number;
  profit: number;
  openLots: number;
  buyLots: number;
  sellLots: number;
  pendingOrders: number;
  orders: Order[];
  pending: PendingOrder[];
  server: string;
  currency: string;
  leverage: number;
  groupId?: string | null;
  groupName?: string;
  groupColor?: string;
}
