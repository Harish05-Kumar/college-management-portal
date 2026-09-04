-- Insert default admin user
-- Email: admin@college.com
-- Password: admin123
DELETE FROM companies
WHERE package_amount IS NULL
  AND required_cgpa = 6.0
  AND (required_skills IS NULL OR required_skills = '');

DELETE FROM admins WHERE email = 'admin@college.com';

INSERT INTO admins (email, password, role) VALUES 
('admin@college.com', '$2a$10$r.jG8SOoXiBaVsWBB2T1SeejRaDQNr4URlqriWo/eE0oQ5JROZwPm', 'ROLE_ADMIN');
