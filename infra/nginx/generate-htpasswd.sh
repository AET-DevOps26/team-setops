#!/bin/sh
# Runs automatically on container start (nginx's official entrypoint sources
# every executable script in /docker-entrypoint.d/ before starting nginx).
# Generates the Prometheus basic-auth file fresh each start from env vars
# instead of shipping a committed credential file.
set -e

: "${PROMETHEUS_AUTH_USER:=admin}"
: "${PROMETHEUS_AUTH_PASSWORD:=devpulse}"

htpasswd -bc /etc/nginx/.htpasswd "$PROMETHEUS_AUTH_USER" "$PROMETHEUS_AUTH_PASSWORD"
