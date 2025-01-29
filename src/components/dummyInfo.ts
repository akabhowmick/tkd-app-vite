import { Announcement, Class, School, User } from "../types/user";

export const users: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "johndoe@example.com",
    role: "admin",
  },
  {
    id: 2,
    name: "Janes Smith",
    email: "janesmith@example.cm",
    role: "instructor",
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bobjohnson@example.com",
    role: "instructor",
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alicebrown@example.com",
    role: "parent",
  },
  {
    id: 5,
    name: "Mike Davis",
    email: "mikedavis@example.com",
    role: "parent",
  },
  {
    id: 6,
    name: "Emily Chen",
    email: "emilychen@example.com",
    role: "student",
    parentId: 4,
  },
  {
    id: 7,
    name: "David Lee",
    email: "davidlee@example.com",
    role: "student",
    parentId: 5,
  },
];

export const schools: School[] = [
  {
    id: "1",
    name: "Taekwondo School",
    address: "123 Main St, Anytown, USA",
    createdAt: new Date(),
  },
];

export const classes: Class[] = [
  {
    id: 1,
    name: "Beginner's Class",
    startTime: "",
    endTime: "",
    schoolId: 1,
  },
  {
    id: 2,
    name: "Intermediate Class",
    startTime: "",
    endTime: "",
    schoolId: 1,
  },
];

export const announcements: Announcement[] = [
  {
    id: 1,
    title: "Upcoming Tournament",
    content: "We will be hosting a tournament on March 12th.",
    schoolId: 1,
  },
  {
    id: 2,
    title: "New Class Schedule",
    content: "We have updated our class schedule. Please check the website for more information.",
    schoolId: 1,
  },
];
