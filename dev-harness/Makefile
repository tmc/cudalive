# A common Makefile for managing the docker-compose and Tilt environments

run-tilt: ## Run the Tilt environment
	tilt up

deps: ## Install dependencies
	@command -v brew >/dev/null 2>&1 || { echo >&2 "Homebrew is required but not installed. Attempting to install now."; ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"; }
	@command -v tilt >/dev/null 2>&1 || { echo >&2 "Tilt is required but not installed. Attempting to install via homebrew."; brew install tilt; }

# Build and tag the images
build:
	docker-compose build

# Run the containers
up: build
	docker-compose up

# Run the containers
up-background: build
	docker-compose up -d

# Stop the running containers
down:
	docker-compose down

# Follow the logs for each container
logs:
	docker-compose logs -f --tail 100

# Stop and remove all containers and images
clean:
	tilt down
	docker-compose down --rmi all -v

# Alias for clean
reset: clean

.PHONY: build up up-b down logs clean reset

.PHONY: help
help: ## Show help for each of the Makefile recipes.
	# This shell prints out the help for each target in this Makefile.
	@grep -E '^[a-zA-Z0-9 -]+:.*##'  Makefile | sort | while read -r l; do printf "\033[1;32m$$(echo $$l | cut -f 1 -d':')\033[00m:$$(echo $$l | cut -f 2- -d'#')\n"; done
.DEFAULT_GOAL := help
