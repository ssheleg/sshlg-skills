#!/usr/bin/env python3
"""`scripts/queue.py` orders the family's work and had no test of its own (B-107).

A tool that decides what gets done next deserves the same negative control as a gate:
both defects it was written to fix are planted here, so a rewrite that reintroduces
either fails rather than quietly reordering ten iterations of a loop.
"""
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import queue as q  # noqa: E402


def scan_text(text):
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as fh:
        fh.write(text)
        path = fh.name
    try:
        return q.scan("fixture", path)
    finally:
        os.unlink(path)


HEADER = "| id | What | P | Status |\n|---|---|---|---|\n"


class TestStatusComesFromTheColumn(unittest.TestCase):
    def test_a_body_that_says_closed_is_not_a_closed_row(self):
        # The defect: `sheleg-design B-047` was open and its BODY explained that "the
        # elevation half closed 2026-08-20", so the queue never showed it.
        rows = scan_text(HEADER + "| B-047 | the elevation half closed 2026-08-20 | 3 | open |\n")
        self.assertEqual([r["id"] for r in rows], ["B-047"])

    def test_the_status_column_still_closes_a_row(self):
        rows = scan_text(HEADER + "| B-048 | anything at all | 3 | closed 2026-08-20 |\n")
        self.assertEqual(rows, [])

    def test_a_bold_open_status_is_open(self):
        # This file's own status fields are bold, and the obvious parser reads `open`
        # as absent when it is wrapped in asterisks — the defect B-77 recorded.
        rows = scan_text(HEADER + "| B-049 | x | 2 | **open** — waiting |\n")
        self.assertEqual([r["id"] for r in rows], ["B-049"])


class TestClosedSectionDoesNotLatch(unittest.TestCase):
    def test_a_table_after_a_later_heading_is_read_again(self):
        # The defect: `in_closed` latched from a `## Closed` heading and stayed on for
        # every table below it, switching off boards that had nothing to do with it.
        text = ("## Closed\n\n" + HEADER
                + "| B-050 | done | 1 | closed |\n\n"
                + "## Open work\n\n" + HEADER
                + "| B-051 | live | 4 | open |\n")
        rows = scan_text(text)
        self.assertEqual([r["id"] for r in rows], ["B-051"])

    def test_rows_inside_the_closed_section_stay_closed(self):
        text = "## Closed\n\n" + HEADER + "| B-052 | done | 1 | open |\n"
        self.assertEqual(scan_text(text), [])


class TestShape(unittest.TestCase):
    def test_a_table_that_never_named_its_columns_is_not_a_board(self):
        self.assertEqual(scan_text("| B-053 | x | 1 | open |\n"), [])

    def test_priority_is_read_as_a_number_and_verbally(self):
        rows = scan_text(HEADER + "| B-054 | x | **4.0** | open |\n| B-055 | y | high | open |\n")
        by = {r["id"]: r for r in rows}
        self.assertEqual(by["B-054"]["num"], 4.0)
        self.assertIsNotNone(by["B-055"]["rank"])

    def test_an_absent_board_is_empty_rather_than_an_error(self):
        self.assertEqual(q.scan("fixture", os.path.join(ROOT, "no-such-board.md")), [])


if __name__ == "__main__":
    unittest.main(verbosity=1)
