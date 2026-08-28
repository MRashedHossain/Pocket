REGISTRY   ?= pocket
IMAGE_NAME ?= pocket-frontend
TAG        ?= latest
IMAGE      := $(REGISTRY)/$(IMAGE_NAME):$(TAG)

.PHONY: build push run

build:
	docker build -t $(IMAGE) .

push: build
	docker push $(IMAGE)

run:
	docker run --rm -p 5173:5173 $(IMAGE)
