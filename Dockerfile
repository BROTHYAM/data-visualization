# Build the Vite application for its public URL, not for the domain root.
FROM node:24-alpine AS task03-build
WORKDIR /app
COPY Task03/space-weather-explorer/package*.json ./
RUN npm ci
COPY Task03/space-weather-explorer/ ./
RUN npm run build -- --base=/task03/

# Serve only the portal and the files needed by each application.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY portal/ /usr/share/nginx/html/
COPY Task01/index.html /usr/share/nginx/html/task01/index.html
COPY Task02/index.html Task02/styles.css Task02/app.js /usr/share/nginx/html/task02/
COPY --from=task03-build /app/dist/ /usr/share/nginx/html/task03/

# Add COPY instructions for future tasks here; see README.md.
