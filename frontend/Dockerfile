FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

# Install envsubst (part of gettext) so we can inject API_URL at runtime
RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html
# Store config as a template; envsubst replaces ${API_URL} at startup
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

# Default: Docker Compose local dev (api = the backend service hostname)
ENV API_URL=http://api:8000

# envsubst injects API_URL then hands off to nginx
CMD ["/bin/sh", "-c", \
  "envsubst '${API_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
