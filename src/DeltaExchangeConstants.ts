export const Side = {
  buy: "buy",
  sell: "sell"
}

export const OrderType = {
  MARKET: 'market_order',
  LIMIT: 'limit_order'
}

export const StopOrderType = {
  STOP_LOSS: 'stop_loss_order',
  TAKE_PROFIT: "take_profit_order"
}

export const StopTriggerMethod = {
  MARK_PRICE: "mark_price",
  LAST_TRADED_PRICE: "last_traded_price",
  SPOT_PRICE: "spot_price"
}

export const TimeInForce = {
  FOK: 'fok',
  IOC: 'ioc',
  GTC: 'gtc'
}

export const PostOnly = {
  TRUE: "true",
  FALSE: "false"
}

export const ReduceOnly = {
  TRUE: "true",
  FALSE: "false"
}

export const Resolution = {
  _1m: "1m",
  _2m: "2m",
  _5m: "5m",
  _15m: "15m",
  _30m: "30m",
  _1h: "1h",
  _2h: "2h",
  _4h: "4h",
  _6h: "6h",
  _12h: "12h",
  _1d: "1d",
  _7d: "7d",
  _1w: "1w",
  _2w: "2w",
  _30d: "30d"
}
