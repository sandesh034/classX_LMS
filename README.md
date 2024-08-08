# ClassX Learning Management System (LMS)

ClassX is a robust Learning Management System designed to streamline educational processes for students and instructors.
## About the Project

This project is developed as a part of the Database Management System (DBMS) course by **Sandesh Dhital (THA078BEI034)** and **Saroj Nagarkoti (THA078BEI039)**.

## Features

- **Course Management**: Create, manage, and organize courses effortlessly.
- **Assignment Management**: Distribute assignments, collect submissions, and grade them efficiently.
- **Communication Tools**: Facilitate discussions, and announcements.
- **User Management**: Administer roles and permissions for students, instructors, and administrators.
- **Analytics**: Track student progress and performance metrics.
- **Virtual Classrooms**: Host interactive virtual classes with video conferencing, screen sharing, and real-time collaboration tools.

## Installation and Usage

### Prerequisites

- Node.js and npm installed on your system.
- Access to a database (PostgreSQL).

### Installation Steps

1. Clone the repository:

   ```sh
   git clone https://github.com/sandesh034/classX_LMS.git
   cd classX_LMS
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Configure environment variables:

   Update `.env` with your database credentials.

4. Start the server:

   ```sh
   npm start
   ```

5. Access the application at `http://localhost:8000`.

## Deployment

The backend system is hosted on render. [Link](https://classx-lms.onrender.com/api/v1/course/list). Refer the routing within the repository for further endpoints.
  
## Contributing

We welcome contributions to improve ClassX LMS. To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

This project is licensed under the MIT License. 

