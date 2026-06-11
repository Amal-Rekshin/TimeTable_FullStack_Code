import React, { useState } from 'react';
import { notify } from "./Toast";
import * as api from '../utils/apiUtils';
import timetableHero from '../assets/timetable_auth_hero.png';

/* ── Icons ─────────────────────────────────────────────────── */
const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const MailIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const EyeIcon = ({ open }) => open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

/* ── Styled input ───────────────────────────────────────────── */
const IconInput = ({ icon, type, placeholder, value, onChange, required, rightEl }) => (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {icon}
        <input
            required={required}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 text-[15px] outline-none"
        />
        {rightEl}
    </div>
);

/* ═══════════════════════════════════════════════════════════ */
const AuthPage = () => {
    const [isLogin, setIsLogin]   = useState(true);
    const [loading, setLoading]   = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const response = await api.login({ email, password });
                // Store user info in localStorage for session persistence
                localStorage.setItem('user', JSON.stringify(response));
                notify.success('Logged in successfully!');
                // Reload to trigger App.jsx update
                window.location.reload();
            } else {
                await api.signup({ fullName, email, password });
                notify.success('Account created as Staff. Awaiting login.');
                setIsLogin(true); // Switch to login after signup
            }
        } catch (error) {
            notify.error(error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f0f4f8]">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* ── Left panel ── */}
                <div className="hidden md:flex md:w-1/2 flex-col items-start justify-between p-8 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #dce9f5 0%, #a5c9f0 100%)' }}>

                    {/* Brand */}
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-lg z-10">
                        <CalendarIcon />
                        <span>SMTEC Portal</span>
                    </div>

                    {/* Illustration */}
                    <div className="w-full flex items-center justify-center flex-1 py-4 z-10">
                        <img
                            src={timetableHero}
                            alt="Timetable Illustration"
                            className="w-[85%] max-w-[380px] object-contain"
                            style={{ filter: 'drop-shadow(0 20px 40px rgba(59,130,246,0.2))' }}
                        />
                    </div>

                    <div className="z-10 w-full mb-4">
                        <p className="text-blue-900 font-medium opacity-80 text-sm">Efficient Timetable Management for Modern Institutions</p>
                    </div>

                    {/* Decorative blobs */}
                    <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full opacity-30"
                        style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />
                    <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 rounded-full opacity-20"
                        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
                </div>

                {/* ── Right panel ── */}
                <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12 bg-white">

                    {/* Heading */}
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                            {isLogin ? 'Welcome Back!' : 'Create Account'}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {isLogin 
                                ? 'Kindly enter your credentials to access the portal' 
                                : 'Start managing your timetable in a few clicks'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Full Name (Signup only) */}
                        {!isLogin && (
                            <IconInput
                                icon={<UserIcon />}
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                            />
                        )}

                        {/* Email */}
                        <IconInput
                            icon={<MailIcon />}
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />

                        {/* Password */}
                        <IconInput
                            icon={<LockIcon />}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            rightEl={
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <EyeIcon open={showPassword} />
                                </button>
                            }
                        />

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-2 rounded-2xl font-bold text-white text-base shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 flex items-center justify-center bg-blue-600"
                        >
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : (isLogin ? 'Sign In' : 'Create Account')
                            }
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4 text-gray-300">
                        <div className="h-[1px] flex-1 bg-gray-100" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Or continue with</span>
                        <div className="h-[1px] flex-1 bg-gray-100" />
                    </div>

                    {/* Google Login */}
                    <a
                        href="https://timetable-fullstack-code.onrender.com/oauth2/authorization/google"
                        className="w-full py-3.5 border border-gray-100 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] no-underline"
                    >
                        <GoogleIcon />
                        <span>Google</span>
                    </a>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-gray-500">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-blue-600 font-bold hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </div>

                    <p className="mt-12 text-center text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                        Authorized Personnel Only • SMTEC Timetable Management
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
