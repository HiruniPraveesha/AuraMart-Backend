FROM node:16

WORKDIR /app/AURAMART-Microservice/Server/Admin-Service

COPY package*.json ./

RUN npm install 

COPY . .

EXPOSE 7004

CMD ["npm","start"]