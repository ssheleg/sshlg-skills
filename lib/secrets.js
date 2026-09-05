'use strict';
/**
 * The refusal that stands where a credential would reach the transcript.
 *
 * WHY A GUARD AND NOT A LINE OF DOCTRINE. "Never print a key value" was already
 * written, in the operator's own global instructions, and an agent holding it
 * leaked the same OpenRouter key TWICE in one session on 2026-09-05. Not from
 * ignorance — from a construct that reads as its own opposite:
 *
 *     echo "key: ${OPENROUTER_API_KEY:-not set}"
 *
 * That line was written to check whether a variable was SET. `${VAR:-fallback}`
 * expands to the VALUE when it is, so the check printed exactly what it existed
 * to keep quiet. Prose cannot fix a construct that disguises itself; a guard
 * that reads the command before it runs can.
 *
 * FIVE RULES, EACH THE NEGATIVE OF A REAL LEAK, and each carrying the safe
 * spelling. A refusal without a remedy is an obstacle, and an obstacle gets
 * switched off.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not deny a secret-shaped expansion
 * feeding an HTTP header — `curl -H "Authorization: Bearer $TOKEN"` is the
 * legitimate use and denying it would make the guard useless within a day. It
 * reads what could execute and cannot tell an example from an invocation, so
 * every refusal says so and names the escape.
 */

