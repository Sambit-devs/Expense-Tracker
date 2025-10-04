// frontend/src/App.jsx
import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, SignIn, SignUp } from '@clerk/clerk-react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ExpenseTrackerApp from './ExpenseTrackerApp';
import './App.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <BrowserRouter>
      <ClerkProvider publishableKey={clerkPubKey}>
        <Routes>
          {/* Main App Route */}
          <Route path="/" element={
            <React.Fragment>
              <SignedIn>
                <ExpenseTrackerApp />
              </SignedIn>
              <SignedOut>
                {/* Redirects to /sign-in if not authenticated */}
                <RedirectToSignIn /> 
              </SignedOut>
            </React.Fragment>
          } />
          {/* Clerk Auth Routes */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  );
}

export default App;