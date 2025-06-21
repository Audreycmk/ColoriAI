// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  imageUrl: string;
  createdAt: Date;
  lastSignInAt: Date | null;
  isAdmin?: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const setUserAsAdmin = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to set user as admin');
      }

      // Refresh the users list
      const usersResponse = await fetch('/api/admin/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      setUsers(usersData);
    } catch (err) {
      console.error('Error setting user as admin:', err);
      setError('Failed to set user as admin');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Refresh the users list
      const usersResponse = await fetch('/api/admin/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      setUsers(usersData);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleViewProfile = (user: UserData) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const handleHomeClick = () => {
    sessionStorage.setItem('skipAdminRedirect', 'true');
    router.push('/');
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) {
        console.log('Auth not loaded yet');
        return;
      }

      if (!isSignedIn) {
        console.log('User not signed in');
        router.push('/login');
        return;
      }

      try {
        console.log('Checking admin status...');
        // Check if user is admin
        const response = await fetch('/api/check-admin');
        const data = await response.json();
        console.log('Admin check response:', data);

        if (!data.isAdmin) {
          console.log('User is not admin, redirecting to home');
          router.push('/');
          return;
        }

        setIsAdmin(true);
        setUserName(data.firstName || 'Admin');

        // Fetch users
        console.log('Fetching users...');
        const usersResponse = await fetch('/api/admin/users');
        if (!usersResponse.ok) {
          console.error('Failed to fetch users:', await usersResponse.text());
          throw new Error('Failed to fetch users');
        }
        const usersData = await usersResponse.json();
        console.log('Users data received:', usersData);
        
        if (Array.isArray(usersData)) {
          console.log('Setting users:', usersData);
          // Sort users: admin first, then by name
          const sortedUsers = usersData.sort((a, b) => {
            // First sort by role (admin first)
            if (a.isAdmin && !b.isAdmin) return -1;
            if (!a.isAdmin && b.isAdmin) return 1;
            
            // Then sort by name (firstName + lastName)
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB);
          });
          setUsers(sortedUsers);
        } else {
          console.error('Users data is not an array:', usersData);
          setError('Invalid users data format');
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn, router]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center text-gray-800">
          <p className="text-xl font-semibold mb-2">Loading admin dashboard...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch user data.</p>
        </div>
      </div>
    );
  }
  

  if (!isAdmin) {
    return null; // Don't render anything while redirecting
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleHomeClick}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5DC]">
      {/* Header */}
      <header className="bg-white shadow" style={{ marginLeft: '50px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Colori Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {userName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleHomeClick}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                style={{ marginRight: '50px' }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8" style={{ marginLeft: '50px' }}>
    {/* Profile Card Modal */}
    {showProfile && selectedUser && (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-40">
        <div className="bg-[#FFFFFF] rounded-2xl shadow-xl p-8 min-w-[350px] w-[90%] max-w-md relative mx-auto my-8">
          {/* Close Button */}
          <button
            onClick={() => {
              setShowProfile(false);
              setSelectedUser(null);
            }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>

          {/* Header */}
          <div className="flex items-center space-x-4 mb-6" style={{ marginLeft: '40px' }}>
            <Image
              src={selectedUser.imageUrl}
              alt="User Avatar"
              width={64}
              height={64}
              className="rounded-full border border-gray-300"
            />
            <div>
              <p className="text-xl font-bold">{selectedUser.firstName} {selectedUser.lastName}</p>
              <p className="text-sm text-gray-500">@{selectedUser.username}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4" style={{ marginLeft: '60px' }}>
            <div>
              <p className="text-xs text-gray-500 font-bold">Email</p>
              <p className="text-sm text-gray-900">{selectedUser.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm text-gray-900">{selectedUser.isAdmin ? 'Admin' : 'User'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created At</p>
              <p className="text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Sign In</p>
              <p className="text-sm text-gray-900">
                {selectedUser.lastSignInAt
                  ? new Date(selectedUser.lastSignInAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )}





        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your application users and their permissions
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users && users.length > 0 ? (
                  users.map((user: UserData) => (
                    <tr key={user.id} className="hover:bg-gray-50" style={{ marginBottom: '80px' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <Image
                              src={user.imageUrl}
                              alt={`${user.firstName} ${user.lastName}`}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isAdmin 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        {!user.isAdmin && (
                          <>
                            <button
                              onClick={() => handleViewProfile(user)}
                              className="text-sm text-white bg-blue-500 hover:bg-blue-600 font-medium px-3 py-1 rounded"
                              style={{ marginRight: '10px' }}
                            >
                              View Profile
                            </button>
                            <Link href={`/report-history?userId=${user.id}`}>
                              <button 
                                className="text-sm text-white bg-blue-500 hover:bg-blue-600 font-medium px-3 py-1 rounded"
                                style={{ marginRight: '10px' }}
                              >
                                View Reports
                              </button>
                            </Link>
                            <button
                              onClick={() => setUserAsAdmin(user.id)}
                              className="text-sm text-white bg-green-500 hover:bg-green-600 font-medium px-3 py-1 rounded"
                              style={{ marginRight: '10px' }}
                            >
                              Make Admin
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="text-sm text-white bg-red-500 hover:bg-red-600 font-medium px-3 py-1 rounded"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {user.isAdmin && (
                          <button
                            onClick={() => handleViewProfile(user)}
                            className="text-sm text-white bg-blue-500 hover:bg-blue-600 font-medium px-3 py-1 rounded"
                          >
                            View Profile
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {selectedUser.firstName} {selectedUser.lastName}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}