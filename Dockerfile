# Initial Stage
FROM node:18-alpine as builder

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

RUN apk --update --no-cache add curl

HEALTHCHECK CMD curl --fail https://agenda.orlwambier.com.br || exit 1 


CMD [ "yarn", "start" ]