'use client';

import { useState } from 'react';
import Link from 'next/link';
import TransitionWrapper from '@/components/TransitionWrapper';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Validate + send form to API
    console.log('Register form:', form);
  };

  return (
    <TransitionWrapper>
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
        <div className="w-full max-w-sm bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-center mb-4">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium">Confirm Password</label>
              <input
                type="password"
                id="confirm"
                name="confirm"
                required
                value={form.confirm}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Sign Up
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </TransitionWrapper>
  );
}
