REGISTRY   ?= pocket
IMAGE_NAME ?= pocket
TAG        ?= latest
IMAGE      := $(REGISTRY)/$(IMAGE_NAME):$(TAG)

.PHONY: build push run

build:
	docker build -t $(IMAGE) .

push: build
	docker push $(IMAGE)

run:
	docker run --rm -p 8000:8000 --env-file backend/.env $(IMAGE)
