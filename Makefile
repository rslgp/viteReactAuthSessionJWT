# Makefile

# Variables
FRONTEND_DIR = frontend_react_viteJWT
BACKEND_DIR = backend

# Default target
run_front:
	cd $(FRONTEND_DIR) && npm run dev

run_backend:
	cd $(BACKEND_DIR) && npm start

run:
	make run_front & make run_backend