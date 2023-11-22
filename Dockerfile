# Image nodejs
FROM node:18.16.0

# create directori
WORKDIR /app

# # copy file package json
# COPY /middleware/service.json ./

# copy file package json
COPY package*.json ./

# install dependensi
RUN npm install

# copy all file
COPY . .

# expose port
EXPOSE 9000

# running app
CMD [ "npm", "prod" ]
