# User API Spesification

### base url : `https://<cloudrun_service_name>.a.run.app/`

## Register User

- Path :
  - `/api/users/register`
- Method:
  - `POST`
- Request Body
  ```json
  {
    "name": "Daus",
    "email": "daus@gmail.com",
    "country": "Indonesia",
    "password": "Rahasi@0805",
    "confirmPassword": "Rahasi@0805"
  }
  ```
- Response Success
  ```json
  {
    "errors": null,
    "message": "User created, please check your email",
    "data": {
        "userId": "44dda8c3-91b2-418d-af73-e83a42ab3605",
        "name": "daus",
        "email": "daus@gmail.com",
        "expireTime": "Sun Nov 05 2023 23:51:47 GMT+0800"
    }
  }
  ```
- Response Gagal
  ```json
  {
    "errors": [
        "password most be at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 symbol",
        "Password does not match"
    ],
    "message": "Register Failed",
    "data": null
  }
  ```

## Email Activation Account

- Path :
  - `/api/users/:uuid`
- Method:
  - `GET`
- Response Success
  ```json
  {
    "error": null,
    "message": "User activated successfully",
    "data": {
        "name": "daus08",
        "email": "daus@gmail.com"
    }
    
  }
  ```
- Response Gagal
  ```json
  {
    "errors": ["User not found or expired"],
    "message": "Activate User Failed",
    "data": null,
  }
  ```

## Login User

- Path :
  - `/api/users/login`
- Method:
  - `POST`
- Request Body
  ```json
  {
    "email": "daus@gmail.com",
    "password": "rahasia"
  }
  ```
- Response Success
  ```json
  {
  "errors": [],
  "message": "Login successfully",
  "data": {
    "userId": "44dda8c3-91b2-418d-af73-e83a42ab3605",
    "name": "daus",
    "email": "daus@gmail.com"
  },
  "acessToken": "xxxx",
  "refreshToken": "xxxx"
  }
  ```
- Response Gagal
  ```json
  {
    "errors": [
        "Wrong password"
    ],
    "message": "Login Failed",
    "data": {
        "email": "daus@gmail.com",
        "password": "Dau@123"
    }
  }
  ```

## Refresh Token

- Path :
  - `/api/users/refresh`
- Method:
  - `POST`
- Header:
  - `Authorization: Bearer <access_token>`
- Response Success
  ```json
  {
    "error": null,
    "message": "Refresh Token Berhasil",
    "data": [
      {
        "id": "xxx",
        "name": "daus08",
        "email": "daus@gmail.com"
      }
    ],
    "access_token": "xxx",
    "refresh_token": "xxx"
  }
  ```
- Response Gagal
  ```json
  {
    "error": ["Token is not valid"],
    "message": "Refresh Token Failed",
    "data": null
  }
  ```

## Get User

- Path :
  - `/api/users/:id`
- Method:
  - `GET`
- Header:
  - `Authorization: Bearer <access_token>`
- Response Success
  ```json
  {
    "error": null,
    "message": "Get User Success",
    "data": [
      {
        "id": "xxx",
        "name": "daus08",
        "email": "daus@gmail.com",
        "country": "Indonesia",
        "phoneNumber": "+6212345678910",
        "avatar": "url"
      }
    ]
  }
  ```
- Response Gagal
  ```json
  {
    "error": ["User not Found"],
    "message": "Get User Failed",
    "data": null
  }
  ```

## Update User

- Path :
  - `/api/users/:id`
- Method:
  - `PATCH`
- Header:
  - `Authorization: Bearer <access_token>`
- Request Body
  ```json
  {
    "name": "daus08",
    "email": "daus@gmail.com",
    "country": "Indonesia",
    "phoneNumber": "+6212345678910",
    "password": "rahasia"
  }
  ```
- Response Success
  ```json
  {
    "error": null,
    "message": "Update User Success",
    "data": [
      {
        "id": "xxx",
        "name": "daus08",
        "email": "daus@gmail.com",
        "country": "Indonesia",
        "phoneNumber": "+6212345678910",
        "avatar": "url"
      }
    ]
  }
  ```
- Response Gagal
  ```json
  {
    "error": ["User not Found"],
    "message": "Update User Failed",
    "data": null
  }
  ```

## Add User Avatar

- Path :
  - `/api/users/:id/avatar`
- Method:
  - `POST`
- Header:
  - `Authorization: Bearer <access_token>`
- Request
  - `image as file (max. 5 MB)`
  - `Key: avatar`
- Response Success
  ```json
  {
    "error": null,
    "message": "Add User Avatar Success",
    "data": [
      {
        "id": "xxx",
        "name": "daus08",
        "email": "daus@gmail.com",
        "avatar": "url"
      }
    ]
  }
  ```
- Response Gagal
  ```json
  {
    "error": ["User not Found"],
    "message": "Add User Avatar Failed",
    "data": null
  }
  ```

## Updated User Avatar

- Path :
  - `/api/users/:id/avatar`
- Method:
  - `PATCH`
- Header:
  - `Authorization: Bearer <access_token>`
- Request
  - `image as file (max. 5 MB)`
  - `Key: avatar`
- Response Success
  ```json
  {
    "error": null,
    "message": "Update User Avatar Success",
    "data": [
      {
        "id": "xxx",
        "name": "daus08",
        "email": "daus@gmail.com",
        "avatar": "url"
      }
    ]
  }
  ```
- Response Gagal
  ```json
  {
    "error": ["User not Found"],
    "message": "Update User Avatar Failed",
    "data": null
  }
  ```

## Delete User

- Path :
  - `/api/users/:id`
- Method:
  - `DELETE`
- Header:
  - `Authorization: Bearer <access_token>`
- Response Gagal
  ```json
  {
    "error": ["User not Found"],
    "message": "Delete User Failed",
    "data": null
  }
  ```