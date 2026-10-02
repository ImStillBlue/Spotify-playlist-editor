#!/usr/bin/env bash
# Generates a local CA plus a localhost leaf certificate for the Vite dev server,
# then trusts the CA in the user NSS database.
#
# Spotify requires an https redirect URI, so the dev server has to speak TLS.
# mkcert would do this, but it needs root to install a system-wide CA; trusting
# the CA in ~/.pki/nssdb is enough for Chrome and Firefox on Linux and needs no
# sudo. Certs land in .certs/, which is gitignored.
set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/.certs"
CA_NAME='Spotify Playlist Editor Dev CA'
DAYS=397

command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }
command -v certutil >/dev/null || { echo "certutil (libnss3-tools) is required" >&2; exit 1; }

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

openssl req -x509 -newkey rsa:2048 -sha256 -days "$DAYS" -nodes \
  -keyout ca.key -out ca.pem -subj "/CN=$CA_NAME" \
  -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' \
  -addext 'keyUsage=critical,keyCertSign,cRLSign'

openssl req -newkey rsa:2048 -nodes -keyout localhost.key -out localhost.csr \
  -subj '/CN=localhost'

# The DNS:localhost SAN is not there to make localhost usable: Spotify rejects
# that hostname in redirect URIs, and the dev server redirects it to 127.0.0.1.
# It only keeps the TLS handshake quiet during that redirect.
cat > leaf.ext <<'EXT'
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:localhost,IP:127.0.0.1,IP:0:0:0:0:0:0:0:1
EXT

openssl x509 -req -in localhost.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
  -out localhost.pem -days "$DAYS" -sha256 -extfile leaf.ext

# Re-running would otherwise append a duplicate trust entry on every invocation.
certutil -d "sql:$HOME/.pki/nssdb" -D -n "$CA_NAME" >/dev/null 2>&1 || true
certutil -d "sql:$HOME/.pki/nssdb" -A -t 'CT,C,C' -n "$CA_NAME" -i ca.pem

echo "Wrote $CERT_DIR/localhost.pem and trusted the CA for this user."
echo "Restart the dev server if it is already running."
