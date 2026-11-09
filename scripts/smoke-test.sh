#!/usr/bin/env bash
# Checks the live site after a deploy (see .claude/skills/deploy/SKILL.md).
# Read-only: it writes no analytics events, poems, links or payments.
#
#   bash scripts/smoke-test.sh [base URL, default https://sintgpt.com]
#
# When local DNS cannot reach the site, pin an address:
#   SMOKE_IP=104.21.83.254 bash scripts/smoke-test.sh

BASE="${1:-https://sintgpt.com}"
HOST="${BASE#https://}"
HOST="${HOST%%/*}"
CURL=(curl -s --max-time 20)
if [[ -n "$SMOKE_IP" ]]; then
  CURL+=(--resolve "$HOST:443:$SMOKE_IP" --resolve "www.$HOST:443:$SMOKE_IP")
fi

fails=0
check() { # name, expected, actual
  if [[ "$2" == "$3" ]]; then
    printf '  ok    %-44s %s\n' "$1" "$3"
  else
    printf '  FAIL  %-44s got %s, want %s\n' "$1" "$3" "$2"
    fails=$((fails + 1))
  fi
}
status() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$@"; }

echo "Pages"
for path in / /voorbeelden /lootjes /blog /blog/lootjes-trekken-tips /privacy /voorwaarden /sitemap.xml /robots.txt; do
  check "$path" 200 "$(status "$BASE$path")"
done

echo "Files"
for path in /pdf/paper.jpg /pdf/pakjesavond.jpg /pdf/cadeaupapier.jpg /pdf/schoolschrift.jpg \
  /pdf/previews/perkament.jpg /pdf/previews/pakjesavond.jpg /pdf/previews/cadeaupapier.jpg /pdf/previews/schoolschrift.jpg \
  /pdf/alegreya-400.ttf /pdf/texturina-700.ttf /pdf/caveat-500.ttf /og/home.jpg /sint-hero-800.webp; do
  check "$path" 200 "$(status "$BASE$path")"
done

echo "Server"
check "www redirects" 301 "$(status "https://www.$HOST/")"
check "/api/payment/status" 200 "$(status "$BASE/api/payment/status")"
check "/g/<unknown> is 404" 404 "$(status "$BASE/g/abcdefghij")"
# A server-only event name is refused (400) before anything is written.
check "/api/events refuses a server event" 400 \
  "$(status -X POST -H 'content-type: application/json' -d '{"name":"Generate poem"}' "$BASE/api/events")"

echo "Content"
home="$("${CURL[@]}" "$BASE/")"
check "home has the poem form" 1 "$(grep -c 'id="poem-form"' <<<"$home" | tr -d ' ' | sed 's/^[1-9][0-9]*$/1/')"
check "home has no Umami" 0 "$(grep -ci umami <<<"$home" | tr -d ' ')"
check "canonical link" 1 "$(grep -c "<link rel=\"canonical\" href=\"https://$HOST/\"" <<<"$home" | tr -d ' ' | sed 's/^[1-9][0-9]*$/1/')"

echo
if ((fails)); then
  echo "$fails check(s) failed"
  exit 1
fi
echo "All checks passed"
