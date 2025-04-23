// utils/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from './axiosinstance';
import { getCurrentUser } from './authService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const id = (user._id || user.id).toString();
          setCurrentUserId(id);
        }
      } catch (error) {
        console.error('Error fetching current user in NotificationContext:', error);
      }
    })();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      const fetchedNotifications = response.data;
      const userNotifications = fetchedNotifications.filter((n) => {
        return (
          n.type === 'task_assigned' &&
          currentUserId &&
          n.recipient &&
          n.recipient.toString() === currentUserId
        );
      });
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  const addNotification = (notification) => {
    if (notification.type !== 'task_assigned') return;
    if (
      notification.recipient &&
      currentUserId &&
      notification.recipient.toString() !== currentUserId
    ) {
      return;
    }
    setNotifications((prev) => [
      {
        id: notification.id || Date.now(),
        timestamp: notification.timestamp || new Date(),
        read: false,
        ...notification,
      },
      ...prev,
    ]);
  };

  const markNotificationAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id || notif.id === id ? { ...notif, read: true } : notif))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== id && notif.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        fetchNotifications,
        markNotificationAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
