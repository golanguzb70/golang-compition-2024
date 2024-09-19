# Required Tools
Your project should use the following technologies:
- **Golang** for backend development.
- **PostgreSQL** or **MongoDB** for database management.
- **REST API** for communication between client and server.
- **Swagger** for API documentation.
- **Docker** for containerization.

# Project Run Instructions
Your project must adhere to the following setup. If these commands are not provided or functional, your project will not be evaluated.

- **Database Setup:**  
  To start the database using Docker, execute the following command:
  ```bash
  make run_db
  ```

  This command should be configured in the `Makefile` to run the appropriate Docker command, such as:
  ```makefile
  run_db:
    docker-compose up -d db
  ```

- **Run the Application:**  
  To start the entire project using Docker, run:
  ```bash
  make run
  ```

  The `Makefile` should be configured as:
  ```makefile
  run:
    docker-compose up -d app
  ```

  This will spin up your Golang application in a container, along with any other required services.

- **Docker Setup:**  
  Your project should include both a `Dockerfile` and a `docker-compose.yml` file that define:
  - The **Golang** application.
  - The **PostgreSQL** or **MongoDB** database.

Make sure running the following command works without issues:
```bash
docker-compose up
```

The `Makefile` should handle all Docker-related tasks, ensuring the database and application are started properly using the `make run_db` and `make run` commands.