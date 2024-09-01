# task-management-api-pmiTask to be done:
Objective: Develop a backend API for task management (To-Do List) with user registration and authentication functionality. The application should support CRUD operations (create, read, update, delete) for tasks and users, as well as integration with AWS services.


Main Requirements

Please use Npm scripts to mimic a simple pipeline flow that will build the code, prepare it for deployment and use the chosen IaC provider to deploy it if needed. The service has to use AWS Lambda service for compute.


1. Infrastructure + AWS services

- Infrastructure as Code solution - preferably terraform, can also use CloudFormation.
- Data Storage: Use AWS DynamoDB or RDS.

- Security: All sensitive data (e.g., JWT secrets, database connection details) should be securely stored using AWS services.



2. Backend (NodeJS + DB)

- Authentication and Authorization: Implement JWT authentication to secure the API endpoints other than registration and login.
- REST API: The API should support the following endpoints:
    - POST /auth/register - user registration.
    - POST /auth/login - user login.
    - GET /tasks - retrieve the current user's task list.
    - POST /tasks - create a new task.
    - PUT /tasks/:id - update a task.
    - DELETE /tasks/:id - delete a task.
- Database: All user and task data should be stored in the database.

3. Additional Tasks ( + additional bonus if complete )
- Unit Testing: Implement basic unit tests for backend components
- Documentation: Prepare brief documentation for installation, setup, and usage of the application.

- Documentation: Prepare brief documentation for installation, setup, and usage of the application.


Evaluation Criteria:
- Functionality: The application should meet the described requirements and work correctly.
- Code Quality: Clean, quality code using TypeScript.
- Testing: Presence and quality of tests.
- Documentation: Presence and quality of documentation.





