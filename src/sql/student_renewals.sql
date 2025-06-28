CREATE TABLE student_renewals (
    renewal_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    duration_months INT,
    payment_date DATE,
    expiration_date DATE,
    amount_due DECIMAL(10,2),
    amount_paid DECIMAL(10,2),
    number_of_payments INT DEFAULT 1,
    number_of_classes INT,
    paid_to VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Student Renewals Dummy Data
-- Note: Using integer student_id (1-31) mapped from the original UUID student IDs

INSERT INTO student_renewals (student_id, duration_months, payment_date, expiration_date, amount_due, amount_paid, number_of_payments, number_of_classes, paid_to, created_at, updated_at) VALUES
-- Liam Smith (student_id: 1)
(1, 6, '2025-01-15', '2025-07-15', 450.00, 450.00, 1, 24, 'Online Payment', '2025-01-15 10:30:00', '2025-01-15 10:30:00'),
(1, 3, '2025-07-10', '2025-10-10', 225.00, 225.00, 1, 12, 'Credit Card', '2025-07-10 14:20:00', '2025-07-10 14:20:00'),

-- Olivia Brown (student_id: 2)
(2, 12, '2024-12-01', '2025-12-01', 800.00, 800.00, 1, 48, 'Bank Transfer', '2024-12-01 09:15:00', '2024-12-01 09:15:00'),

-- Noah Davis (student_id: 3)
(3, 3, '2025-02-20', '2025-05-20', 240.00, 240.00, 1, 12, 'Cash', '2025-02-20 16:45:00', '2025-02-20 16:45:00'),
(3, 6, '2025-05-15', '2025-11-15', 480.00, 240.00, 2, 24, 'Payment Plan', '2025-05-15 11:30:00', '2025-05-15 11:30:00'),

-- Ava Wilson (student_id: 4)
(4, 9, '2025-01-08', '2025-10-08', 675.00, 675.00, 1, 36, 'Online Payment', '2025-01-08 13:20:00', '2025-01-08 13:20:00'),

-- Elijah Miller (student_id: 5)
(5, 6, '2025-03-01', '2025-09-01', 420.00, 420.00, 1, 24, 'Credit Card', '2025-03-01 10:15:00', '2025-03-01 10:15:00'),

-- Sophia Moore (student_id: 6)
(6, 12, '2024-11-15', '2025-11-15', 900.00, 450.00, 4, 48, 'Monthly Payment Plan', '2024-11-15 15:30:00', '2024-11-15 15:30:00'),

-- James Taylor (student_id: 7)
(7, 3, '2025-04-10', '2025-07-10', 210.00, 210.00, 1, 12, 'Cash', '2025-04-10 12:45:00', '2025-04-10 12:45:00'),

-- Isabella Anderson (student_id: 8)
(8, 6, '2025-02-05', '2025-08-05', 450.00, 450.00, 1, 24, 'Bank Transfer', '2025-02-05 14:10:00', '2025-02-05 14:10:00'),

-- Benjamin Thomas (student_id: 9)
(9, 9, '2025-01-20', '2025-10-20', 630.00, 630.00, 1, 36, 'Online Payment', '2025-01-20 11:25:00', '2025-01-20 11:25:00'),

-- Mia Jackson (student_id: 10)
(10, 3, '2025-05-01', '2025-08-01', 225.00, 225.00, 1, 12, 'Credit Card', '2025-05-01 09:40:00', '2025-05-01 09:40:00'),

-- Lucas White (student_id: 11)
(11, 12, '2024-10-01', '2025-10-01', 840.00, 840.00, 1, 48, 'Annual Payment', '2024-10-01 16:20:00', '2024-10-01 16:20:00'),

-- Charlotte Harris (student_id: 12)
(12, 6, '2025-03-15', '2025-09-15', 480.00, 240.00, 2, 24, 'Bi-annual Payment', '2025-03-15 13:50:00', '2025-03-15 13:50:00'),

-- Henry Martin (student_id: 13)
(13, 3, '2025-04-20', '2025-07-20', 195.00, 195.00, 1, 12, 'Cash', '2025-04-20 10:35:00', '2025-04-20 10:35:00'),

-- Amelia Thompson (student_id: 14)
(14, 9, '2025-01-10', '2025-10-10', 720.00, 720.00, 1, 36, 'Online Payment', '2025-01-10 15:15:00', '2025-01-10 15:15:00'),

-- Alexander Garcia (student_id: 15)
(15, 6, '2025-02-28', '2025-08-28', 420.00, 420.00, 1, 24, 'Credit Card', '2025-02-28 12:05:00', '2025-02-28 12:05:00'),

-- Harper Martinez (student_id: 16)
(16, 12, '2024-12-15', '2025-12-15', 960.00, 320.00, 3, 48, 'Quarterly Payment', '2024-12-15 14:40:00', '2024-12-15 14:40:00'),

-- Sebastian Robinson (student_id: 17)
(17, 3, '2025-05-10', '2025-08-10', 240.00, 240.00, 1, 12, 'Bank Transfer', '2025-05-10 11:55:00', '2025-05-10 11:55:00'),

-- Evelyn Clark (student_id: 18)
(18, 6, '2025-01-25', '2025-07-25', 450.00, 450.00, 1, 24, 'Online Payment', '2025-01-25 16:30:00', '2025-01-25 16:30:00'),

-- Jack Rodriguez (student_id: 19)
(19, 9, '2025-03-05', '2025-12-05', 675.00, 675.00, 1, 36, 'Credit Card', '2025-03-05 09:20:00', '2025-03-05 09:20:00'),

-- Abigail Lewis (student_id: 20)
(20, 3, '2025-04-15', '2025-07-15', 210.00, 210.00, 1, 12, 'Cash', '2025-04-15 13:25:00', '2025-04-15 13:25:00'),

-- Owen Lee (student_id: 21)
(21, 12, '2024-11-01', '2025-11-01', 800.00, 800.00, 1, 48, 'Annual Payment', '2024-11-01 10:45:00', '2024-11-01 10:45:00'),

-- Emily Walker (student_id: 22)
(22, 6, '2025-02-12', '2025-08-12', 480.00, 160.00, 3, 24, 'Monthly Payment Plan', '2025-02-12 15:10:00', '2025-02-12 15:10:00'),

-- Daniel Hall (student_id: 23)
(23, 3, '2025-05-05', '2025-08-05', 225.00, 225.00, 1, 12, 'Bank Transfer', '2025-05-05 12:15:00', '2025-05-05 12:15:00'),

-- Elizabeth Allen (student_id: 24)
(24, 9, '2025-01-30', '2025-10-30', 630.00, 630.00, 1, 36, 'Online Payment', '2025-01-30 14:25:00', '2025-01-30 14:25:00'),

-- Matthew Young (student_id: 25)
(25, 6, '2025-03-20', '2025-09-20', 420.00, 420.00, 1, 24, 'Credit Card', '2025-03-20 11:40:00', '2025-03-20 11:40:00'),

-- Sofia Hernandez (student_id: 26)
(26, 12, '2024-12-10', '2025-12-10', 840.00, 420.00, 2, 48, 'Semi-annual Payment', '2024-12-10 16:55:00', '2024-12-10 16:55:00'),

-- Jackson King (student_id: 27)
(27, 3, '2025-04-25', '2025-07-25', 195.00, 195.00, 1, 12, 'Cash', '2025-04-25 09:30:00', '2025-04-25 09:30:00'),

-- Avery Wright (student_id: 28)
(28, 6, '2025-02-18', '2025-08-18', 450.00, 450.00, 1, 24, 'Bank Transfer', '2025-02-18 13:05:00', '2025-02-18 13:05:00'),

-- Scarlett Lopez (student_id: 29)
(29, 9, '2025-01-12', '2025-10-12', 720.00, 720.00, 1, 36, 'Online Payment', '2025-01-12 15:45:00', '2025-01-12 15:45:00'),

-- Emma Johanson (student_id: 30)
(30, 3, '2025-05-15', '2025-08-15', 240.00, 240.00, 1, 12, 'Credit Card', '2025-05-15 10:20:00', '2025-05-15 10:20:00'),

-- Rickie Hodkiewicz (student_id: 31)
(31, 6, '2025-06-01', '2025-12-01', 480.00, 0.00, 1, 24, 'Pending Payment', '2025-06-01 12:30:00', '2025-06-01 12:30:00');

-- Summary of the data:
-- - 33 renewal records for 31 students
-- - Duration ranges from 3 to 12 months
-- - Amount due ranges from $195 to $960
-- - Various payment methods and schedules
-- - Mix of fully paid, partially paid, and unpaid renewals
-- - Number of classes corresponds to duration (4 classes per month average)
-- - Payment dates spread across different months in 2024-2025