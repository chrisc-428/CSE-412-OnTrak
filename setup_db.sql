CREATE DATABASE IF NOT EXISTS OnTrak;

CREATE TABLE "User" (
	UserID SERIAL PRIMARY KEY,
	Email VARCHAR(100) UNIQUE NOT NULL,
	Username VARCHAR(60) UNIQUE NOT NULL,
	Password VARCHAR(255) NOT NULL
);

CREATE TABLE Application (
	ApplicationID SERIAL PRIMARY KEY,
	UserID INT NOT NULL REFERENCES "User"(UserID) ON DELETE CASCADE,
	Name VARCHAR(120) NOT NULL,
	CompanyName VARCHAR(120) NOT NULL,
	Status VARCHAR(20) NOT NULL CHECK (Status IN ('Applied', 'Round 1', 'Round 2',
	'Round 3', 'Accepted', 'Rejected')),
	"Date" DATE NOT NULL,
	JobType VARCHAR(20) NOT NULL CHECK (JobType IN ('Full-time', 'Internship',
	'Co-op')),
	Income Numeric(12,2) DEFAULT 0 CHECK (Income >= 0),
	Description VARCHAR(500) DEFAULT ''
);

CREATE TABLE Interview (
	InterviewID SERIAL PRIMARY KEY,
	ApplicationID INT NOT NULL REFERENCES Application(ApplicationID) ON DELETE
	CASCADE,
	RoundNum INT NOT NULL CHECK (RoundNum IN (1,2,3)),
	"Date" DATE NOT NULL,
	"Location" VARCHAR(20) NOT NULL CHECK ("Location" IN ('Virtual', 'In-Person')),
	Notes VARCHAR(500)
);

CREATE TABLE Analytics (
	AnalyticsID SERIAL PRIMARY KEY,
	UserID INT NOT NULL UNIQUE REFERENCES "User"(UserID) ON DELETE
	CASCADE,
	TotalApplied INT DEFAULT 0 CHECK (TotalApplied >= 0),
	TotalRejected INT DEFAULT 0 CHECK (TotalRejected >= 0),
	TotalAccepted INT DEFAULT 0 CHECK (TotalAccepted >= 0),
	TotalFirstRound INT DEFAULT 0 CHECK (TotalFirstRound >= 0),
	TotalSecondRound INT DEFAULT 0 CHECK (TotalSecondRound >= 0),
	TotalThirdRound INT DEFAULT 0 CHECK (TotalThirdRound >= 0),
	AverageIncome INT DEFAULT 0 NOT NULL CHECK (AverageIncome >= 0),
	LastUpdated DATE NOT NULL DEFAULT CURRENT_DATE
);

INSERT INTO "User" (Email, Username, Password)
	VALUES
	('alex@example.com', 'Alex', 'password1!'),
	('j25@example.com', 'James', 'password1!'),
	('mason@example.com', 'Mason', 'secrect22@');

INSERT INTO Application (UserID, Name, CompanyName, Status, "Date", JobType, Income,
Description)
	VALUES
	(1, 'Amazon Software Engineering Intern App', 'Amazon', 'Applied', '2025-02-10', 'Internship', 0,
	'Talked to at career fair'),
	(1, 'Google Frontend Dev App', 'Google', 'Round 1', '2025-03-02', 'Full-time', 0, 'Phone
	Interview Scheduled'),
	(1, 'Meta Data Analyst App', 'Meta', 'Rejected', '2025-01-10', 'Full-time', 0, 'Auto Rejection'),
	(2, 'ByteDance Database Administator App', 'ByteDance', 'Accepted', '2025-07-17', 'Full-time',
	150000, 'Offer accepted'),
	(3, 'Roblox Backend Engineering Intern App', 'Roblox', 'Round 2', '2025-02-25', 'Internship', 0,
	'Prep system designs');

INSERT INTO Interview (ApplicationID, RoundNum, "Date", "Location", Notes)
	VALUES
	(2,1,'2025-03-08', 'Virtual', 'Phone screening went well'),
	(4,1,'2025-01-20', 'Virtual', 'Introduction call'),
	(4,2,'2025-03-30', 'In-Person', 'System design round');

INSERT INTO Analytics (UserID, TotalApplied, TotalRejected, TotalAccepted,
TotalFirstRound, TotalSecondRound, TotalThirdRound, AverageIncome)
	VALUES
	(1,3,1,0,1,0,0,0),
	(3,1,0,0,1,1,0,0),
	(2,1,0,1,1,1,0,150000);