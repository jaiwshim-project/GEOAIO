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

export interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
}

export interface UserProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  company_name?: string;
  representative_name?: string;
  region?: string;
  created_at?: string;
  files?: ProjectFile[];
}

interface UserContextType {
  currentUser: UserProfile | null;
  selectedProject: UserProject | null;
  geminiApiKey: string;
  initialized: boolean;
  setCurrentUser: (user: UserProfile | null) => void;
  setSelectedProject: (project: UserProject | null) => void;
  setGeminiApiKey: (key: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  selectedProject: null,
  geminiApiKey: '',
  initialized: false,
  setCurrentUser: () => {},
  setSelectedProject: () => {},
  setGeminiApiKey: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [selectedProject, setSelectedProjectState] = useState<UserProject | null>(null);
  const [geminiApiKey, setGeminiApiKeyState] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('geoaio_user');
      const storedProject = sessionStorage.getItem('geoaio_project');
      if (storedUser) setCurrentUserState(JSON.parse(storedUser));
      if (storedProject) setSelectedProjectState(JSON.parse(storedProject));
    } catch {}
    // Gemini 키는 localStorage에서 로드 (인증 불필요)
    try {
      const key = localStorage.getItem('geoaio_gemini_key');
      if (key) setGeminiApiKeyState(key);
    } catch {}
    setInitialized(true);
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

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    try {
      if (key) localStorage.setItem('geoaio_gemini_key', key);
      else localStorage.removeItem('geoaio_gemini_key');
    } catch {}
  };

  const logout = () => setCurrentUser(null);

  return (
    <UserContext.Provider value={{ currentUser, selectedProject, geminiApiKey, initialized, setCurrentUser, setSelectedProject, setGeminiApiKey, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
