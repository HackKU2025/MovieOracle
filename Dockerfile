# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Use nginx to serve the static files
FROM nginx:alpine

# Copy the build files to nginx serve directory
COPY --from=0 /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
