# RAT-Secure-File-Managment-System
A Secure File Management System is a software application designed to store, manage, and protect files from unauthorized access, modification, and deletion. This system ensures that users can access and manipulate files based on their roles while maintaining strict security through authentication, encryption, and logging mechanisms.

1. Project Overview
Goals:
Develop a system that securely stores, manages, and controls access to files.

Implement encryption, authentication, and logging mechanisms.

Ensure role-based access and prevent unauthorized modifications.

Expected Outcomes:
A functional file management system with user authentication.

Secure encryption and decryption of files.

Controlled access with logs tracking file activities.

Scope:
User authentication and role-based access.

Secure file handling (upload, delete, modify).

Encryption for data protection.

Audit logs for security tracking.

2. Module-Wise Breakdown
Module 1: User Authentication & Role-Based Access
Purpose: Secure user login and restrict access based on user roles.

Roles: Admin (full control), User (limited access).

Integrate password hashing and role verification.

Module 2: Secure File Storage & Encryption
Purpose: Store files securely with encryption.

Encryption/Decryption using AES-256.

Prevent unauthorized file access.

Support file upload, download, and modification.

Module 3: Logging & Monitoring
Purpose: Track user activities and file operations.

Maintain logs of file access, modifications, and login attempts.

Implement logging mechanisms to detect security threats.

3. Functionalities
Module 1: User Authentication & Access Control
✅ User login with password hashing (bcrypt).
✅ Role-based access (Admin/User).
✅ Secure session handling (logout, timeout).
✅ Example: Only Admins can delete files, Users can only view.

Module 2: Secure File Handling
✅ AES-256 file encryption/decryption.
✅ Secure file upload, modification, and deletion.
✅ Example: A user uploads a document, it gets encrypted before storage.

Module 3: Logging & Monitoring
✅ Log all login attempts and file accesses.
✅ Track unauthorized access attempts.
✅ Example: If a user tries to access a restricted file, an alert is logged.

4. Technology Recommendations
Programming Languages
Python (for security and encryption)

C/C++ (for low-level OS interactions)

Bash Scripts (for OS-based security)

Libraries & Tools
Cryptography: pycryptodome (AES-256 encryption)

Authentication: bcrypt (password hashing)

Logging: logging module (log activities)

OS Access: os, shutil (file system operations)

GitHub/GitLab: For version control and collaboration

5. Execution Plan
Step 1: Setup Project Repository
Create a GitHub repo (SecureFileManager).

Define branches (main, dev, feature-auth, feature-encryption).

Step 2: Implement Authentication & Role Management
Use bcrypt for password hashing.

Create an access control list (ACL) for roles.

Implement session handling for login/logout.

Step 3: Develop Secure File Handling
Implement AES-256 encryption for file security.

Provide file upload/download options.

Ensure only authorized users can modify files.

Step 4: Add Logging & Security Audits
Track login attempts and file activities.

Generate alerts for unauthorized access.

Step 5: Testing & Deployment
Conduct unit testing for authentication & encryption.

Test with different user roles.

Deploy on a secure Linux server.

Team Contributions
Arman: Authentication, sorting, and viewing files

Rajat: File operations (CRUD), additional utilities

Taman: Security features, logging, and error handling

Features
User authentication (login system)

File operations: create, delete, rename, edit, and search

View and sort file content

Additional utilities: copy, move, append, and clear content

Logging and error handling
