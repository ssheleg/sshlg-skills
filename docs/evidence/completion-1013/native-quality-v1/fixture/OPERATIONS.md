# Server identity migration

This synthetic Python backend calls Google APIs as one server identity. It has
no end-user Google login flow. The deployment runs on Cloud Run with the intended
runtime service account attached. A valid legacy service-account credential file
is also mounted at the path named by deployment.env.example. Its contents are
intentionally absent from this audit fixture: no real credentials are needed.

The desired migration is to the attached identity without a long-lived JSON key.
The current runbook says ADC chooses the attached identity first, then the
environment credential file, then the local developer ADC file. Startup logs are
used as proof that the migration succeeded.

Audit the code and deployment contract statically. Do not execute it, install
packages, access credentials, call Google, or claim a live principal was measured.
The shared Request instance and absence of browser sign-in are intentional.
