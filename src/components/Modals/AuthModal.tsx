import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Check,
  RefreshCw,
  X,
  LogOut,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { StorageService } from '../../services/storage';
import { ApiService } from '../../services/api';
import { UserProfile } from '../../types/manga';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

const AVATAR_PRESETS = [
  {
    name: 'Shadow Monarch',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pirate Captain',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Demon Hunter',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tokyo Ghoul',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sorcerer Supreme',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyber Samurai',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'google' | 'syncCode'>('custom');
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  // Form fields for custom sign-up / sign-in
  const [displayName, setDisplayName] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [showPassword, setShowPassword] = useState(false);

  // Sync Code State
  const [inputSyncCode, setInputSyncCode] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProfile = StorageService.getUserProfile();
  const isSignedIn = currentProfile.provider === 'google' || currentProfile.provider === 'email_password';

  // 1. Handle Custom Email/Username Registration
  const handleCustomSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const trimmedEmail = emailOrUsername.trim();
    const trimmedName = displayName.trim() || trimmedEmail.split('@')[0] || 'Manga Reader';

    if (!trimmedEmail) {
      setAuthError('Please enter an email address or username.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);

    try {
      // Construct a standardized email if user entered a plain username
      const effectiveEmail = trimmedEmail.includes('@')
        ? trimmedEmail.toLowerCase()
        : `${trimmedEmail.toLowerCase()}@riftreader.local`;

      let uid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      // Attempt Firebase Auth Email & Password registration
      try {
        const cred = await createUserWithEmailAndPassword(auth, effectiveEmail, password);
        uid = cred.user.uid;
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: trimmedName,
            photoURL: selectedAvatar,
          });
        }
      } catch (fbErr: any) {
        console.warn('Firebase email auth fallback:', fbErr?.code || fbErr?.message);
        // If email already in use in Firebase, notify user
        if (fbErr?.code === 'auth/email-already-in-use') {
          setAuthError('This email is already registered. Please switch to Sign In.');
          setIsLoading(false);
          return;
        }
        // If operation not allowed or offline, proceed with local account persistence
      }

      const syncCode = `RIFT-${Math.floor(1000 + Math.random() * 9000)}`;
      const newProfile: UserProfile = {
        id: uid,
        name: trimmedName,
        email: effectiveEmail,
        avatar: selectedAvatar,
        provider: 'email_password',
        syncCode,
        joinedAt: new Date().toISOString(),
        level: 1,
        xp: 250,
        isAgeVerified: true,
      };

      // Save locally
      StorageService.registerCustomUser({
        email: effectiveEmail,
        passwordHash: password, // For client-side session matching
        profile: newProfile,
      });

      // Save to Firestore if connected
      try {
        await setDoc(
          doc(db, 'users', uid),
          {
            userId: uid,
            email: effectiveEmail,
            displayName: trimmedName,
            photoURL: selectedAvatar,
            syncCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore user profile sync warning:', fsErr);
      }

      onProfileUpdate(newProfile);
      setAuthSuccess('Account created successfully! Welcome to Rift.');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create account. Please check your details.');
      setIsLoading(false);
    }
  };

  // 2. Handle Custom Email/Username Sign In
  const handleCustomSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const trimmedInput = emailOrUsername.trim();
    if (!trimmedInput || !password) {
      setAuthError('Please enter both your email/username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const effectiveEmail = trimmedInput.includes('@')
        ? trimmedInput.toLowerCase()
        : `${trimmedInput.toLowerCase()}@riftreader.local`;

      let loggedInProfile: UserProfile | null = null;

      // 1. Try Firebase Auth
      try {
        const cred = await signInWithEmailAndPassword(auth, effectiveEmail, password);
        const fbUser = cred.user;
        loggedInProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || trimmedInput.split('@')[0],
          email: fbUser.email || effectiveEmail,
          avatar: fbUser.photoURL || selectedAvatar,
          provider: 'email_password',
          syncCode: currentProfile.syncCode || `RIFT-${fbUser.uid.slice(0, 4).toUpperCase()}`,
          joinedAt: currentProfile.joinedAt || new Date().toISOString(),
          level: Math.max(currentProfile.level || 1, 2),
          xp: Math.max(currentProfile.xp || 150, 300),
          isAgeVerified: true,
        };
      } catch (fbErr: any) {
        console.warn('Firebase sign-in check, testing local account:', fbErr?.code);
        // Fall back to local registered account verification
        loggedInProfile = StorageService.authenticateCustomUser(trimmedInput, password);
      }

      if (!loggedInProfile) {
        // Double check local storage
        loggedInProfile = StorageService.authenticateCustomUser(trimmedInput, password);
      }

      if (!loggedInProfile) {
        setAuthError('Incorrect email/username or password. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      StorageService.saveUserProfile(loggedInProfile);
      onProfileUpdate(loggedInProfile);
      setAuthSuccess('Welcome back! Loading your reading list...');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setAuthError(err?.message || 'Sign in failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  // 3. Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const updatedProfile: UserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Manga Reader',
        email: fbUser.email || 'reader@rift.app',
        avatar: fbUser.photoURL || currentProfile.avatar,
        provider: 'google',
        syncCode: currentProfile.syncCode || `RIFT-${fbUser.uid.slice(0, 4).toUpperCase()}`,
        joinedAt: currentProfile.joinedAt || new Date().toISOString(),
        level: Math.max(currentProfile.level || 1, 2),
        xp: Math.max(currentProfile.xp || 100, 350),
        isAgeVerified: true,
      };

      StorageService.saveUserProfile(updatedProfile);
      onProfileUpdate(updatedProfile);

      try {
        await setDoc(
          doc(db, 'users', fbUser.uid),
          {
            userId: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Manga Reader',
            photoURL: fbUser.photoURL || '',
            syncCode: updatedProfile.syncCode,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore profile sync note:', fsErr);
      }

      onClose();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed. Please try again.');
      } else {
        setAuthError(err?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Sign Out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      const guestProfile: UserProfile = {
        id: `guest-${Math.random().toString(36).substring(2, 8)}`,
        name: 'Guest Reader',
        avatar: AVATAR_PRESETS[0].url,
        provider: 'guest',
        syncCode: `RIFT-${Math.floor(1000 + Math.random() * 9000)}`,
        joinedAt: new Date().toISOString(),
        level: 1,
        xp: 100,
        isAgeVerified: false,
      };
      StorageService.saveUserProfile(guestProfile);
      onProfileUpdate(guestProfile);
      setAuthSuccess('Signed out. Switched to Guest mode.');
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Sign out error:', err);
      setIsLoading(false);
    }
  };

  // 5. Handle Anonymous Sync Code Restore
  const handleSyncCodeRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSyncCode.trim()) return;

    setIsLoading(true);
    setSyncStatus(null);

    try {
      const data = await ApiService.restoreFromCloud(inputSyncCode.trim());
      if (data) {
        if (data.library) StorageService.saveLibrary(data.library);
        if (data.readingProgress) {
          localStorage.setItem('km_reading_progress', JSON.stringify(data.readingProgress));
        }
        if (data.settings) StorageService.saveSettings(data.settings);

        setSyncStatus('Reading state restored successfully!');
        setTimeout(() => {
          setIsLoading(false);
          onClose();
          window.location.reload();
        }, 1000);
      }
    } catch {
      setSyncStatus('Sync code linked for this session.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f1b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Reader Account & Cloud Sync</h2>
              <p className="text-xs text-slate-400">Sync library, bookmarks, and chapters across all devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('custom');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-rose-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('syncCode');
              setAuthError(null);
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'syncCode'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Sync Code</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Notifications */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              {authError}
            </div>
          )}
          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Current Signed In Status Box */}
          {isSignedIn && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={currentProfile.avatar}
                    alt={currentProfile.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-rose-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white">{currentProfile.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Level {currentProfile.level} Hunter
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{currentProfile.email || 'Email user'}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Sync ID: {currentProfile.syncCode}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700/80 text-rose-300 text-xs font-medium rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          )}

          {/* TAB 1: CUSTOM EMAIL & PASSWORD SIGN-UP / SIGN-IN (No Google required) */}
          {activeTab === 'custom' && !isSignedIn && (
            <div className="space-y-4">
              {/* Mode Toggle: Sign Up vs Sign In */}
              <div className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    authMode === 'signup'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Free Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    authMode === 'signin'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Notice for non-Google users */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  No Google account needed! Use any email address (Proton, Outlook, Yahoo, iCloud, custom) or reader handle.
                </span>
              </div>

              {/* Form */}
              <form onSubmit={authMode === 'signup' ? handleCustomSignUp : handleCustomSignIn} className="space-y-3.5">
                {/* Sign-Up: Display Name */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      Reader Handle / Nickname
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. SungJinWoo, ZoroFan, AnimeLover"
                        className="w-full px-3 py-2 pl-9 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                {/* Email or Username */}
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    {authMode === 'signup' ? 'Your Email Address' : 'Email or Username'}
                  </label>
                  <div className="relative">
                    <input
                      type={authMode === 'signup' ? 'email' : 'text'}
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder={authMode === 'signup' ? 'reader@proton.me, name@outlook.com, etc.' : 'Enter your registered email or username'}
                      required
                      className="w-full px-3 py-2 pl-9 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Avatar Picker (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1.5">
                      Choose Your Manga Avatar
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((avatar, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar.url)}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                            selectedAvatar === avatar.url
                              ? 'border-rose-500 scale-105 shadow-md shadow-rose-950/40'
                              : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                          title={avatar.name}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover rounded-lg" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full px-3 py-2 pl-9 pr-9 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 pl-9 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : authMode === 'signup' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Complete Registration & Start Reading</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Rift</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: GOOGLE ACCOUNT OPTION */}
          {activeTab === 'google' && !isSignedIn && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">Google Single Sign-On</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Sign in instantly with your Google account credentials to synchronize reading across browsers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-100 font-medium text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* TAB 3: ANONYMOUS 6-DIGIT SYNC CODE */}
          {activeTab === 'syncCode' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                  Your Current Device Code
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-white tracking-widest">
                    {currentProfile.syncCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentProfile.syncCode);
                      setSyncStatus('Copied code to clipboard!');
                      setTimeout(() => setSyncStatus(null), 2500);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Enter this code on your phone, iPad, or e-reader to immediately continue reading.
                </p>
              </div>

              <form onSubmit={handleSyncCodeRestore} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Restore from Another Device
                  </label>
                  <input
                    type="text"
                    value={inputSyncCode}
                    onChange={(e) => setInputSyncCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RIFT-8921"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !inputSyncCode.trim()}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Link and Restore Reading State</span>
                    </>
                  )}
                </button>
              </form>

              {syncStatus && (
                <div className="text-center text-xs text-emerald-400 font-medium py-1">
                  {syncStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
