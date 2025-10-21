/**
 * User Layout Component
 * 
 * Provides the layout structure for user-specific pages including
 * user navigation, account sidebar, and content areas
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { unifiedAuthService } from '../services/authService.js';
import { getNavigationItems, RouteCategories, getBreadcrumbs } from '../config/routeConfig.js';

const UserLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(unifiedAuthService.getCurrentUser());

  // Get user navigation items
  const userNavItems = getNavigationItems(RouteCategories.USER);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  const handleLogout = async () => {
    try {
      await unifiedAuthService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TV</span>
                </div>
                <span className="text-xl font-bold text-gray-900">TechVerse</span>
              </Link>

              {/* Desktop navigation */}
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Home
                </Link>
                <Link to="/category" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Categories
                </Link>
                <Link to="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Contact
                </Link>
              </nav>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link
                to="/cart"
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </Link>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* User menu - Desktop */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* User info */}
              <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {user?.firstName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4 space-y-1">
                {userNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      {item.icon && (
                        <span className="flex-shrink-0">
                          {/* Icon would be rendered here based on item.icon */}
                          <div className="w-5 h-5 bg-gray-400 rounded"></div>
                        </span>
                      )}
                      <span>{item.title}</span>
                    </Link>
                  );
                })}

                {/* Additional user actions */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Link
                    to="/user/settings"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 1 && (
              <div className="mb-6">
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={crumb.path} className="flex items-center">
                        {index > 0 && (
                          <svg className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                        {crumb.active ? (
                          <span className="text-sm font-medium text-gray-500">
                            {crumb.title}
                          </span>
                        ) : (
                          <Link
                            to={crumb.path}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {crumb.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            )}

            {/* Page content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-96">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default UserLayout;