# Variables
GOLANGCI_LINT_VERSION = v1.57.2

generate:
	@echo "Generating code..."
	go generate ./...

.PHONY: run-dev
run-dev:
	command -v wgo || go install github.com/bokwoon95/wgo@latest
	wgo run .

# Lint rules
lint-deps:
	@echo "Installing linters..."
	curl -sfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(shell go env GOPATH)/bin $(GOLANGCI_LINT_VERSION)

lint:
	@echo "Linting code..."
	go vet ./...
	golangci-lint run

# Test rules
test:
	@echo "Running tests..."
	go test ./...

# Docker rules
docker-build:
	@echo "Building docker image..."
	docker build -t cudalive-backend .

docker-run:
	@echo "Running container..."
	docker run -it -p 8080 cudalive-backend

docker-stop:
	@echo "Stopping container..."
	docker stop cudalive-backend

.PHONY: install build lint-install lint test docker-build docker-run docker-stop
