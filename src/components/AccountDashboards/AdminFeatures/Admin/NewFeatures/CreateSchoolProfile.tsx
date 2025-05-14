import React, { useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";

export const CreateSchoolProfileProfile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Call API to create new school
    console.log(`Creating new school: ${name} - ${address}`);
  };

  return (
    <div>
      <h1>Create School</h1>
      {user?.role === "admin" ? (
        <form onSubmit={handleSubmit}>
          <label>
            Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Address:
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label>
            Logo URL:
            <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)} />
          </label>
          <button type="submit">Create</button>
        </form>
      ) : (
        <p>You do not have permission to create schools.</p>
      )}
    </div>
  );
};
