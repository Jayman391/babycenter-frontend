import { useEffect, useState } from "react";

export default function Auth() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const authenticate = async () => {
      if (!isAuthed) {
        try {
          const username = prompt("Enter username:");
          const password = prompt("Enter password:");
          
          const authResponse = await fetch(`http://127.0.0.1:5328/auth/${username}/${password}`);
          const authResult = await authResponse.json();

          if (authResult.status === "error") {
            setLoading(false);  // Stop loading
            window.close(); // Close the window
          } else {
            setIsAuthed(true); // User is authenticated
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
};
