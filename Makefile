SHELL=/bin/bash

MONGO_CHECK = $(shell lsof -i :27017 | grep mongo)

test:
	./node_modules/.bin/litmus tests/suite.js

integration-test: mongo-check
	./node_modules/.bin/litmus tests/integration.js

mongo-check:
	@ if [ -z "$(MONGO_CHECK)" ]; then \
		echo "Cannot find mongo on default port 27017"; \
		exit 1; \
	else \
		echo "Using Mongo running on port 27017..."; \
	fi