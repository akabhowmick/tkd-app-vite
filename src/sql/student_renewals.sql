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