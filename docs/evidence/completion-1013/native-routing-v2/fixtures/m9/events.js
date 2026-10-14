// Synthetic emitters. No network or vendor SDK.
export function browser(order, consent) {
  return {event_name: "Purchase", event_id: crypto.randomUUID(), value: order.total};
}
export function server(paid) {
  return {event_name: "Subscribe", event_id: paid.charge_id, value: paid.total};
}
