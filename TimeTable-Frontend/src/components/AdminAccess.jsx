import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { notify } from './Toast';
import * as api from '../utils/apiUtils';

/* ─── constants ───────────────────────────────────────────── */
const ROLES = ['hod', 'staff'];

const ROLE_BADGE = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    hod: 'bg-purple-100 text-purple-700 border-purple-200',
    staff: 'bg-blue-100 text-blue-700 border-blue-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse',
};

const DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SETTINGS = {
    academicYear: '2025-2026',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodsPerDay: 7,
    periodDuration: 50,
    breaks: [
        { name: 'Short Break', afterPeriod: 2, duration: 15 },
        { name: 'Lunch Break', afterPeriod: 5, duration: 55 },
    ],
    maxPeriodsPerStaff: 5,
    allowContinuousDoubles: true,
};

const TAB = {
    USERS: 'users'
    , SETTINGS: 'settings'
};

/* ═══════════════════════════════════════════════════════════ */
const AdminAccess = ({ currentUser, systemSettings, setSystemSettings }) => {
    const [tab, setTab] = useState(TAB.USERS);
    // Notifications handled by notify utility

    /* ── User Management ── */
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [updatingUid, setUpdatingUid] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    /* ── System Settings ── */
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);

    /* ── Load users ── */
    useEffect(() => {
        if (tab !== TAB.USERS) return;
        const load = async () => {
            setUsersLoading(true);
            try {
                const fetchedUsers = await api.fetchUsers();
                // Map backend fields to frontend UI expectation
                const mappedUsers = fetchedUsers.map(u => ({
                    uid: u.id,
                    displayName: u.fullName,
                    email: u.email,
                    role: u.role
                }));
                setUsers(mappedUsers);
            } catch {
                notify.error('Failed to load users from backend.', { variant: 'error' });
            } finally {
                setUsersLoading(false);
            }
        };
        load();
    }, [tab]);

    /* ── Load settings ── */
    useEffect(() => {
        if (tab !== TAB.SETTINGS) return;
        const load = async () => {
            setSettingsLoading(true);
            try {
                const snap = await getDoc(doc(db, 'settings', 'timetableConfig'));
                if (snap.exists()) setSettings(prev => ({ ...prev, ...snap.data() }));
            } catch {
                notify.error('Failed to load settings.', { variant: 'error' });
            } finally {
                setSettingsLoading(false);
            }
        };
        load();
    }, [tab]);

    /* ── Update role ── */
    const updateRole = async (userId, newRole) => {
        setUpdatingUid(userId);
        try {
            await api.updateRole(userId, newRole);
            setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
            notify.success(`Role updated to ${newRole}!`);
        } catch (error) {
            notify.error('Failed to update role on server.', { variant: 'error' });
        } finally {
            setUpdatingUid(null);
        }
    };

    /* ── Save settings ── */
    const saveSettings = async () => {
        setSettingsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'timetableConfig'), settings);
            notify.success('Settings saved!');
        } catch {
            notify.error('Failed to save settings.', { variant: 'error' });
        } finally {
            setSettingsSaving(false);
        }
    };

    /* ── Helpers ── */
    const addBreak = () =>
        setSettings(s => ({ ...s, breaks: [...s.breaks, { name: '', afterPeriod: 1, duration: 15 }] }));

    const updateBreak = (i, field, value) =>
        setSettings(s => {
            const breaks = [...s.breaks];
            breaks[i] = { ...breaks[i], [field]: field === 'name' ? value : Number(value) };
            return { ...s, breaks };
        });

    const removeBreak = i =>
        setSettings(s => ({ ...s, breaks: s.breaks.filter((_, idx) => idx !== i) }));

    const toggleDay = day =>
        setSettings(s => ({
            ...s,
            workingDays: s.workingDays.includes(day)
                ? s.workingDays.filter(d => d !== day)
                : [...s.workingDays, day],
        }));

    const filteredUsers = users.filter(u =>
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🛡️</span>
                    <h2 className="text-2xl font-black text-gray-800">Admin Control Panel</h2>
                </div>
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 text-sm mt-3">
                    Welcome, <strong>{currentUser?.displayName || currentUser?.email}</strong>. You have full administrator privileges.
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border w-fit">
                {[
                    { key: TAB.USERS, label: '👤 User Management' },
                    { key: TAB.SETTINGS, label: '⚙️ System Settings' },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-100'
                            }`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── USER MANAGEMENT ── */}
            {tab === TAB.USERS && (
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Registered Users</h3>
                            <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="border rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    {usersLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <p className="text-center text-gray-400 py-16 text-sm">No users found.</p>
                    ) : (
                        <div className="divide-y">
                            {filteredUsers.map(user => (
                                <div key={user.uid}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                            {(user.displayName || user.email || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 text-sm">
                                                {user.displayName || <span className="italic text-gray-400">No name</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-black border ${ROLE_BADGE[user.role] || 'bg-gray-100 text-gray-500'}`}>
                                            {user.role || 'no role'}
                                        </span>

                                        <select
                                            value={user.role || ''}
                                            disabled={updatingUid === user.uid}
                                            onChange={e => updateRole(user.uid, e.target.value)}
                                            className="border rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
                                        >
                                            <option value="" disabled>Assign role…</option>
                                            {ROLES.map(r => (
                                                <option key={r} value={r}>
                                                    {r === 'hod' ? 'HOD' : 'Staff'}
                                                </option>
                                            ))}
                                        </select>

                                        {updatingUid === user.uid && (
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── SYSTEM SETTINGS ── */}
            {tab === TAB.SETTINGS && (
                <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-8">
                    {settingsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            <Section title="🎓 Academic Year" desc="Label used across exports and archives.">
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-gray-600 font-medium w-28">Year Label</label>
                                    <input type="text" value={settings.academicYear} placeholder="e.g. 2024-25"
                                        onChange={e => setSettings(s => ({ ...s, academicYear: e.target.value }))}
                                        className="border rounded-xl px-4 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                </div>
                            </Section>

                            <Section title="📅 Working Days" desc="Select the days on which classes are held.">
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OPTIONS.map(day => (
                                        <button key={day} onClick={() => toggleDay(day)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${settings.workingDays.includes(day)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                                }`}>
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{settings.workingDays.length} day{settings.workingDays.length !== 1 ? 's' : ''} selected</p>
                            </Section>

                            <Section title="⏱️ Period Configuration" desc="Number of class periods per day and their duration.">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <NumberField label="Periods per Day" value={settings.periodsPerDay} min={1} max={12} onChange={v => setSettings(s => ({ ...s, periodsPerDay: v }))} />
                                    <NumberField label="Period Duration (min)" value={settings.periodDuration} min={30} max={90} onChange={v => setSettings(s => ({ ...s, periodDuration: v }))} />
                                    <NumberField label="Max Periods / Staff / Day" value={settings.maxPeriodsPerStaff} min={1} max={10} onChange={v => setSettings(s => ({ ...s, maxPeriodsPerStaff: v }))} />
                                </div>
                            </Section>

                            <Section title="☕ Break Slots" desc="Named breaks inserted after a specific period.">
                                <div className="space-y-3">
                                    {settings.breaks.map((br, i) => (
                                        <div key={i} className="flex flex-wrap items-center gap-3 bg-gray-50 rounded-xl p-3 border">
                                            <input type="text" placeholder="Break name" value={br.name}
                                                onChange={e => updateBreak(i, 'name', e.target.value)}
                                                className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>After period</span>
                                                <input type="number" min={1} max={settings.periodsPerDay - 1} value={br.afterPeriod}
                                                    onChange={e => updateBreak(i, 'afterPeriod', e.target.value)}
                                                    className="border rounded-lg px-2 py-1.5 w-14 text-center focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>Duration</span>
                                                <input type="number" min={5} max={90} value={br.duration}
                                                    onChange={e => updateBreak(i, 'duration', e.target.value)}
                                                    className="border rounded-lg px-2 py-1.5 w-14 text-center focus:outline-none focus:ring-2 focus:ring-blue-200" />
                                                <span>min</span>
                                            </div>
                                            <button onClick={() => removeBreak(i)}
                                                className="text-red-400 hover:text-red-600 text-xl font-bold px-1 transition-colors">×</button>
                                        </div>
                                    ))}
                                    <button onClick={addBreak}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                                        + Add Break Slot
                                    </button>
                                </div>
                            </Section>

                            <Section title="🤖 Timetable Engine" desc="Behaviour rules for the auto-generation algorithm.">
                                <label className="flex items-center gap-3 cursor-pointer w-fit">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer"
                                            checked={settings.allowContinuousDoubles}
                                            onChange={e => setSettings(s => ({ ...s, allowContinuousDoubles: e.target.checked }))} />
                                        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors" />
                                        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">Allow continuous double periods</span>
                                </label>
                            </Section>

                            <Section title="🔒 Administrative Controls" desc="Restrict or allow specific management actions.">
                                <label className="flex items-center gap-3 cursor-pointer w-fit group">
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only peer"
                                            checked={systemSettings.allowCreditEdit}
                                            onChange={async (e) => {
                                                const newVal = e.target.checked;
                                                setSystemSettings(prev => ({ ...prev, allowCreditEdit: newVal }));
                                                try {
                                                    await api.updateConfig('allowCreditEdit', String(newVal));
                                                    notify.success(`Credit point editing ${newVal ? 'enabled' : 'disabled'}!`);
                                                } catch (err) {
                                                    notify.error('Failed to update system control.', { variant: 'error' });
                                                    setSystemSettings(prev => ({ ...prev, allowCreditEdit: !newVal })); // Rollback
                                                }
                                            }} />
                                        <div className="w-12 h-6 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors" />
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-6 transition-transform" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-700 font-bold group-hover:text-indigo-600 transition-colors">Allow Credit Point Editing</span>
                                        <span className="text-[10px] text-gray-400">If disabled, credit fields in Subject Manager and Data Entry will be locked.</span>
                                    </div>
                                </label>
                            </Section>

                            <div className="pt-2 border-t flex justify-end">
                                <button onClick={saveSettings} disabled={settingsSaving}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow transition-all disabled:opacity-60 flex items-center gap-2">
                                    {settingsSaving
                                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                                        : '💾 Save Settings'
                                    }
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* ── Sub-components ─────────────────────────────────────── */
const Section = ({ title, desc, children }) => (
    <div className="space-y-3">
        <div>
            <h4 className="font-bold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
        </div>
        {children}
        <div className="border-b pt-2" />
    </div>
);

const NumberField = ({ label, value, min, max, onChange }) => (
    <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 font-medium flex-1">{label}</label>
        <div className="flex items-center border rounded-xl overflow-hidden">
            <button onClick={() => onChange(Math.max(min, value - 1))}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-colors">−</button>
            <span className="px-4 py-2 text-sm font-semibold text-gray-800 min-w-[3rem] text-center">{value}</span>
            <button onClick={() => onChange(Math.min(max, value + 1))}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-colors">+</button>
        </div>
    </div>
);

export default AdminAccess;
