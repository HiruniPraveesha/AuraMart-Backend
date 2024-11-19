FROM node:16

WORKDIR /app/AURAMART-Microservice/Server/Order-Service

COPY package*.json ./

RUN npm install 

COPY . . 

EXPOSE 7003

CMD ["npm","start"]