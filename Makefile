# Makefile

# Variables
FRONTEND_DIR = frontend_react_viteJWT
BACKEND_DIR = backend
CURRENT_DIR = $(CURDIR)

# Default target
run_front:
	cd $(FRONTEND_DIR) && npm run dev

run_backend:
	cd $(BACKEND_DIR) && npm start

run:
	make run_front & make run_backend

install:
	cd $(CURRENT_DIR)
	cd $(FRONTEND_DIR) && npm i

	cd $(CURRENT_DIR)
	cd $(BACKEND_DIR) && npm i

init:
	make install & make run