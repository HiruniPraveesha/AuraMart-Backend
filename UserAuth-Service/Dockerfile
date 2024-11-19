FROM node:16

WORKDIR /app/AURAMART-Microservice/Server/UserAuth-Service

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 7002

CMD ["npm", "start"]