CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_type AS ENUM('student', 'instructor', 'admin');

DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS InstructorAssignments;
DROP TABLE IF EXISTS Enrollments;
DROP TABLE IF EXISTS Forum_Posts;
DROP TABLE IF EXISTS Forum_Replies;
DROP TABLE IF EXISTS Assignment_Posts;
DROP TABLE IF EXISTS Assignment_Submissions;
DROP TABLE IF EXISTS Resources;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS Attendences;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS Users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
	image VARCHAR(255),
	refresh_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON Users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price INT NOT NULL CHECK(price >= 0),
	start_date DATE NOT NULL,
    duration INT NOT NULL CHECK(duration >= 0), -- duration in days
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_courses_timestamp
BEFORE UPDATE ON Courses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS InstructorAssignments (
    instructor_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL,
    instructor_id UUID NOT NULL,
	UNIQUE (course_id, instructor_id), -- Ensures an instructor is assigned to a course only once
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_instructor_assignments_timestamp
BEFORE UPDATE ON InstructorAssignments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL,
    student_id UUID NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
	UNIQUE(course_id, student_id), -- Ensures a student is enrolled in a course only once
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_enrollments_timestamp
BEFORE UPDATE ON Enrollments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Forum_Posts(
	forum_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	posted_by UUID NOT NULL,
	course_id UUID NOT NULL,
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (posted_by) REFERENCES Users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);

CREATE TRIGGER update_forum_posts_timestamp
BEFORE UPDATE ON Forum_Posts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Forum_Replies(
	reply_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	replied_by UUID NOT NULL,
	forum_id UUID NOT NULL,
	reply_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (replied_by) REFERENCES Users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (forum_id) REFERENCES Forum_Posts(forum_id) ON DELETE CASCADE
);

CREATE TRIGGER update_forum_replies_timestamp
BEFORE UPDATE ON Forum_Replies
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Assignment_Posts(
	assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	deadline_date DATE NOT NULL,
	deadline_time TIME NOT NULL,
	attachment VARCHAR(255),
	course_id UUID NOT NULL,
	assigned_by UUID NOT NULL,
	full_marks INT NOT NULL,
	pass_marks INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
	FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_assignment_posts_timestamp
BEFORE UPDATE ON Assignment_Posts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Assignment_Submissions(
	assignment_submit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	assignment_id UUID NOT NULL,
	submitted_by UUID NOT NULL,
	graded_by UUID,
	submission_date DATE DEFAULT CURRENT_DATE,
	submission_time TIME DEFAULT CURRENT_TIME,
	obtained_marks INT,
	attachment VARCHAR(255) NOT NULL,
	description TEXT,
	comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (assignment_id) REFERENCES Assignment_Posts(assignment_id) ON DELETE CASCADE,
	FOREIGN KEY (submitted_by) REFERENCES Users(user_id) ON DELETE CASCADE,
	FOREIGN KEY (graded_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_assignment_submissions_timestamp
BEFORE UPDATE ON Assignment_Submissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Resources(
	resource_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	course_id UUID NOT NULL,
	uploaded_by UUID NOT NULL,
	title VARCHAR(255),
	description TEXT,
	attachment VARCHAR(255) NOT NULL,
	created_at DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
	FOREIGN KEY (uploaded_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_resources_timestamp
BEFORE UPDATE ON Resources
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Classes(
	class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	title VARCHAR(255),
	date DATE NOT NULL,
	time TIME NOT NULL,
	duration INT NOT NULL, -- duration in minutes
	instructor_id UUID NOT NULL,
	course_id UUID NOT NULL,
	class_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
	FOREIGN KEY (instructor_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_classes_timestamp
BEFORE UPDATE ON Classes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TABLE IF NOT EXISTS Attendences(
	attendence_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	class_id UUID NOT NULL,
	student_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE,
	FOREIGN KEY (student_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER update_attendences_timestamp
BEFORE UPDATE ON Attendences
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
