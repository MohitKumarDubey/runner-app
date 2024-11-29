# Use the official Node.js image
FROM node:18-alpine

# Update package list and install required packages
# Update package list and install required packages
RUN apk add --no-cache \
    make \
    python3 \
    py3-pip \
    build-base

# Set the working directory inside the container
WORKDIR /app

# Create a new directory
RUN mkdir  /your-app

# Use the official Node.js image
COPY package.* ./

# Install dependencies
RUN npm install

# Copy the application source code
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Define the command to run your app
CMD ["node", "socketInit.js"]