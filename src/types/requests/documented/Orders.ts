import {
  CloseOnTrigger,
  MMP,
  OrderType,
  PostOnly,
  ReduceOnly,
  Side,
  StopOrderType,
  StopTriggerMethod,
  TimeInForce
} from "../../../DeltaExchangeConstants";

interface Test {
  product_id: number,
  side: string,
  size: number,
  order_type: string,
  limit_price?: number,
  // bracket order
  bracket_order?: boolean,
  bracket_stop_loss_trigger_price?: number,
  bracket_stop_loss_limit_price?: number,
  bracket_take_profit_trigger_price?: number,
  bracket_take_profit_limit_price?: number,
  bracket_trail_amount?: number,
  // stop/limit order
  stop_order_type?: string,
  stop_price?: number,
  stop_trigger_method?: string,
  trail_amount?: number,
  // other details
  close_on_trigger?: boolean,
  client_order_id?: string,
  time_in_force?: string,
  reduce_only?: boolean,
  post_only?: boolean,
}

export interface CreateOrderRequest {
  product_id: number
  limit_price?: string
  size?: number
  // side for which to place order
  side?: Side
  order_type?: OrderType
  stop_order_type?: StopOrderType
  stop_price?: string
  trail_amount?: string
  stop_trigger_method?: StopTriggerMethod
  bracket_stop_loss_limit_price?: string
  bracket_stop_loss_price?: string
  bracket_take_profit_limit_price?: string
  bracket_take_profit_price?: string
  time_in_force?: TimeInForce
  mmp?: MMP
  post_only?: PostOnly
  reduce_only?: ReduceOnly
  close_on_trigger?: CloseOnTrigger
  client_order_id?: string
}

export interface EditOrderRequest {
  id?: number
  product_id?: number
  limit_price?: string
  // total size after editing order
  size?: Side
  mmp?: MMP
}

export interface CreateBracketOrderRequest {
  product_id?: number
  stop_loss_order?: {
    order_type?: OrderType
    stop_price?: string
    // Use trail amount if you want a trailing stop order. Required if stop price is empty.
    trail_amount?: string
    // Required if its a limit order
    limit_price?: string
  }
  take_profit_order?: {
    order_type?: OrderType
    stop_price?: string
    // Required if its a limit order
    limit_price?: string
  }
  stop_trigger_method?: StopTriggerMethod
}

export interface EditBracketOrderRequest {
  // Order ID for which bracket params are being updated
  id?: number
  product_id?: number
  bracket_stop_loss_limit_price?: string
  bracket_stop_loss_price?: string
  bracket_take_profit_limit_price?: string
  bracket_take_profit_price?: string
  bracket_trail_amount?: string
}

export interface DeleteOrderRequest {
  id: number
  product_id: number
}
