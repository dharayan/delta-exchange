export enum Side {
  buy = "buy",
  sell = "sell"
}

export enum OrderType {
  MARKET = 'market_order',
  LIMIT = 'limit_order'
}

export enum StopOrderType {
  STOP_LOSS = 'stop_loss_order',
  TAKE_PROFIT = "take_profit_order"
}

export enum StopTriggerMethod {
  MARK_PRICE = "mark_price",
  LAST_TRADED_PRICE = "last_traded_price",
  SPOT_PRICE = "spot_price"
}

export enum TimeInForce {
  FOK = 'fok',
  IOC = 'ioc',
  GTC = 'gtc'
}

export enum PostOnly {
  TRUE = "true",
  FALSE = "false"
}

export enum ReduceOnly {
  TRUE = "true",
  FALSE = "false"
}

export enum Resolution {
  _1m = "1m",
  _3m = "3m",
  _5m = "5m",
  _15m = "15m",
  _30m = "30m",
  _1h = "1h",
  _2h = "2h",
  _4h = "4h",
  _6h = "6h",
  _1d = "1d",
  _7d = "7d",
  _1w = "1w",
  _2w = "2w",
  _30d = "30d"
}

export enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

export enum MMP {
  disabled = "disabled",
  mmp1 = "mmp1",
  mmp2 = "mmp2",
  mmp3 = "mmp3",
  mmp4 = "mmp4",
  mmp5 = "mmp5",
}

export enum CloseOnTrigger {
  TRUE = "true",
  FALSE = "false"
}
