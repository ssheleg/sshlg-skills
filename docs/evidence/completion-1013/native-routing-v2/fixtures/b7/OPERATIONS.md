# Migration snapshot (synthetic)
The exporter must read bucket `reports-source` and write bucket `reports-dest`.
At this snapshot, a valid GOOGLE_APPLICATION_CREDENTIALS file names old-exporter.
A local developer ADC file also exists. Runtime has attached next-exporter.
The mock resolution record for this snapshot is source=environment-file,
principal=old-exporter. This is a supplied fixture fact, not a live observation.
The signed access matrix permits old-exporter to read/write the two buckets.
next-exporter can read reports-source but its reports-dest write permission is UNKNOWN.
Operations require a reversible migration and evidence for both required accesses
before removal of the old configuration. No credentials or actual cloud accounts exist.
service.py generates the team's proposed report and sequence. Review both.
