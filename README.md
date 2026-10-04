# delta-exchange

Node.js connector for the [Delta Exchange](https://www.delta.exchange) REST API, with TypeScript types.

- Public market data: products, tickers, options and option chains, orderbook, candles.
- Authenticated trading: orders, stop orders, bracket orders, positions, balances, leverage and margin.
- Requests are signed for you (HMAC SHA256 of `method + timestamp + path + query + body`).

## Install

```bash
npm install delta-exchange
```

Requires Node.js 18 or newer (uses the global `fetch`).

## Base URL

The client defaults to Delta Exchange Global, `https://api.delta.exchange`. For Delta Exchange India pass its URL:

```ts
const INDIA = "https://api.india.delta.exchange";
```

The two exchanges have separate order books, prices and accounts. Use the one your API key belongs to.

## Quick start

### Public data (no API key)

```ts
import { DeltaExchangeUnauthenticatedClient, ContractTypes } from "delta-exchange";

const client = new DeltaExchangeUnauthenticatedClient("https://api.india.delta.exchange");

const ticker = await client.getTickerDetails("BTCUSD");
const options = await client.getOptions("BTC");                 // all live BTC options
const chain = await client.getOptionChain("BTC", "061026");     // { [strike]: { call, put } } for one expiry (DDMMYY)
const products = await client.getAllProducts([ContractTypes.CALL_OPTIONS, ContractTypes.PUT_OPTIONS]);
```

### Trading (API key and secret)

```ts
import { DeltaExchangeClient, OrderType, Side } from "delta-exchange";

const client = new DeltaExchangeClient(process.env.DELTA_API_KEY!, process.env.DELTA_API_SECRET!, "https://api.india.delta.exchange");

const order = await client.createOrder({
  product_id: 27,
  size: 1,
  side: Side.buy,
  order_type: OrderType.LIMIT,
  limit_price: "59000",
});

if (!order.success) console.error(order.error); // { code: "...", context: {...} }
```

API keys need the **Trading** permission to place orders and **Read Data** for account endpoints.

## Responses and errors

Methods return Delta's JSON response as it is: `{ success: true, result }` or `{ success: false, error: { code } }`. Check `success` (or `result`) before using the result. The error codes are listed in the [API docs](https://docs.delta.exchange/#place-order-errors).

If the server replies with something that is not JSON (gateway errors, HTML pages), the request throws an `Error` with the method, path, HTTP status and the start of the body.

## Orders

### Market and limit orders

```ts
await client.createOrder({ product_id, size: 1, side: Side.sell, order_type: OrderType.MARKET });
await client.createOrder({ product_id, size: 1, side: Side.buy, order_type: OrderType.LIMIT, limit_price: "150" });
```

### Stop loss (reduce only)

A stop order is an order with `stop_order_type` and `stop_price`. Set `reduce_only` so it can only close a position.

```ts
import { OrderType, Side, StopOrderType, StopTriggerMethod } from "delta-exchange";

// closes a short position: buy when the mark price reaches 314
await client.createOrder({
  product_id,
  size: 1,
  side: Side.buy,
  order_type: OrderType.LIMIT,
  limit_price: "700",               // the price the triggered order may pay, up to the product's price band
  stop_order_type: StopOrderType.STOP_LOSS,
  stop_price: "314",
  stop_trigger_method: StopTriggerMethod.MARK_PRICE,
  reduce_only: true,
});
```

**Options:** Delta rejects stop **market** orders on options with the error code `unsupported` (the triggered market order can't be validated against the orderbook). Use a stop **limit** order, as above. The upper limit of an option's price band is in the ticker data (`price_band.upper_limit`, `Option.price_max` from `getOptions`).

### `reduce_only` and `post_only`

The API takes booleans. Both `true` / `false` and the `ReduceOnly` / `PostOnly` enums are accepted; `createOrder` converts the enum values to booleans before sending.

### Bracket orders

Stop loss and take profit for an **open position** (closes the entire position, size is not needed). Only one bracket order is allowed per open position.

```ts
await client.createBracketOrder({
  product_id,
  stop_loss_order: { order_type: OrderType.LIMIT, stop_price: "56000", limit_price: "55000" },
  take_profit_order: { order_type: OrderType.LIMIT, stop_price: "65000", limit_price: "64000" },
  bracket_stop_trigger_method: StopTriggerMethod.MARK_PRICE,
});
```

`stop_trigger_method` is still accepted for compatibility and is sent as `bracket_stop_trigger_method`.

A bracket can also be attached to a new order with the `bracket_*` fields of `createOrder`. Delta refuses that when a position already exists on the product (`bracket_order_position_exists`).

### Cancel

```ts
await client.deleteOrder({ id: orderId, product_id });
```

## API reference

### `DeltaExchangeUnauthenticatedClient(base_url?)`

| Method | Endpoint | Returns |
|---|---|---|
| `getAllProducts(types?)` | `GET /v2/products` | `Product[]` |
| `getTickerDetails(symbol)` | `GET /v2/tickers/{symbol}` | `Ticker` |
| `getOptions(symbol?, expiry?, turnover_symbol?)` | `GET /v2/tickers` | `Option[]` |
| `getOptionChain(symbol, expiry, turnover_symbol?)` | from `getOptions` | `OptionChain` |
| `getOptionChains(symbol, turnover_symbol?)` | from `getOptions` | `OptionChains` keyed by expiry |
| `getOrderbook(symbol)` | `GET /v2/l2orderbook/{symbol}` | response |
| `getOHLC(symbol, resolution, start, end)` | `GET /v2/history/candles` | `Candle[]` |
| `getMarkOHLC(symbol, resolution, start, end)` | mark price candles | `Candle[]` |
| `getSparklines(symbol)` | `GET /v2/sparklines` | response |
| `getOrderHistory(queries?, page_size?, after?)` | `GET /v2/orders/history` | response |
| `getFillHistory(queries?, page_size?, after?)` | `GET /v2/fills` | response |
| `request({ path, method, payload, queries })` | any endpoint | parsed JSON |

`getOptions` reads all call and put tickers and filters them locally. Without a symbol the result is cached for 30 seconds.

### `DeltaExchangeClient(api_key, api_secret, base_url?)`

Everything above, plus:

| Method | Endpoint |
|---|---|
| `createOrder(request)` | `POST /v2/orders` |
| `createLimitOrder(request)` | `POST /v2/orders` |
| `createStopOnlyOrder(request)` | `POST /v2/orders` with `stop_order_type: stop_loss_order` |
| `deleteOrder({ id, product_id })` | `DELETE /v2/orders` |
| `getActiveOrders(page_size?)` | `GET /v2/orders` |
| `createBracketOrder(request)` | `POST /v2/orders/bracket` |
| `editBracketOrder(request)` | `PUT /v2/orders/bracket` |
| `getAllPositions()` | `GET /v2/positions/margined` |
| `getPositions(product_ids)` | `GET /v2/positions/margined?product_ids=` |
| `changePositionMargin(product_id, delta_margin)` | `POST /v2/positions/change_margin` |
| `setLeverage(product_id, leverage)` | `POST /v2/products/{product_id}/orders/leverage` |
| `getBalances()` / `getBalance(asset)` | `GET /v2/wallet/balances` |
| `getAssets()` | `GET /v2/assets` |

Delta notes that `/v2/positions/margined` can take up to 10 seconds to reflect a change.

### Constants

`Side`, `OrderType`, `StopOrderType`, `StopTriggerMethod`, `TimeInForce`, `ReduceOnly`, `PostOnly`, `CloseOnTrigger`, `MMP`, `ContractTypes`, `Resolution`, `Method`.

## Links

- [Delta Exchange API docs](https://docs.delta.exchange/)
- [Repository](https://github.com/dharayan/delta-exchange)

## License

MIT
