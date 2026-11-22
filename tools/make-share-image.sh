#!/bin/bash
# Remakes share.png, the picture shown when DREAMO is shared in a text or on social media.
# Usage: tools/make-share-image.sh ["env=forest&starter=cottage&hour=17"]
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])')
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT" >/dev/null 2>&1 &
SERVER=$!; trap 'kill $SERVER 2>/dev/null' EXIT
for i in {1..50}; do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.1; done
BIG="$(mktemp -d)/share@2x.png"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader \
  --hide-scrollbars --window-size=1200,630 --force-device-scale-factor=2 --virtual-time-budget=15000 \
  --screenshot="$BIG" "http://127.0.0.1:$PORT/tools/share-image.html?$1" 2>/dev/null
# Draw it twice as big, then shrink it: smoother edges.
python3 -c "from PIL import Image; Image.open('$BIG').convert('RGB').resize((1200,630), Image.LANCZOS).save('$ROOT/share.png', optimize=True)"
echo "Made $ROOT/share.png"
