"use client";  // Mark this component as a client component

import { useEffect, useState } from "react";
import { BACKEND_IP } from './config'; // Ensure the path is correct

export default function Auth() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const authenticate = async () => {
      if (!isAuthed) {
        try {
          const username = prompt("Enter username:");
          const password = prompt("Enter password:");
          
          if (username && password) {
            const authResponse = await fetch(`${BACKEND_IP}/auth/${encodeURIComponent(username)}/${encodeURIComponent(password)}`);
            const authResult = await authResponse.json();

            if (authResult.status === "error") {
              setLoading(false);  // Stop loading
            } else {
              setIsAuthed(true); // User is authenticated
            }
          }
        } catch (error) {
          console.error("Authentication failed:", error);
        } finally {
          setLoading(false); // Set loading to false after authentication attempt
        }
      }
    };

    authenticate();
  }, [isAuthed]);

  if (loading) {
    return <div>Loading...</div>; // Render loading message
  }

  return isAuthed ? (
    <div>Welcome to the app!</div>
  ) : (
    <div>Not authenticated</div> // Fallback message if authentication fails
  );
}
