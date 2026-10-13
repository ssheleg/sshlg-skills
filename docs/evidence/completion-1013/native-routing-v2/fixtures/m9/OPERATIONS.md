# Conversion snapshot (synthetic)
Browser emitter is called on every return-page visit, including refresh and canceled checkout.
Server emitter is called only for a verified successful charge, and can be retried.
The analytics adapter deduplicates on the PAIR (event_name, event_id), not id alone.
Order o_41 has successful charge ch_9, total 19.00, currency EUR.
Order o_42 was canceled and has no successful charge.
For this project Meta browser events require marketing consent=true. A denied
user must not produce a browser Meta event. This is a product constraint, not legal advice.
Server events follow a separately approved server consent policy outside this fixture;
do not invent its status or disable all browser attribution to solve duplication.
Review the event mapping, payment-state dependency, repeated deliveries and consent.
