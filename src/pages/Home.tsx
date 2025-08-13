import React from "react";
// import { KickingAnimation } from "../components/dotLottie";

const Home: React.FC = () => {
  return (
    <div className="relative h-screen bg-gray-100 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animate-bg flex justify-center items-center">
        {/* Martial Arts Symbols or Shapes */}
        <div className="circle bg-red-500"></div>
        <div className="circle bg-gray-700"></div>
        <div className="circle bg-white"></div>
      </div>

      {/* Main Content */}
      {/* <KickingAnimation /> */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-black">
        <h1 className="text-4xl font-bold text-red-500 mb-4 text-center">
          Welcome to Taekwondo Student Management App
        </h1>
        <p className="text-lg text-gray-700 text-center max-w-xl">
          Our app connects Taekwondo schools, instructors, students, and parents in a single
          platform. Stay updated with schedules, communicate seamlessly, and build a stronger
          community for your martial arts journey.
        </p>
        <div className="mt-6">
          <a
            href="/signup"
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl shadow-lg hover:bg-red-600 duration-300"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
