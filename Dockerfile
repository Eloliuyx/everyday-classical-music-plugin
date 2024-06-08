# Use the official node image as a parent image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages
RUN npm install

# Expose port 3000 to the outside world
EXPOSE 3000

# Run npm start when the container launches
CMD ["npm", "start"]
