// Base User Interface (Shared properties)
export interface BaseUser {
  id: string; // Unique identifier
  name: string; // Full name of the user
  email: string; // Email address
  role: UserRole; // Role of the user: 'parent', 'student', or 'instructor'
  profilePicture?: string; // Optional profile picture URL
  createdAt: Date; // Account creation timestamp
}

// Enum for User Roles
export enum UserRole {
  Parent = "parent",
  Student = "student",
  Instructor = "instructor",
  
}

// Parent Interface
export interface Parent extends BaseUser {
  role: UserRole.Parent; // Role is fixed as 'parent'
  children: Student[]; // List of their children (students)
  contactNumber?: string; // Optional contact number
}

// Student Interface
export interface Student extends BaseUser {
  role: UserRole.Student; // Role is fixed as 'student'
  age: number; // Age of the student
  beltLevel: BeltLevel; // Taekwondo belt level
  parentId?: string; // Parent's ID (if applicable)
}

// Enum for Belt Levels
export enum BeltLevel {
  White = "White",
  Yellow = "Yellow",
  Green = "Green",
  Blue = "Blue",
  Red = "Red",
  Black = "Black",
}

// Instructor Interface
export interface Instructor extends BaseUser {
  role: UserRole.Instructor; // Role is fixed as 'instructor'
  certificationLevel: CertificationLevel; // Level of certification
  classesTaught: string[]; // List of class names or IDs the instructor teaches
  availability: Availability[]; // Weekly availability schedule
}

// Enum for Certification Levels
export enum CertificationLevel {
  Assistant = "Assistant",
  Certified = "Certified",
  Master = "Master",
  Grandmaster = "Grandmaster",
}

// Availability Type
export interface Availability {
  day: string; // e.g., "Monday", "Tuesday"
  startTime: string; // Start time in HH:mm format (e.g., "09:00")
  endTime: string; // End time in HH:mm format (e.g., "12:00")
}
