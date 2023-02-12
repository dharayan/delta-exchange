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
    const timestamp = DeltaExchangeClient.getTimeStamp()
    this.websocket.send(JSON.stringify({
      "type": "auth",
      "payload": {
        "api-key": this.api_key,
        "signature": DeltaExchangeClient.signMessage(this.api_secret, "GET" + timestamp + "/live"),
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

  subscribeToTickers(...symbols: string[]) {
    this.subscribe("ticker", ...symbols)
  }

  subscribeToTickersV2(...symbols: string[]) {
    this.subscribe("v2/ticker", ...symbols)
  }

  subscribeToOrderBooks(...symbols: string[]) {
    this.subscribe("l2_orderbook", ...symbols)
  }

  subscribeToMarkPrices(...symbols: string[]) {
    this.subscribe("mark_price", ...symbols.map(symbol => `MARK:${symbol}`))
  }

  subscribe_to_spot_prices(...symbols: string[]) {
    this.subscribe("spot_price", ...symbols.map(symbol => symbol.toUpperCase() === "BTCUSDT".toUpperCase() ? ".DEXBTUSDT" : `.DE${symbol}`))
  }

  subscribeToPriceMovements(...symbols: string[]) {
    this.subscribe_to_spot_prices(...symbols)
    this.subscribeToMarkPrices(...symbols)
    this.subscribeToOrderBooks(...symbols)
    this.subscribeToTickers(...symbols)
  }

  subscribeToCandleSticks(resolution: string, ...symbols: string[]) {
    this.subscribe("candlestick_" + resolution, ...symbols)
  }

  subscribeToProductUpdates() {
    this.subscribe("product_updates")
  }

  subscribeToAnnouncements() {
    this.subscribe("announcements")
  }

  subscribeToPositions(...symbols: string[]) {
    this.subscribe("positions", ...symbols)
  }

  subscribeToMargins() {
    this.subscribe("margins")
  }

  subscribeToOrders(...symbols: string[]) {
    this.subscribe("orders", ...symbols)
  }

  subscribeToFills(...symbols: string[]) {
    this.subscribe("user_trades", ...symbols)
  }

  subscribeToTradingActivity(...symbols: string[]) {
    this.subscribeToFills(...symbols)
    this.subscribeToOrders(...symbols)
    this.subscribeToPositions(...symbols)
    this.subscribeToMargins()
  }

  close() {
    this.websocket.close()
  }

  onMessage(handler: (message: any) => void) {
    this.websocket.on("message", handler)
  }

  sendMessage(message: any) {
    if (typeof message === "string")
      this.websocket.send(message)
    else
      this.websocket.send(JSON.stringify(message))
  }
}

export default DeltaExchangeSocket
