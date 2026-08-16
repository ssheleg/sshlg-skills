#!/usr/bin/env python3
"""Fixtures for test/board_age.py — the age term that was a constant for eleven days.

Three things here could go wrong quietly, and each is asserted on its own:

- **stamps vs days.** Counting raw stamps lets one busy afternoon outrank a row ignored
  for a week; the loop that found this defect stamped thirteen times in a day.
- **unknown vs zero.** A row whose `Source` names no date must read as unknown. Zero means
  *filed today*, and in the one column that decides rank the two must never collapse.
- **prose in the table.** A date inside an entry's narrative is not a run stamp. Counting
  one inflates every row at once, which looks like the board finally working.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import board_age  # noqa: E402

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


RETRO = """# Retro

| Date | Task | Commit | Diverged? |
|---|---|---|---|
| 2026-08-05 | a | `aaa1111` | no |
| 2026-08-06 | b | `bbb2222` | yes |
| 2026-08-16 | c | `ccc3333` | yes |
| 2026-08-16 (second) | d | `ddd4444` | yes |
| 2026-08-16 (third) | e | `eee5555` | no |

## 2026-08-11 — an entry whose heading carries a date

Prose mentioning 2026-08-09 in a sentence, which is not a run.
"""


def only_the_stamp_table_counts():
    days = board_age.stamp_days(RETRO)
    assert days == ["2026-08-05", "2026-08-06", "2026-08-16"], days
    assert "2026-08-11" not in days, "an entry heading is not a stamp row"
    assert "2026-08-09" not in days, "a date in prose is not a run"


def three_stamps_in_one_day_are_one_day():
    days = board_age.stamp_days(RETRO)
    assert days.count("2026-08-16") == 1, days
    assert board_age.age_days("filed 2026-08-06", days) == 1, \
        "three stamps on one day must age a row by one, not three"


def a_row_filed_before_everything_ages_by_every_later_day():
    days = board_age.stamp_days(RETRO)
    assert board_age.age_days("C-04 (2026-08-04)", days) == 3


def a_row_filed_today_is_zero_not_unknown():
    days = board_age.stamp_days(RETRO)
    assert board_age.age_days("2026-08-16 run, stage 10", days) == 0


def a_source_with_no_date_is_unknown_never_zero():
    days = board_age.stamp_days(RETRO)
    got = board_age.age_days("the 2026 audit", days)
    assert got is None, f"a dateless source must read unknown, got {got!r}"
    assert board_age.age_days("", days) is None
    assert board_age.age_days(None, days) is None


def the_formula_is_the_board_s_own():
    assert board_age.priority(1, 7, 3) == 2.67
    assert board_age.priority(2, 0, 3) == 0.67
    assert board_age.priority(1, 1, 1) == 2.0
    assert board_age.priority(2, 0, 2) == 1.0


def the_age_term_actually_moves_the_rank():
    """The defect, stated as a test: with age pinned at 0 these four tie at ~1."""
    pinned = {board_age.priority(b, 0, e) for b, e in ((1, 3), (1, 3), (2, 3), (1, 1))}
    real = {board_age.priority(b, a, e) for b, a, e in ((1, 7, 3), (1, 7, 3), (2, 3, 3), (1, 1, 1))}
    assert len(real) > len(pinned) or max(real) > max(pinned), \
        f"the age term must change the ranking; pinned={sorted(pinned)} real={sorted(real)}"
    assert max(real) > 2 * max(pinned) - 1, f"real={sorted(real)} pinned={sorted(pinned)}"


def bad_inputs_raise_rather_than_returning_a_number():
    for args in ((1, 0, 0), (-1, 0, 1), ("2", 0, 1), (1, None, 1)):
        try:
            board_age.priority(*args)
        except ValueError:
            continue
        raise AssertionError(f"{args} produced a number instead of refusing")


def the_printed_form_matches_what_the_board_carries():
    assert board_age.fmt(2.0) == "2.0"
    assert board_age.fmt(0.67) == "0.67"
    assert board_age.fmt(2.67) == "2.67"
    assert board_age.fmt(1.5) == "1.5"


for n, f in [
    ("only the stamp table counts, not prose", only_the_stamp_table_counts),
    ("three stamps in one day age a row by one", three_stamps_in_one_day_are_one_day),
    ("an old row ages by every later stamp-day", a_row_filed_before_everything_ages_by_every_later_day),
    ("a row filed today is zero", a_row_filed_today_is_zero_not_unknown),
    ("a dateless source is unknown, never zero", a_source_with_no_date_is_unknown_never_zero),
    ("the formula is the board's own", the_formula_is_the_board_s_own),
    ("the age term actually moves the rank", the_age_term_actually_moves_the_rank),
    ("bad inputs refuse rather than compute", bad_inputs_raise_rather_than_returning_a_number),
    ("the printed form matches the board", the_printed_form_matches_what_the_board_carries),
]:
    case(n, f)

if failures:
    print(f"\nFAIL: {len(failures)} of 9")
    sys.exit(1)
print("\nPASS: board_age — 9 cases")
