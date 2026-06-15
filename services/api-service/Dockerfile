# ---------------------------------------------------------------------------
# This Dockerfile describes how to package the api-service into a container
# image. docker compose builds it automatically.
# ---------------------------------------------------------------------------

# Start from an official, small Node.js 22 image.
FROM node:22-alpine

# All following commands run inside /app in the container.
WORKDIR /app

# Copy only the dependency manifests first. Docker caches this layer, so it
# only re-installs packages when these files change (faster rebuilds).
COPY package.json ./
RUN npm install

# Now copy the rest of the source code.
COPY . .

# The service listens on 3000 inside the container.
EXPOSE 3000

# Command that runs when the container starts.
CMD ["npm", "start"]
