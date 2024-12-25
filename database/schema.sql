CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'regular',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    website VARCHAR(255)
);

CREATE TABLE job_postings (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    salary_range VARCHAR(100),
    posting_date DATE NOT NULL,
    closing_date DATE,
    status VARCHAR(20) DEFAULT 'active'
); 