FROM node:16.13.0
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . .
CMD node index.js
EXPOSE 8081