FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3400 3401 3402 3403 3404 3405 3406 3407 3408

CMD ["npm", "run", "dev"]
