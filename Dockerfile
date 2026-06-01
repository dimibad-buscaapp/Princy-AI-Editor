FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 3400 3401 3402 3403 3404 3405 3406 3407 3408

CMD ["npm", "run", "start"]
