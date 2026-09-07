"""Negative tests for portable packet integrity; no source or remote mutation."""
import copy
import unittest
import handoff


class PacketChecks(unittest.TestCase):
    def setUp(self):
        self.plan = handoff.read(handoff.B / 'external-v3/plan.json')

    def test_current_packets(self):
        self.assertEqual([], handoff.validate(self.plan))

    def test_duplicate(self):
        self.plan['leaves'].append(copy.deepcopy(self.plan['leaves'][0]))
        self.assertIn('duplicate leaf', handoff.validate(self.plan))

    def test_cycle(self):
        leaf = self.plan['leaves'][0]
        leaf['depends_on'].append({'task_id': leaf['id'], 'kind': 'control', 'reason': 'negative fixture'})
        self.assertTrue(any('cycle at' in e for e in handoff.validate(self.plan)))

    def test_changed_digest(self):
        self.plan['leaves'][0]['primary_context']['sha256'] = '0' * 64
        self.assertTrue(any('primary digest' in e for e in handoff.validate(self.plan)))

    def test_oversize(self):
        self.plan['leaves'][0]['primary_context']['budget_bytes'] = 1
        self.assertTrue(any('primary budget' in e for e in handoff.validate(self.plan)))

    def test_path_escape(self):
        with self.assertRaises(ValueError):
            handoff.resolve('audit://../../escape', {})

    def test_unmapped_checkout(self):
        self.assertIsNone(handoff.resolve('repo://task-pipeline/README.md', {}))


if __name__ == '__main__':
    unittest.main()
