FROM node:16

WORKDIR /app/AURAMART-Microservice/Server/Shopping-cart

COPY package*.json ./

RUN npm install 

COPY . . 

EXPOSE 7001

CMD ["npm","start"]