#!/usr/bin/env python3
"""How old is a board row, and does its priority follow from that?

`docs/evidence/backlog.md` states its own formula — `P = blast × (1 + age_runs) / effort`
— and says the rank is *"recomputed at stage 10 rather than inherited, so a row cannot
keep a rank it earned when it was new."* Nothing recomputed it. Measured 2026-08-16
against the retrospective's stamp table:

| row | `Age` says | stamp-days survived |
|---|---|---|
| B-07 | 2 | 7 |
| B-08 | 2 | 7 |
| B-29 | 0 | 3 |
| B-51 | 0 | 1 |

So the age term — the whole reason the formula has one — was a constant, and the board
ranked newest-first while its header claimed the opposite. A loop worked those four rows
**last** all day.

**`age_runs` counts distinct stamp DAYS, not stamps.** The table holds 38 stamps over 9
days, 13 of them on one afternoon, and raw stamps would let a single busy day outrank a
row ignored for a week. The term exists so a row that keeps being passed over rises; a run
that stamped thirteen times in an afternoon passed a row over once, on one day. This is the
same correction the retro's own prune doctrine already applies to cold triggers, written
down here rather than reapplied by hand.

Pure: `age_days` and `priority` take parsed inputs and return numbers. The caller reads the
files.
"""
import re


def stamp_days(retro_text):
    """Every distinct date the stamp table records, sorted.

    Read from the table's own row shape rather than from prose: a date in an entry's
    narrative is not a run, and counting one would inflate every row at once.
    """
    return sorted({m.group(1) for m in
                   re.finditer(r"^\|\s*(2026-\d\d-\d\d)", retro_text, re.M)})


def age_days(source_cell, days):
    """Distinct stamp-days strictly after the day this row was filed, or None.

    None when the `Source` cell carries no date — which is a real state on older rows and
    must read as *unknown*, never as zero. Zero means *filed today and nothing has closed
    since*, and the two would otherwise be indistinguishable in the one column that decides
    rank.
    """
    m = re.search(r"(2026-\d\d-\d\d)", source_cell or "")
    if not m:
        return None
    return sum(1 for d in days if d > m.group(1))


def priority(blast, age, effort):
    """`blast × (1 + age) / effort`, to two places — the board's own formula.

    Two places because the board already prints `0.67`; rounding to one would silently
    re-rank rows whose difference is in the second digit.
    """
    for name, v in (("blast", blast), ("age", age), ("effort", effort)):
        if not isinstance(v, int) or v < 0:
            raise ValueError(f"{name} must be a non-negative integer, got {v!r}")
    if effort == 0:
        raise ValueError("effort must not be zero — the formula divides by it")
    return round(blast * (1 + age) / effort, 2)


def fmt(p):
    """`2.0` and `0.67` — trailing-zero form matching what the board already carries."""
    s = f"{p:.2f}".rstrip("0").rstrip(".")
    return s if "." in s else s + ".0"
