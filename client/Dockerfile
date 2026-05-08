# Swapped from alpine to bookworm-slim (Debian) for native ARM/esbuild support
FROM node:20-bookworm-slim

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

EXPOSE 3000

# Force Vite to bind to the Docker network interface directly via CLI
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]