# Hackathon Templates - Development Harnessj

This directory contains a few examples that show how to mix and match the different templates provided in this repository using Docker Compose and Tilt

## Dependencies
- Docker and Tilt

## Usage
1. Clone the repository.
```sh
git clone https://github.com/your-username/hackathon-templates.git
```

2. Navigate to the `dev-harness` directory.
```sh
cd hackathon-templates/dev-harness 
```

3. Run Docker Compose to start all the services.
```sh
docker-compose up -d
```
This will build images for the services and create containers for each of them in the background.

4. Check the logs for the services.
```sh
docker-compose logs -f
```
This will show the output logs of all the services. You can hit `CTRL+C` or `CMD+C` to exit from the logs view.

5. Access the services.
- `localhost:8000` for the FastAPI backend.
- `localhost:8080/graphql` for the Go GraphQL backend.
- `localhost:3000` for the React frontend.

6. Stop and remove the containers and networks.
```sh
docker-compose down
```

## Contributing

If you would like to contribute to this repository, please feel free to submit a pull request. Before submitting a pull request, please ensure that your code adheres to our coding guidelines. 

## License

This project is licensed under the ISC License - see the [LICENSE](../LICENSE) file for details.