/** Shapes that are live credentials wherever they appear. */
const LITERALS = [
  [/\bsk-or-v1-[0-9a-f]{48,}/, 'an OpenRouter key'],
  [/\bsk-ant-[A-Za-z0-9_-]{24,}/, 'an Anthropic key'],
  [/\bsk-proj-[A-Za-z0-9_-]{24,}/, 'an OpenAI project key'],
  [/\bghp_[A-Za-z0-9]{30,}/, 'a GitHub personal token'],
  [/\bgho_[A-Za-z0-9]{30,}/, 'a GitHub OAuth token'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/, 'a GitHub fine-grained token'],
  [/\bglpat-[A-Za-z0-9_-]{18,}/, 'a GitLab token'],
  [/\bxox[baprs]-[A-Za-z0-9-]{12,}/, 'a Slack token'],
  [/\blin_api_[A-Za-z0-9]{16,}/, 'a Linear key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'an AWS access key id'],
  [/\bAIza[0-9A-Za-z_-]{30,}/, 'a Google API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
];

const SECRETISH = 'KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|CREDS|APIKEY|AUTH|PRIVATE|PAT';
/** `${NAME:-…}` and friends expand to the VALUE when NAME is set. */
const NAME = '[A-Za-z0-9_]*(?:' + SECRETISH + ')[A-Za-z0-9_]*';
/**
 * Dangerous expansions, and the safe ones this same guard RECOMMENDS.
 *
 * `${V:-x}` `${V:=x}` `${V:+x}` `${V:?x}` and bare `$V` all reach the value.
 * `${#V}` gives a length; `${V: -4}` and `${V:0:4}` give a slice. The whole
 * distinction between the last two is a SPACE — `${V:-4}` defaults to the string
 * "4", `${V: -4}` is the last four characters — and a guard that misses it
 * refuses its own remedy. The first version did exactly that, on three of the
 * four spellings it tells the reader to use.
 */
const SAFE_EXPANSION = new RegExp(
  '\\$\\{#' + NAME + '\\}'                    // length
  + '|\\$\\{' + NAME + ':\\s+-?\\d'          // ${V: -4}, space then offset
  + '|\\$\\{' + NAME + ':\\d', 'g');           // ${V:0:4}
const ANY_EXPANSION = new RegExp('\\$\\{?' + NAME, 'g');
/** A segment whose FIRST word prints. Presence elsewhere in the line is not it. */
const PRINTS = /^\s*(echo|printf)\s/;
const SECRET_FILE =
  /(^|[\s"'=])(~|\$HOME|\/)[^\s"';|&]*(secrets\/[^\s"';|&]+|\.env(\.[\w-]+)?|[^\s"';|&]*\.(key|pem|p12|pfx)|id_[re]d?[sc]a|\.netrc|\.pgpass|\.npmrc|credentials)\b/;
const READS_FILE = /(^|[;&|(]\s*)(cat|bat|less|more|head|tail|xxd|od|strings|nl)\s/;
/**
 * `env` whose output goes NOWHERE but the transcript. The pipe is the whole
 * difference: `env | grep -c "^K="` counts and prints no value, and splitting the
 * command on `|` before testing threw that away — the guard then refused the
 * remedy printed in its own message.
 */
const DUMPS_ENV = /(^|[;&\n]\s*)(env|printenv|set)\s*(?=$|[;&\n])/;
const CURL_LOUD = /(^|[\s;&|])curl\b[^;&|]*(\s-v\b|\s--verbose\b|\s--trace)/;
const CURL_AUTH = /(Authorization|X-Api-Key|api[_-]?key|\s-u\s|\s--user\s)/i;

const TAIL =
  '\nIf this text is QUOTED rather than run — a search, a document, a pasted log — '
  + 'this refusal is wrong about it. The guard reads what could execute and cannot '
  + 'tell an example from an invocation. Pass the body through a file, or split the '
  + 'pattern.';

/**
 * @param {string} command
 * @returns {{rule: string, why: string}|null} null when nothing is denied.
 */
function inspect(command) {
  if (typeof command !== 'string' || !command.trim()) return null;

  for (const [rx, what] of LITERALS) {
    if (rx.test(command)) {
      return { rule: 'literal-credential', why:
        `This command carries ${what} as literal text. Anything in a command line is in `
        + 'the shell history and in the process table, where every process on this '
        + 'machine can read it — before the command has even run.\n'
        + 'Put the value in a file with mode 600 and have the program read the FILE, or '
        + 'pipe it on stdin. Never argv.' + TAIL };
    }
  }

  const segments = command.split(/\|\||&&|[;|&\n]/);
  const leaks = segments.some((seg) => {
    if (!PRINTS.test(seg)) return false;
    const all = (seg.match(ANY_EXPANSION) || []).length;
    const safe = (seg.match(SAFE_EXPANSION) || []).length;
    return all > safe;                       // at least one reaches the value
  });
  if (leaks) {
    return { rule: 'expansion-into-print', why:
      'This prints a variable whose name says it holds a credential. `${VAR:-fallback}` '
      + 'expands to the VALUE when VAR is set, so a line written to check whether '
      + 'something is set prints the thing it was meant to keep quiet — that exact '
      + 'construct leaked a live key twice in one session.\n'
      + 'To say it is present:  [ -n "$VAR" ] && echo set\n'
      + 'To say how long:       echo "${#VAR}"\n'
      + 'To identify it:        echo "…${VAR: -4}"' + TAIL };
  }

  if (READS_FILE.test(command) && SECRET_FILE.test(command)) {
    return { rule: 'reads-secret-file', why:
      'This prints the contents of a file whose path says it holds a credential, and '
      + 'the transcript keeps whatever a command writes.\n'
      + 'To check it exists:    test -f FILE && echo present\n'
      + 'To check its size:     wc -c < FILE\n'
      + 'To check its mode:     stat -f "%Sp" FILE' + TAIL };
  }

  if (DUMPS_ENV.test(command)) {
    return { rule: 'dumps-environment', why:
      'This prints the whole environment, which on this machine includes exported '
      + 'credentials.\n'
      + 'Name the one you want:  printenv NAME >/dev/null && echo set\n'
      + 'Or count without value: env | grep -c "^NAME="' + TAIL };
  }

  if (CURL_LOUD.test(command) && CURL_AUTH.test(command)) {
    return { rule: 'curl-prints-headers', why:
      'Verbose curl prints the request headers, and this request carries an '
      + 'Authorization header or a -u credential — so the key lands in the transcript '
      + 'even though the command never echoes it.\n'
      + 'Drop -v, and read the outcome instead: '
      + 'curl -sS -o /dev/null -w "%{http_code}"' + TAIL };
  }

  return null;
}

module.exports = { inspect, LITERALS, SECRETISH };

/**
 * The layer that exists because the first one cannot be complete.
 *
 * `inspect` denies shapes somebody thought of. A tool that prints its own
 * configuration, a stack trace carrying a header, a `docker inspect` — none of
 * those look like a leak in the command, and all of them put one in the
 * transcript. This reads what came BACK.
 *
 * It cannot unprint. Its whole value is the interval between leaking and
 * knowing: on 2026-09-05 a live key sat in a transcript for hours because
 * nothing looked. A credential noticed in the same turn is rotated in a minute;
 * one noticed at the end of a session has been in a file on disk all day.
 *
 * It reports the SHAPE and where, never the value — a warning that quoted the
 * secret would leak it a second time, into the very context the first copy is
 * already sitting in.
 */
function scan(output) {
  if (typeof output !== 'string' || !output) return null;
  const found = [];
  for (const [rx, what] of LITERALS) {
    const m = output.match(new RegExp(rx.source, 'g'));
    if (m) found.push({ what, count: m.length });
  }
  if (!found.length) return null;
  return {
    found,
    why: 'This command PRINTED something shaped like a live credential — '
      + found.map((f) => `${f.what}${f.count > 1 ? ` \u00d7${f.count}` : ''}`).join(', ')
      + '. It is in the transcript now and cannot be taken back.\n'
      + 'Treat it as compromised and rotate it at the provider before doing anything '
      + 'else; a key that was printed once is a key everything downstream of this '
      + 'session has seen. Then find why it printed — the command is what to change, '
      + 'not this warning.',
  };
}

module.exports.scan = scan;

