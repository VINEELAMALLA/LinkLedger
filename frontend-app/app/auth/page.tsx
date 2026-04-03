'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const router = useRouter()

  const isExistingUser = email.toLowerCase() === 'vineelamalla1407@gmail.com'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Special case for existing user with data
    if (email.toLowerCase() === 'vineelamalla1407@gmail.com') {
      localStorage.setItem('userEmail', 'vineelamalla1407@gmail.com')
      router.push('/')
      return
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '{}')
    
    if (mode === 'signup') {
      // Sign up
      if (users[email.toLowerCase()]) {
        alert('User already exists. Please sign in instead.')
        setMode('signin')
        return
      }
      users[email.toLowerCase()] = { password }
      localStorage.setItem('users', JSON.stringify(users))
      localStorage.setItem('userEmail', email.toLowerCase())
      router.push('/')
    } else {
      // Sign in
      if (!users[email.toLowerCase()]) {
        alert('User not found. Please sign up first.')
        setMode('signup')
        return
      }
      if (users[email.toLowerCase()].password !== password) {
        alert('Invalid password.')
        return
      }
      localStorage.setItem('userEmail', email.toLowerCase())
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isExistingUser ? 'Welcome Back' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isExistingUser ? 'Enter your email to access your existing data.' : (mode === 'signin' ? 'Welcome back! Enter your credentials.' : 'Create an account. Enter your details.')}
          </p>
        </div>
        {!isExistingUser && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setMode('signin')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {!isExistingUser && (
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required={!isExistingUser}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isExistingUser ? 'Continue' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}