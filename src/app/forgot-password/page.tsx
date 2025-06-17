'use client';

import { useState } from 'react';
import Link from 'next/link';
import TransitionWrapper from '@/components/TransitionWrapper';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle actual password reset flow (email link etc.)
    setSubmitted(true);
  };

  return (
    <TransitionWrapper>
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-sm bg-white shadow-lg rounded-2xl p-6">
          {!submitted ? (
            <>
              <h2 className="text-xl font-semibold text-center mb-6">Forgot Password</h2>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Enter your email and we'll send you instructions to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-gray-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Check Your Email</h2>
              <p className="text-sm text-gray-600">
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </p>
            </div>
          )}

          <p className="text-center text-sm mt-4">
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </TransitionWrapper>
  );
}
