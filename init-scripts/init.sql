-- MySQL initialization script for Leave Request System
-- This script sets up the database with proper permissions

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS leave_request_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE leave_request_db;

-- Create application user with necessary permissions
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX ON leave_request_db.* TO 'app_user'@'%';
FLUSH PRIVILEGES;

-- Set timezone
SET time_zone = '+00:00';
