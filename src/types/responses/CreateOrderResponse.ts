interface meta_dataType {
  cashflow: string
  pnl: string
  source: string
}

interface resultType {
  bracket_trail_amount: any
  meta_data: meta_dataType
  product_id: number
  quote_size: any
  bracket_take_profit_limit_price: any
  limit_price: string
  average_fill_price: string
  bracket_stop_loss_price: any
  order_type: string
  product_symbol: string
  id: number
  paid_commission: string
  bracket_stop_loss_limit_price: any
  stop_trigger_method: string
  unfilled_size: number
  bracket_take_profit_price: any
  side: string
  trail_amount: any
  updated_at: string
  user_id: number
  client_order_id: any
  stop_order_type: any
  reduce_only: boolean
  created_at: string
  state: string
  time_in_force: string
  cancellation_reason: any
  stop_price: any
  close_on_trigger: string
  commission: string
  bracket_order: any
  mmp: string
  size: number
}

export interface CreateOrderResponse {
  result: resultType
  success: boolean
}
