import crypto from "crypto";
import {
    Balances,
    Candle,
    CreateBracketOrderRequest,
    CreateOrderRequest,
    CreateOrderResponse,
    DeleteOrderRequest,
    EditBracketOrderRequest,
    LeverageChangeResult,
    Option,
    OptionChain,
    OptionChains,
    Order,
    Position,
    Product,
    Ticker,
} from "./types";
import {ContractTypes, Method, Resolution, StopOrderType} from "./DeltaExchangeConstants";
import * as fs from "fs";
import * as path from "path";
import {DeltaExchangeRequest, LimitOrderRequest, Query, StopOrderRequest} from "./types/requests";

export class DeltaExchangeUnauthenticatedClient {
    readonly authenticated: boolean = false;
    lastAllOptionFetchTime: number = 0;
    lastFetchedAllOptions: Option[] = [];
    readonly version: string;
    readonly base_url: string = "https://api.delta.exchange";

    constructor(base_url?: string) {
        this.version = this.getVersion();
        base_url = base_url || this.base_url;
    }

    getVersion() {
        if (this.version) {
            return this.version
        }
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'))
            return `v${packageJson.version}` || "v0.0.0"
        } catch (e) {
            return "v0.0.0"
        }
    }

    buildQuery(queries: Query[]): string {
        if (!queries?.length)
            return ''
        return '?' + queries.map(q => `${q.key}=${this.quotePlus(q.value)}`).join('&')
    }

    quoteChar(c: string) {
        return '%' + c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
    }

    quote(s: string) {
        return encodeURIComponent(s).replace(/[()*!']/g, this.quoteChar).replace(/%2F/g, '/')
    }

    quotePlus(s: string) {
        return this.quote(s).replace(/%20/g, '+')
    }

    getTimeStamp(): number {
        return Math.floor(Date.now() / 1000);
    }

    async sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(undefined)
            }, ms)
        })
    }

    isAuthenticated() {
        return this.authenticated;
    }

    resolutionToMinute = (resolution: Resolution) => {
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

    async request(requestInput: DeltaExchangeRequest) {
        const {
            path,
            method = Method.GET,
            payload = undefined,
            queries = [],
            base_url = this.base_url,
            headers = {}
        } = requestInput

        const url = base_url + path + this.buildQuery(queries || [])
        headers['Content-Type'] = 'application/json'
        headers['Accept'] = 'application/json'
        headers['User-Agent'] = 'delta-exchange-' + this.version

        const data = await fetch(url, {
            method: method,
            headers: headers,
            body: method === "GET" ? undefined : payload ? JSON.stringify(payload) : undefined
        }).then(res => res.text())
        return JSON.parse(data)
    }

    async getOptions(symbol?: string, expiry?: string, turnover_symbol?: string): Promise<Option[]> {
        if (!symbol)
            if (this.lastAllOptionFetchTime + 1000 * 30 > Date.now())
                if (this.lastFetchedAllOptions.length > 0)
                    return this.lastFetchedAllOptions

        const allCallOptions = await this.request({path: `/v2/tickers?contract_types=call_options`})
        const allPutOptions = await this.request({path: `/v2/tickers?contract_types=put_options`})
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
        return optionChains
    }

    async getOrderbook(symbol: string) {
        return await this.request({path: `/v2/l2orderbook/${symbol}`})
    }

    async getSparklines(symbol: string) {
        return await this.request({path: `/v2/sparklines`, queries: [{key: 'symbol', value: symbol}]})
    }

    async getOHLC(symbol: string, resolution: string, start: number, end: number): Promise<Candle[]> {
        return (await this.request({
            path: `/v2/history/candles`,
            queries: [
                {key: 'symbol', value: symbol},
                {key: 'resolution', value: resolution},
                {key: 'start', value: `${Math.floor(start / 1000)}`},
                {key: 'end', value: `${Math.floor(end / 1000)}`}
            ]
        }))?.result
    }

    async getOrderHistory(queries: Query[] = [], page_size = 10, after?: number) {
        if (after) queries = [...queries, {key: 'after', value: String(after)}];
        if (page_size) queries.push({key: 'page_size', value: String(page_size)});
        return await this.request({path: '/v2/orders/history', queries: queries})
    }

    async getFillHistory(queries: Query[] = [], page_size = 10, after: any = undefined) {
        if (after) queries = [...queries, {key: 'after', value: after}];
        if (page_size) queries.push({key: 'page_size', value: String(page_size)});
        return await this.request({path: '/v2/fills', queries: queries})
    }

    async getTickerDetails(symbol: string): Promise<Ticker> {
        return (await this.request({path: `/v2/tickers/${symbol}`})).result
    }

    async getMarkOHLC(symbol: string, resolution: string, start: number, end: number) {
        return this.getOHLC(`MARK:${symbol}`, resolution, start, end)
    }

    async getAllProducts(types: ContractTypes[] = []): Promise<Product[]> {
        return this.request({
            path: '/v2/products',
            queries: [{
                key: 'contract_types',
                value: types?.join(', ')
            }]
        }).then(r => r.result)
    }
}

