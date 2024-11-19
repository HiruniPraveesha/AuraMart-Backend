FROM node:16

WORKDIR /app/AURAMART-Microservice/Server/Product-Service

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 7005

CMD ["npm", "start"]