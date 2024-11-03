# Use an official Node runtime as the parent image
FROM node:20

# Set the working directory to /app
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /app
COPY package*.json ./

# Install any needed packages specified in package.json
RUN npm install

# If ENV variable PORT is set, use that value, otherwise use 3000
COPY . .

# Run npm start when the container launches
CMD ["npm", "start"]