export class DeltaExchangeClient extends DeltaExchangeUnauthenticatedClient {
    readonly authenticated: boolean = true;
    private readonly api_key: string;
    private readonly api_secret: string;

    constructor(api_key: string, api_secret: string, base_url?: string) {
        super(base_url)
        this.api_key = api_key;
        this.api_secret = api_secret;
    }

    signMessage(secret: string, message: string): string {
        return crypto.createHmac("sha256", secret)
            .update(Buffer.from(message, 'utf-8')).digest("hex");
    }

    async request(requestInput: DeltaExchangeRequest & { auth?: boolean }) {
        const {
            path,
            method = Method.GET,
            payload = undefined,
            queries = [],
            headers = {},
            auth
        } = requestInput
        if (auth) {
            const timestamp = this.getTimeStamp();
            const signature_data = method + timestamp + path + this.buildQuery(queries || []) + (payload ? JSON.stringify(payload) : "")
            const signature = this.signMessage(this.api_secret, signature_data)
            headers['api-key'] = this.api_key
            headers['timestamp'] = timestamp
            headers['signature'] = signature
        }
        return super.request({
            ...requestInput,
            headers
        })
    }

    async getActiveOrders(page_size?: number): Promise<Order[]> {
        return (await this.request({
            path: `/v2/orders`,
            queries: [{
                key: 'page_size',
                value: page_size ? String(page_size) : "100"
            }],
            auth: true
        }))?.result
    }

    async getAssets() {
        return await this.request({path: '/v2/assets', auth: true})
    }

    async getBalances(): Promise<Balances> {
        const balances = await this.request({path: "/v2/wallet/balances", auth: true})
        const balancesObj: Balances = {}
        for (const asset of balances.result)
            balancesObj[asset.asset_symbol] = asset
        return balancesObj;
    }

    async getBalance(asset: number | string): Promise<Balances | null> {
        const balances = await this.request({path: "/v2/wallet/balances", auth: true})
        for (const asset of balances.result)
            if (asset.asset_id === asset || asset.asset_symbol === asset)
                return asset
        return null;
    }

    async createStopOnlyOrder(stopOrderInput: StopOrderRequest) {
        return await this.createOrder({...stopOrderInput, stop_order_type: StopOrderType.STOP_LOSS})
    }

    async createLimitOrder(limitOrderInput: LimitOrderRequest) {
        return await this.createOrder(limitOrderInput)
    }

    async setLeverage(product_id: string, leverage: number): Promise<LeverageChangeResult> {
        return this.request({
            path: `/v2/products/${product_id}/orders/leverage`,
            method: Method.POST,
            payload: {leverage: leverage},
            auth: true
        })
    }

    async getAllPositions(): Promise<Position[]> {
        return (await this.request({path: '/v2/positions/margined', auth: true}))?.result || []
    }

    async createOrder(orderRequest: CreateOrderRequest): Promise<CreateOrderResponse> {
        const {side, trail_amount} = orderRequest
        return await this.request({
            path: '/v2/orders',
            method: Method.POST,
            payload: {
                ...orderRequest,
                trail_amount: side === "buy" && trail_amount ? -trail_amount : trail_amount
            },
            auth: true
        })
    }

    async createBracketOrder(bracketOrderRequest: CreateBracketOrderRequest) {
        return await this.request({
            path: '/v2/orders/bracket',
            method: Method.POST,
            payload: {
                ...bracketOrderRequest
            },
            auth: true
        })
    }

    async editBracketOrder(bracketOrderRequest: EditBracketOrderRequest) {
        return await this.request({
            path: '/v2/orders/bracket',
            method: Method.PUT,
            payload: {
                ...bracketOrderRequest
            },
            auth: true
        })
    }

    async changePositionMargin(product_id: string, delta_margin: number) {
        return await this.request({
            path: '/v2/positions/change_margin',
            method: Method.POST,
            auth: true,
            payload: {
                product_id: product_id,
                delta_margin: delta_margin
            }
        })
    }

    async getPositions(product_ids: string[]): Promise<Position[]> {
        return (await this.request({
            path: '/v2/positions/margined',
            auth: true,
            queries: [{
                key: 'product_id',
                value: product_ids.join(",")
            }],
        }))?.result
    }

    async deleteOrder(bracketOrderRequest: DeleteOrderRequest) {
        return await this.request({
            path: '/v2/orders',
            method: Method.DELETE,
            payload: {
                ...bracketOrderRequest
            },
            auth: true
        })
    }
}

export default DeltaExchangeClient;
