FROM nginx:alpine

# Only the htpasswd tool is baked into the image; the actual credential file
# is generated fresh at container startup (see docker-entrypoint.d script)
# from env vars, so no secret ever lives in the image or in git.
RUN apk add --no-cache apache2-utils

COPY generate-htpasswd.sh /docker-entrypoint.d/40-generate-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-generate-htpasswd.sh
