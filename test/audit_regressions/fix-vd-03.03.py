#!/usr/bin/env python3
"""FIX-VD-03.03 — host/platform tool selection (sherlock audit, VD-03).

The finding: the pack resolver considered only the web default — a native
request had no way to select a matching candidate, and there was nothing to
stop the React Native (or a web) skill being read as native readiness for an
iOS/Android brief.

The fix under test, against lib/packs.js through node: selectForPlatform picks
the candidates that actually serve the requested platform; a native-iOS or
native-Android request with no matching candidate returns native_unsupported
with a note, never the RN/web default presented as native cover.

Standard library only.
"""
import json
import os
import subprocess
import sys

sys.dont_write_bytecode = True

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

failures = []


def case(name, fn):
    try:
        fn()
        print(f"  ok  {name}")
    except AssertionError as e:
        failures.append(f"{name}: {e}")
        print(f"FAIL  {name}: {e}")


def node(body):
    r = subprocess.run(["node", "-e", "const p=require(process.argv[1]);" + body,
                        os.path.join(ROOT, "lib", "packs.js")],
                       capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr[:400]
    return json.loads(r.stdout)


def t_web_selects_web_candidates():
    v = node("console.log(JSON.stringify(p.selectForPlatform(p.PACKS.design, 'web')));")
    assert v["native_unsupported"] is False and v["matches"], \
        "the web platform selected no candidates"
    assert all(m["lane"] != "mobile" for m in v["matches"]), \
        "a mobile (RN) candidate was offered for a web request"


def t_react_native_selects_the_rn_candidate():
    v = node("console.log(JSON.stringify(p.selectForPlatform(p.PACKS.design, 'react-native')));")
    ids = [m["id"] for m in v["matches"]]
    assert ids == ["vercel-react-native-skills"], \
        f"react-native did not select the RN candidate: {ids}"
    assert v["native_unsupported"] is False


def t_ios_native_is_unsupported_not_faked():
    v = node("console.log(JSON.stringify(p.selectForPlatform(p.PACKS.design, 'ios-native')));")
    assert v["native_unsupported"] is True and v["matches"] == [], \
        "a native-iOS request was handed a candidate — the finding itself"
    assert "native iOS/Android" in v["note"] and "Do NOT" in v["note"] and "RN" in v["note"], \
        "the unsupported note does not warn against faking native readiness"


def t_android_native_is_also_unsupported():
    v = node("console.log(JSON.stringify(p.selectForPlatform(p.PACKS.design, 'android-native')));")
    assert v["native_unsupported"] is True and not v["matches"]


def t_platform_of_derives_from_lane():
    v = node("console.log(JSON.stringify(["
             "p.platformOf({lane:'mobile'}), p.platformOf({lane:'style'}), "
             "p.platformOf({lane:'implement'})]));")
    assert v == ["react-native", "web", "web"], f"platformOf misclassified: {v}"


def main():
    case("a web request selects web candidates only", t_web_selects_web_candidates)
    case("a react-native request selects the RN candidate",
         t_react_native_selects_the_rn_candidate)
    case("a native-iOS request is unsupported, not faked",
         t_ios_native_is_unsupported_not_faked)
    case("a native-Android request is also unsupported",
         t_android_native_is_also_unsupported)
    case("platformOf derives the platform from the lane",
         t_platform_of_derives_from_lane)
    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nall green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
