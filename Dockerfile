# Initial Stage
FROM node:16-alpine as builder

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json /usr/src/app

ENV NODE_ENV=production

#RUN yarn global add typescript

RUN yarn install

COPY . .

RUN yarn build

COPY . /usr/src/app

EXPOSE 3000

CMD [ "yarn", "start" ]