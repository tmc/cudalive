# Go GQLGen Backend with Subscription Support

This is a backend template for a Go [GraphQL](https://graphql.org/) server utilizing [GQLGen](https://github.com/99designs/gqlgen) that can easily be set up with subscriptions. 

## Introduction

This template comes with a pre-configured setup for creating a Go GraphQL server with [GQLGen](https://github.com/99designs/gqlgen) and subscription support using [nhooyr/websocket](https://github.com/nhooyr/websocket). 

## Dependencies

- [Golang](https://golang.org/dl/) (1.16 or higher)
- [Docker](https://docs.docker.com/get-docker/)
- [docker-compose](https://docs.docker.com/compose/install/)

## Installation

1. Clone this repository and navigate to the `hackathon-templates/go-graphql-backend/` directory.
2. Run `make install` to install all the necessary dependencies.

## Usage

1. Run `make run` to start the GraphQL server.
2. Open your web browser and navigate to `http://localhost:8080/` to interact with the GraphQL Playground.

## Running Locally

To run the server locally without Docker, run the following command:

```
go run server.go
```

This will start the server on `http://localhost:8080/`. 

## Using Docker

To start the server using Docker, run the following command:

```
make docker-run
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for more details.

## License

This project is licensed under the ISC License - see the [LICENSE](../LICENSE) file for details.
