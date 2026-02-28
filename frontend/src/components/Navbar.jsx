import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [followingFromNotif, setFollowingFromNotif] = useState({}); // Track follow state for notifications
  
  // Get user data from context instead of fetching
  const { userData, isLoggedIn, logout: contextLogout } = useUser();

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications/unread-count`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch unread count');
      
      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (loadingNotifications) return;
    
    setLoadingNotifications(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoadingNotifications(false);
        return;
      }
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications((data.notifications || []).slice(0, 10)); // Show only last 10
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to mark as read');
      
      // Update local state
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications/mark-all-read`,
        {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to mark all as read');
      
      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'follow' || notification.type === 'follow_back') {
      navigate(`/user/${notification.actor.id}`);
    } else if (notification.type === 'new_publication' && notification.reference_id) {
      navigate(`/paper/${notification.reference_id}`);
    }

    setNotificationDropdownOpen(false);
  };

  const handleFollowBackFromNotification = async (e, notification) => {
    e.stopPropagation(); // Prevent triggering handleNotificationClick
    
    if (!notification.actor) return;
    
    const actorId = notification.actor.id;
    setFollowingFromNotif(prev => ({
      ...prev,
      [actorId]: true
    }));

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/${actorId}/follow`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to follow user');
      }

      // Update notifications to reflect the follow action
      setNotifications(notifications.map(notif => 
        notif.actor?.id === actorId 
          ? { ...notif, isFollowing: true }
          : notif
      ));
    } catch (error) {
      console.error('Error following user from notification:', error);
    } finally {
      setFollowingFromNotif(prev => ({
        ...prev,
        [actorId]: false
      }));
    }
  };

  const deleteNotification = async (notificationId, wasUnread, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete notification');
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const toggleNotificationDropdown = () => {
    if (!notificationDropdownOpen) {
      fetchNotifications();
    }
    setNotificationDropdownOpen(!notificationDropdownOpen);
  };

  const handleAboutClick = () => {
    if (location.pathname === '/') {
      const featuresSection = document.getElementById('features-section');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#features');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/register');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleUserClick = () => {
    toggleDropdown();
  };

  const handleLogout = () => {
    // Use context logout function
    contextLogout();
    setDropdownOpen(false);
    
    // Navigate to home WITHOUT reload - this prevents glitching
    navigate('/');
  };

  const handleLibraryClick = () => {
    navigate('/library');
    setDropdownOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notifTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notifTime.toLocaleDateString();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.user-dropdown-container');
      const userIcon = document.querySelector('.user-icon');
      const notifDropdown = document.querySelector('.notification-dropdown-container');
      const notifBell = document.querySelector('.notification-bell');
      
      if (dropdownOpen && dropdown && userIcon && 
          !dropdown.contains(event.target) && 
          !userIcon.contains(event.target)) {
        setDropdownOpen(false);
      }

      if (notificationDropdownOpen && notifDropdown && notifBell &&
          !notifDropdown.contains(event.target) &&
          !notifBell.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, notificationDropdownOpen]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        backgroundColor: "#3E513E",
        color: "#fff",
        padding: "16px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* LEFT - Logo */}
      <div 
        style={{ fontSize: "24px", fontWeight: "bold", cursor: "pointer" }}
        onClick={() => navigate('/')}
      >
        NOVARA
      </div>

      {/* RIGHT - Navigation Items */}
      <div style={{ display: "flex", gap: "24px", fontSize: "16px", alignItems: "center" }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate('/search')}>Search</span>
        <span style={{ cursor: "pointer" }} onClick={handleAboutClick}>About</span>
        
        {/* Conditional rendering based on login state */}
        {!isLoggedIn ? (
          <>
            <span style={{ cursor: "pointer" }} onClick={handleLogin}>Sign In</span>
            <span style={{ cursor: "pointer" }} onClick={handleSignUp}>Create Account</span>
          </>
        ) : (
          <>
            {/* Notification Bell */}
            <div className="notification-dropdown-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <div
                className="notification-bell"
                onClick={toggleNotificationDropdown}
                style={{
                  cursor: "pointer",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                title="Notifications"
              >
                {/* Bell Icon SVG */}
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
                    stroke="#fff" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
                    stroke="#fff" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      backgroundColor: "#dc3545",
                      color: "#fff",
                      borderRadius: "50%",
                      minWidth: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                      padding: "0 4px",
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>

              {/* Notification Dropdown */}
              {notificationDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: 0,
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    width: "360px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    zIndex: 1001,
                    animation: "fadeIn 0.2s ease",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid #f0f0f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                      Notifications
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          fontSize: "13px",
                          color: "#3E513E",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div>
                    {loadingNotifications ? (
                      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                        <svg 
                          width="48" 
                          height="48" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ margin: "0 auto 12px" }}
                        >
                          <path 
                            d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
                            stroke="#ccc" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                          <path 
                            d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
                            stroke="#ccc" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div>No notifications yet</div>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f0f0f0",
                            cursor: "pointer",
                            backgroundColor: notification.is_read ? "#fff" : "#f0f8ff",
                            transition: "background-color 0.2s",
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? "#f9f9f9" : "#e6f3ff"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? "#fff" : "#f0f8ff"}
                        >
                          {/* Actor Profile Picture */}
                          {notification.actor && (
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: notification.actor.profile_picture_url ? "transparent" : "#e0e0e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                            >
                              {notification.actor.profile_picture_url ? (
                                <img
                                  src={notification.actor.profile_picture_url}
                                  alt={notification.actor.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <svg 
                                  width="20" 
                                  height="20" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path 
                                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                                    stroke="#999" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                  <path 
                                    d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" 
                                    stroke="#999" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                          )}

                          {/* Notification Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#333",
                                marginBottom: "4px",
                                lineHeight: "1.4",
                              }}
                            >
                              {notification.message}
                            </div>
                            <div style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>
                              {formatNotificationTime(notification.created_at)}
                            </div>
                            
                            {/* Follow Back Button - only for initial follow notifications, not if already following */}
                            {notification.type === 'follow' && notification.actor && !notification.isFollowing && (
                              <button
                                onClick={(e) => handleFollowBackFromNotification(e, notification)}
                                disabled={followingFromNotif[notification.actor.id]}
                                style={{
                                  padding: "6px 12px",
                                  backgroundColor: "#3E513E",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  cursor: followingFromNotif[notification.actor.id] ? "not-allowed" : "pointer",
                                  opacity: followingFromNotif[notification.actor.id] ? 0.6 : 1,
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  if (!followingFromNotif[notification.actor.id]) {
                                    e.target.style.backgroundColor = "#2d3f2d";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!followingFromNotif[notification.actor.id]) {
                                    e.target.style.backgroundColor = "#3E513E";
                                  }
                                }}
                              >
                                {followingFromNotif[notification.actor.id] ? "Following..." : "Follow Back"}
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0, marginTop: 6 }}>
                            {/* Delete (bin) button */}
                            <button
                              onClick={(e) => deleteNotification(notification.id, !notification.is_read, e)}
                              title="Delete notification"
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                                transition: 'color 0.15s ease, background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                e.currentTarget.style.color = '#d32f2f';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#999';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>

                            {/* Unread Indicator */}
                            {!notification.is_read && (
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#3E513E",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="user-dropdown-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
              {/* User icon */}
              <div 
                className="user-icon"
                onClick={handleUserClick}
                style={{
                  cursor: "pointer",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: userData.profile_picture_url ? "transparent" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  border: userData.profile_picture_url ? "2px solid #fff" : "none",
                }}
                title="User Profile"
              >
                {userData.profile_picture_url ? (
                  <img 
                    src={userData.profile_picture_url} 
                    alt={userData.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      // Fallback to default icon if image fails to load
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  /* Simple user icon using SVG */
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" 
                      stroke="#3E513E" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path 
                      d="M20 21C20 18.8783 19.1571 16.8434 17.6569 15.3431C16.1566 13.8429 14.1217 13 12 13C9.87827 13 7.84344 13.8429 6.34315 15.3431C4.84285 16.8434 4 18.8783 4 21" 
                      stroke="#3E513E" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              
              {/* Dropdown menu - controlled by state */}
              {dropdownOpen && (
                <div 
                  className="user-dropdown"
                  style={{
                    position: "absolute",
                    top: "50px",
                    right: 0,
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    minWidth: "160px",
                    padding: "8px 0",
                    zIndex: 1001,
                    animation: "fadeIn 0.2s ease",
                  }}
                >
                  <div style={{
                    padding: "10px 16px",
                    color: "#333",
                    fontSize: "14px",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: "600",
                  }}>
                    {userData.name}
                  </div>
                  
                  <div 
                    style={{
                      padding: "8px 16px",
                      color: "#666",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    onClick={handleProfileClick}
                  >
                    Profile
                  </div>
                  
                  {/* My Library option */}
                  <div 
                    style={{
                      padding: "8px 16px",
                      color: "#666",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    onClick={handleLibraryClick}
                  >
                    My Library
                  </div>
                  
                  <div 
                    style={{
                      padding: "8px 16px",
                      color: "#d32f2f",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      borderTop: "1px solid #f0f0f0",
                      marginTop: "4px",
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = "#ffebee"}
                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    onClick={handleLogout}
                  >
                    Logout
                  </div>
                </div>
              )}
              
              {/* CSS for fadeIn animation */}
              <style>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-10px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;