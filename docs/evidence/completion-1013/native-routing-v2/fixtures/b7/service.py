# Synthetic audit fixture: no SDK or provider is called.
def migration_report(runtime):
    return {"source": "attached", "principal": runtime["attached_principal"]}

def migration_steps():
    return ["remove env credential override", "delete old mount", "deploy", "check access"]
