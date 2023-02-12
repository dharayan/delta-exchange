import WebSocket from "ws";
import DeltaExchangeClient from "./DeltaExchangeClient";

export class DeltaExchangeSocket {
  private readonly api_key: string;
  private readonly api_secret: string;
  private readonly websocket: WebSocket;
  private socketOpened: boolean = false

  constructor(api_key: string, api_secret: string) {
    this.api_key = api_key;
    this.api_secret = api_secret;
    this.websocket = new WebSocket("wss://socket.delta.exchange")
    this.websocket.onopen = () => {
      this.socketOpened = true
    }
  }

  async connect() {
    if (this.socketOpened) {
      return
    }
    return new Promise((resolve, reject) => {
      this.websocket.onopen = () => {
        this.socketOpened = true
        resolve(undefined)
      }
    })
  }

  authenticate() {
    const timestamp = DeltaExchangeClient.get_time_stamp()
    this.websocket.send(JSON.stringify({
      "type": "auth",
      "payload": {
        "api-key": this.api_key,
        "signature": DeltaExchangeClient.sign_message(this.api_secret, "GET" + timestamp + "/live"),
        "timestamp": timestamp
      }
    }))
  }

  subscribe(type: string, ...symbols: string[]) {
    this.websocket.send(JSON.stringify({
      "type": "subscribe",
      "payload": {
        "channels": [
          {
            "name": type,
            "symbols": symbols
          }
        ]
      }
    }))
  }

  subscribe_to_tickers(...symbols: string[]) {
    this.subscribe("ticker", ...symbols)
  }

  subscribe_to_tickers_v2(...symbols: string[]) {
    this.subscribe("v2/ticker", ...symbols)
  }

  subscribe_to_order_books(...symbols: string[]) {
    this.subscribe("l2_orderbook", ...symbols)
  }

  subscribe_to_mark_prices(...symbols: string[]) {
    this.subscribe("mark_price", ...symbols.map(symbol => `MARK:${symbol}`))
  }

  subscribe_to_spot_prices(...symbols: string[]) {
    this.subscribe("spot_price", ...symbols.map(symbol => symbol.toUpperCase() === "BTCUSDT".toUpperCase() ? ".DEXBTUSDT" : `.DE${symbol}`))
  }

  subscribe_to_price_movements(...symbols: string[]) {
    this.subscribe_to_spot_prices(...symbols)
    this.subscribe_to_mark_prices(...symbols)
    this.subscribe_to_order_books(...symbols)
    this.subscribe_to_tickers(...symbols)
  }

  subscribe_to_candle_sticks(resolution: string, ...symbols: string[]) {
    this.subscribe("candlestick_" + resolution, ...symbols)
  }

  subscribe_to_product_updates() {
    this.subscribe("product_updates")
  }

  subscribe_to_announcements() {
    this.subscribe("announcements")
  }

  subscribe_to_positions(...symbols: string[]) {
    this.subscribe("positions", ...symbols)
  }

  subscribe_to_margins() {
    this.subscribe("margins")
  }

  subscribe_to_orders(...symbols: string[]) {
    this.subscribe("orders", ...symbols)
  }

  subscribe_to_fills(...symbols: string[]) {
    this.subscribe("user_trades", ...symbols)
  }

  subscribe_to_trading_activity(...symbols: string[]) {
    this.subscribe_to_fills(...symbols)
    this.subscribe_to_orders(...symbols)
    this.subscribe_to_positions(...symbols)
    this.subscribe_to_margins()
  }

  close() {
    this.websocket.close()
  }

  on_message(handler: (message: any) => void) {
    this.websocket.on("message", handler)
  }

  send_message(message: any) {
    if (typeof message === "string")
      this.websocket.send(message)
    else
      this.websocket.send(JSON.stringify(message))
  }
}

export default DeltaExchangeSocket
