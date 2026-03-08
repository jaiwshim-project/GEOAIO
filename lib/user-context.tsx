'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  username: string;
  company_name?: string;
  service_name?: string;
  phone?: string;
  email?: string;
}

export interface UserProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

interface UserContextType {
  currentUser: UserProfile | null;
  selectedProject: UserProject | null;
  setCurrentUser: (user: UserProfile | null) => void;
  setSelectedProject: (project: UserProject | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  selectedProject: null,
  setCurrentUser: () => {},
  setSelectedProject: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [selectedProject, setSelectedProjectState] = useState<UserProject | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('geoaio_user');
    const storedProject = sessionStorage.getItem('geoaio_project');
    if (storedUser) {
      try { setCurrentUserState(JSON.parse(storedUser)); } catch {}
    }
    if (storedProject) {
      try { setSelectedProjectState(JSON.parse(storedProject)); } catch {}
    }
  }, []);

  const setCurrentUser = (user: UserProfile | null) => {
    setCurrentUserState(user);
    if (user) sessionStorage.setItem('geoaio_user', JSON.stringify(user));
    else {
      sessionStorage.removeItem('geoaio_user');
      sessionStorage.removeItem('geoaio_project');
      setSelectedProjectState(null);
    }
  };

  const setSelectedProject = (project: UserProject | null) => {
    setSelectedProjectState(project);
    if (project) sessionStorage.setItem('geoaio_project', JSON.stringify(project));
    else sessionStorage.removeItem('geoaio_project');
  };

  const logout = () => setCurrentUser(null);

  return (
    <UserContext.Provider value={{ currentUser, selectedProject, setCurrentUser, setSelectedProject, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
