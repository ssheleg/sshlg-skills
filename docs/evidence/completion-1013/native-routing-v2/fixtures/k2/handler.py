# Synthetic persistence model; no Stripe SDK or HTTP client.
def deliver(event, db):
    if db.seen(event["id"]):
        return 200
    db.grant(event["invoice_id"], event["units"])
    db.mark_seen(event["id"])
    return 200
