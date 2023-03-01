import crypto from "crypto";
import DeltaExchangeSocket from "./DeltaExchangeSocket";
import {
  Balance,
  Candle,
  LeverageChangeResult,
  Option,
  OptionChain,
  OptionChains,
  Order,
  OrderResult,
  Position,
  Query,
  Ticker
} from "./types";
import {Resolution, StopOrderType} from "./DeltaExchangeConstants";
import * as fs from "fs";
import * as path from "path";

export class DeltaExchangeClient {
  private readonly api_key: string;
  private readonly api_secret: string;
  private readonly base_url: string = "https://api.delta.exchange";
  private readonly authenticated: boolean;
  private lastAllOptionFetchTime: number = 0;
  private lastFetchedAllOptions: Option[] = [];
  private readonly version: string;

  constructor(api_key?: string, api_secret?: string) {
    this.authenticated = !!(api_key && api_secret);
    this.api_key = api_key || "";
    this.api_secret = api_secret || "";
    this.version = this.getVersion();
  }

  //! static methods
  static signMessage(secret: string, message: string): string {
    return crypto.createHmac("sha256", secret)
      .update(Buffer.from(message, 'utf-8')).digest("hex");
  }

  static quoteChar(c: string) {
    return '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
  }

  static quote(s: string) {
    return encodeURIComponent(s).replace(/[()*!']/g, this.quoteChar).replace(/%2F/g, '/')
  }

  static quotePlus(s: string) {
    return this.quote(s).replace(/%20/g, '+')
  }

  static buildQuery(queries: Query[]): string {
    if (!queries?.length)
      return ''
    return '?' + queries.map(q => `${q.key}=${this.quotePlus(q.value)}`).join('&')
  }

  static getTimeStamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined)
      }, ms)
    })
  }

  static resolutionToMinute = (resolution: string) => {
    switch (resolution) {
      case Resolution._1m:
        return 1
      case Resolution._5m:
        return 5
      case Resolution._15m:
        return 15
      case Resolution._30m:
        return 30
      case Resolution._1h:
        return 60
      case Resolution._2h:
        return 120
      case Resolution._4h:
        return 240
      case Resolution._1d:
        return 1440
      case Resolution._1w:
        return 10080
      case Resolution._2w:
        return 21600
      case Resolution._30d:
        return 43200
      default:
        return -1
    }
  }

  getVersion() {
    if (this.version) {
      return this.version
    }
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
      return packageJson.version || "v0.0.0"
    } catch (e) {
      return "v0.0.0"
    }
  }

  isAuthenticated() {
    return this.authenticated;
  }

  async request(path: string, method: string = "GET", payload?: any, queries?: Query[], auth: boolean = false, base_url?: string, headers: any = {}) {
    if (!base_url) {
      base_url = this.base_url;
    }
    const url = base_url + path + DeltaExchangeClient.buildQuery(queries || [])
    headers['Content-Type'] = 'application/json'
    headers['Accept'] = 'application/json'

    if (auth) {
      if (!this.api_key || !this.api_secret) {
        throw new Error('Authentication required!')
      }
      const timestamp = DeltaExchangeClient.getTimeStamp();
      const signature_data = method + timestamp + path + DeltaExchangeClient.buildQuery(queries || []) + (payload ? JSON.stringify(payload) : "")
      const signature = DeltaExchangeClient.signMessage(this.api_secret, signature_data)
      headers['api-key'] = this.api_key
      headers['timestamp'] = timestamp
      headers['signature'] = signature
    }

    headers['User-Agent'] = 'delta-exchange-rest-client-' + this.version

    headers = {
      ...headers
    }

    const data = await fetch(url, {
      method: method,
      headers: headers,
      body: method === "GET" ? undefined : payload ? JSON.stringify(payload) : undefined
    }).then(res => res.text())
    return JSON.parse(data)
  }

  //! access account status and data
  async getAssets() {
    return await this.request('/assets')
  }

  async getBalances(asset_id?: number): Promise<Balance> {
    const balances = await this.request("/v2/wallet/balances", "GET", undefined, undefined, true)
    if (asset_id) {
      // filter by asset_id and return only one balance
      for (const asset of balances.result) {
        if (asset.asset_id === asset_id) {
          return asset
        }
      }
    }
    const balancesObj: Balance = {}
    try {
      for (const asset of balances.result) {
        balancesObj[asset.asset_symbol] = asset
      }
    } catch (e) {
    }
    return balancesObj;
  }

  async setLeverage(product_id: string, leverage: number): Promise<LeverageChangeResult> {
    return this.request(`/v2/products/${product_id}/orders/leverage`, "POST", {
      leverage: leverage
    }, undefined, true)
  }

  async getOrderHistory(queries: Query[] = [], page_size = 10, after: any = undefined) {
    if (after)
      queries = [...queries, {key: 'after', value: after}];
    if (page_size)
      queries.push({key: 'page_size', value: String(page_size)});
    return await this.request('/v2/orders/history', 'GET', undefined, queries)
  }

  async getFillHistory(queries: Query[] = [], page_size = 10, after: any = undefined) {
    if (after)
      queries = [...queries, {key: 'after', value: after}];
    if (page_size)
      queries.push({key: 'page_size', value: String(page_size)});
    return await this.request('/v2/fills', 'GET', undefined, queries)
  }

  async changePositionMargin(product_id: string, delta_margin: number) {
    return await this.request('/v2/positions/change_margin', 'POST', {
      product_id: product_id,
      delta_margin: delta_margin
    }, undefined, true)
  }

  async getPositions(product_ids: string[]): Promise<Position[]> {
    return (await this.request('/v2/positions/margined', 'GET', undefined, [{
      key: 'product_id',
      value: product_ids.join(",")
    }], true))?.result
  }

  //! get contract details
  async getOptions(symbol?: string, expiry?: string, turnover_symbol?: string): Promise<Option[]> {
    if (!symbol)
      if (this.lastAllOptionFetchTime + 1000 * 30 > Date.now())
        if (this.lastFetchedAllOptions.length > 0)
          return this.lastFetchedAllOptions

    const allCallOptions = await this.request(`/v2/tickers?contract_types=call_options`)
    const allPutOptions = await this.request(`/v2/tickers?contract_types=put_options`)
    const allOptions = [...allCallOptions.result, ...allPutOptions.result]
    const requiredOptions: Option[] = []
    for (const option of allOptions) {
      const optionBreakdown: string[] = option?.symbol?.split('-')
      if (!optionBreakdown || optionBreakdown.length < 1)
        continue

      if (symbol && optionBreakdown[1] !== symbol)
        continue

      if (expiry && optionBreakdown[3] !== expiry)
        continue;

      if (turnover_symbol && turnover_symbol !== option.turnover_symbol)
        continue

      requiredOptions.push({
        id: Number(option.product_id) || option.product_id,
        close: Number(option.close) || option.close,
        open: Number(option.open) || option.open,
        symbol: option.symbol,
        expiry: optionBreakdown[3],
        best_ask: Number(option.quotes?.best_ask) || option.quotes?.best_ask,
        best_bid: Number(option.quotes?.best_bid) || option.quotes?.best_bid,
        ask_size: Number(option.quotes?.ask_size) || option.quotes?.ask_size,
        bid_size: Number(option.quotes?.bid_size) || option.quotes?.bid_size,
        high: Number(option.high) || option.high,
        low: Number(option.low) || option.low,
        mark_price: Number(option.mark_price) || option.mark_price,
        price_max: Number(option.price_band?.upper_limit) || option.price_band?.upper_limit,
        price_min: Number(option.price_band?.lower_limit) || option.price_band?.lower_limit,
        spot_price: Number(option.spot_price) || option.spot_price,
        strike_price: option.strike_price,
        timestamp: option.timestamp,
        type: optionBreakdown[0] === "C" ? "call" : "put",
        volume: Number(option.volume) || option.volume,
        underlying: optionBreakdown[1],
        trunover: option.turnover_symbol,
        // candles: option.candles,
      })
    }
    return requiredOptions
  }

  async getOptionChain(symbol: string, expiry: string, turnover_symbol?: string): Promise<OptionChain | undefined> {
    const optionChains: OptionChains = await this.getOptionChains(symbol, turnover_symbol)
    return optionChains[expiry];
  }

  async getOptionChains(symbol: string, turnover_symbol?: string): Promise<OptionChains> {
    const options = await this.getOptions(symbol, undefined, turnover_symbol)
    const optionChains: OptionChains = {}
    for (const option of options) {
      const expiry = option.expiry;
      if (!optionChains[expiry])
        optionChains[expiry] = {}
      const optionStrike: number = option.strike_price
      if (!optionChains[expiry][optionStrike])
        optionChains[expiry][optionStrike] = {
          call: null,
          put: null
        }
      if (option.type === "put")
        optionChains[expiry][optionStrike].put = option
      else if (option.type === "call")
        optionChains[expiry][optionStrike].call = option
      else
        console.log("unknown option type:", option.type)
    }
    // console.log(optionChains)
    return optionChains
  }

  async getTickerDetails(symbol: string): Promise<Ticker> {
    return (await this.request(`/v2/tickers/${symbol}`)).result
  }

  async getActiveOrders(page_size?: number): Promise<Order[]> {
    return (await this.request(`/v2/orders`, 'GET', undefined, [{
      key: 'page_size',
      value: page_size ? String(page_size) : "100"
    }], true))?.result
  }

  async getAllPositions(): Promise<Position[]> {
    return (await this.request('/v2/positions/margined', 'GET', undefined, undefined, true))?.result || []
  }

  async getOrderbook(symbol: string) {
    return await this.request(`/v2/l2orderbook/${symbol}`)
  }

  async getSparklines(symbol: string) {
    return await this.request(`/v2/sparklines`, 'GET', undefined, [{key: 'symbol', value: symbol}])
  }

  async getOHLC(symbol: string, resolution: string, start: number, end: number): Promise<Candle[]> {
    return (await this.request(`/v2/history/candles`, 'GET', undefined, [
      {key: 'symbol', value: symbol},
      {key: 'resolution', value: resolution},
      {key: 'start', value: `${Math.floor(start / 1000)}`},
      {key: 'end', value: `${Math.floor(end / 1000)}`}
    ]))?.result
  }

  async getMarkOHLC(symbol: string, resolution: string, start: number, end: number) {
    return this.getOHLC(`MARK:${symbol}`, resolution, start, end)
  }

  //! create trades
  async createOrder(
    // required
    product_id: number, side: string, size: number, order_type: string, limit_price?: number,
    // bracket order
    bracket_order?: boolean, bracket_stop_loss_trigger_price?: number, bracket_stop_loss_limit_price?: number,
    bracket_take_profit_trigger_price?: number, bracket_take_profit_limit_price?: number, bracket_trail_amount?: number,
    // stop/limit order
    stop_order_type?: string, stop_price?: number, stop_trigger_method?: string, trail_amount?: number,
    // other details
    close_on_trigger?: boolean, client_order_id?: string, time_in_force?: string,
    reduce_only?: boolean, post_only?: boolean,
  ): Promise<OrderResult> {
    return await this.request('/v2/orders', 'POST', {
      bracket_order,
      bracket_stop_loss_limit_price,
      bracket_stop_loss_price: bracket_stop_loss_trigger_price,
      bracket_take_profit_limit_price,
      bracket_take_profit_price: bracket_take_profit_trigger_price,
      bracket_trail_amount: side === "buy" && bracket_trail_amount ? -bracket_trail_amount : bracket_trail_amount,
      client_order_id,
      close_on_trigger,
      limit_price,
      order_type,
      product_id,
      reduce_only,
      side,
      size,
      stop_order_type,
      stop_price,
      stop_trigger_method,
      time_in_force,
      trail_amount: side === "buy" && trail_amount ? -trail_amount : trail_amount,
      post_only,
    }, undefined, true)
  }

  async createBracketOrder(
    // required
    product_id: number, side: string, size: number, order_type: string, limit_price?: number,
    // bracket order
    bracket_order?: boolean, bracket_stop_loss_limit_price?: number, bracket_stop_loss_price?: number,
    bracket_take_profit_limit_price?: number, bracket_take_profit_price?: number, bracket_trail_amount?: number,
    stop_trigger_method?: string,
    // other details
    close_on_trigger?: boolean, client_order_id?: string, time_in_force?: string,
    reduce_only?: boolean, post_only?: boolean,
  ) {
    return await this.createOrder(
      // required
      product_id, side, size, order_type, limit_price,
      // bracket order
      bracket_order, bracket_stop_loss_limit_price, bracket_stop_loss_price,
      bracket_take_profit_limit_price, bracket_take_profit_price, bracket_trail_amount,
      // stop/limit order
      undefined, undefined, stop_trigger_method, undefined,
      // other details
      close_on_trigger, client_order_id, time_in_force,
      reduce_only, post_only,
    )
  }

  async createStopOnlyOrder(
    // required
    product_id: number, side: string, size: number, order_type: string, stop_price: number,
    // stop/limit order
    limit_price?: number, trail_amount?: number, stop_trigger_method?: string,
    // other details
    close_on_trigger?: boolean, post_only?: boolean,
    client_order_id?: string, time_in_force?: string
  ) {
    return await this.createOrder(
      // required
      product_id, side, size, order_type, limit_price,
      // undefined(s)
      undefined, undefined, undefined, undefined, undefined, undefined,
      // stop order
      StopOrderType.STOP_LOSS, stop_price, stop_trigger_method, trail_amount, close_on_trigger,
      client_order_id, time_in_force, true, post_only
    )
  }

  async createLimitOrder(
    // required
    product_id: number, side: string, size: number, order_type: string, limit_price?: number,
    // stop order
    stop_order_type?: string, stop_price?: number, stop_trigger_method?: string, trail_amount?: number,
    // other details
    close_on_trigger?: boolean, client_order_id?: string, time_in_force?: string,
    reduce_only?: boolean, post_only?: boolean,
  ) {
    return await this.createOrder(
      // required
      product_id, side, size, order_type, limit_price,
      // bracket order
      undefined, undefined, undefined, undefined, undefined, undefined,
      // stop/limit order
      stop_order_type, stop_price, stop_trigger_method, trail_amount,
      // other details
      close_on_trigger, client_order_id, time_in_force, reduce_only, post_only,
    )
  }

  //! websockets
  createSocket(): DeltaExchangeSocket {
    return new DeltaExchangeSocket(this.api_key, this.api_secret)
  }
}

export default DeltaExchangeClient;
