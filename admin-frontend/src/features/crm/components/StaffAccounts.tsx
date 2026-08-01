import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import type { Staff } from '../../../core/types';
import {
  Users,
  Shield,
  UserCheck,
  PlusCircle,
  Lock,
  Trash2,
  X
} from 'lucide-react';

const StaffAccounts: React.FC = () => {
  const {
    staff,
    inviteStaff,
    updateStaffStatus,
    resetStaffPassword,
    deleteStaff,
    showToast
  } = useApp();

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Escape key down to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInviteModalOpen(false);
      }
    };
    if (inviteModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inviteModalOpen]);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState<Staff['role']>('Support');

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim() || !invEmail.trim()) {
      showToast('Please check required inputs.');
      return;
    }

    inviteStaff(invName.trim(), invEmail.trim().toLowerCase(), invRole);

    // Reset Form
    setInvName('');
    setInvEmail('');
    setInvRole('Support');
    setInviteModalOpen(false);
  };

  // Helper mapping roles to modules permissions
  const getRolePermissions = (role: Staff['role']) => {
    switch (role) {
      case 'Super Admin':
        return { read: true, create: true, edit: true, delete: true, export: true };
      case 'Admin':
        return { read: true, create: true, edit: true, delete: false, export: true };
      case 'Manager':
        return { read: true, create: true, edit: true, delete: false, export: false };
      case 'Sales':
        return { read: true, create: false, edit: true, delete: false, export: false };
      case 'Support':
        return { read: true, create: false, edit: false, delete: false, export: false };
      default:
        return { read: true, create: false, edit: false, delete: false, export: false };
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-blk">Staff accounts</h2>
          <p className="text-sm text-mut">Manage team roles, invite staff members, de-activate accounts, and adjust module permissions.</p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="bg-primary text-wht rounded px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-premium-sm"
        >
          <PlusCircle size={14} /> Invite staff
        </button>
      </div>

      {/* Stats Summary cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><Users size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Total team</span>
            <span className="text-xl font-bold text-blk leading-none">{staff.length}</span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><Shield size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Admins / super</span>
            <span className="text-xl font-bold text-blk leading-none">
              {staff.filter((s) => s.role === 'Super Admin' || s.role === 'Admin').length}
            </span>
          </div>
        </div>

        <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-primary-soft flex items-center justify-center text-primary shrink-0"><UserCheck size={16} /></div>
          <div>
            <span className="text-xs text-mut font-medium block leading-none mb-1">Active accounts</span>
            <span className="text-xl font-bold text-blk leading-none">
              {staff.filter((s) => s.status === 'Active').length}
            </span>
          </div>
        </div>
      </div>

      {/* Staff accounts table grid */}
      <div className="bg-wht border border-bdrl rounded-xl shadow-premium-sm overflow-hidden mb-6">
        <div className="overflow-x-auto w-full scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-sur border-b border-bdrl text-xs font-medium text-mut select-none">
                <th className="py-3 px-4 w-[200px] whitespace-nowrap">Member</th>
                <th className="py-3 px-4 w-[220px] whitespace-nowrap">Email</th>
                <th className="py-3 px-4 text-center w-[120px] whitespace-nowrap">Role</th>
                <th className="py-3 px-4 w-[160px] whitespace-nowrap">Permissions</th>
                <th className="py-3 px-4 text-center w-[100px] whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Last login</th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bdrl text-sm leading-relaxed">
              {staff.map((s) => {
                const initials = s.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2);

                const colorIndex = initials.charCodeAt(0) % 5;
                const bgColors = [
                  'bg-primary-soft text-primary border-primary-light/50',
                  'bg-blue-50 text-blue-700 border-blue-200',
                  'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'bg-amber-50 text-amber-700 border-amber-200',
                  'bg-purple-50 text-purple-700 border-purple-200'
                ];
                const avatarStyle = bgColors[colorIndex] || bgColors[0];
                
                const pms = getRolePermissions(s.role);

                return (
                  <tr key={s.id} className="hover:bg-sur/10 transition-colors">
                    {/* Member */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border shrink-0 ${avatarStyle}`}>
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold text-blk block">{s.name}</span>
                          <span className="text-xs text-mut">ID: {s.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 text-sm text-mid">{s.email}</td>

                    {/* Role */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        s.role === 'Super Admin' || s.role === 'Admin'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-primary-soft text-primary'
                      }`}>
                        {s.role}
                      </span>
                    </td>

                    {/* Module Permissions inline details summary */}
                    <td className="py-3 px-4 select-none">
                      <div className="flex flex-wrap gap-1 text-[11px] font-medium">
                        {pms.read && <span className="bg-sur text-mid px-1.5 py-0.5 rounded">Read</span>}
                        {pms.create && <span className="bg-primary-soft text-primary px-1.5 py-0.5 rounded">Create</span>}
                        {pms.edit && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Edit</span>}
                        {pms.delete && <span className="bg-red-bg text-red px-1.5 py-0.5 rounded">Delete</span>}
                        {pms.export && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Export</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => updateStaffStatus(s.id, s.status === 'Active' ? 'Inactive' : 'Active')}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer ${
                          s.status === 'Active'
                            ? 'bg-primary-soft text-primary hover:bg-red-bg hover:text-red'
                            : 'bg-sur text-mut hover:text-primary'
                        }`}
                        title="Click to toggle status"
                      >
                        {s.status}
                      </button>
                    </td>

                    {/* Last login */}
                    <td className="py-3 px-4 text-sm text-mut whitespace-nowrap">{s.lastLogin}</td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => resetStaffPassword(s.id)}
                          className="p-1 border border-bdr hover:border-primary text-mid hover:text-primary-hover rounded bg-wht cursor-pointer"
                          title="Generate Password Reset"
                        >
                          <Lock size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${s.name} from the staff accounts registry?`)) {
                              deleteStaff(s.id);
                            }
                          }}
                          className="p-1 border border-bdr hover:border-red text-mid hover:text-red rounded bg-wht cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Dialog Modal */}
      {inviteModalOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-blk/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setInviteModalOpen(false);
            }
          }}
        >
          <div className="bg-wht rounded-xl border border-bdr shadow-premium-lg w-full max-w-[450px] p-6 relative my-auto animate-slideUp">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-5 right-5 text-mut hover:text-blk transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-[1.1rem] font-bold text-blk mb-4 border-b border-bdrl pb-2.5">
              Invite team member
            </h3>

            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 text-[0.82rem]">
              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] text-mut font-semibold">Staff member name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alok Sen"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full bg-wht"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] text-mut font-semibold font-mono">Email address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alok@cleaneveryday.in"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full font-mono bg-wht"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[0.68rem] text-mut font-semibold">Role access *</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full cursor-pointer bg-wht"
                  value={invRole}
                  onChange={(e) => setInvRole(e.target.value as any)}
                >
                  <option value="Super Admin">Super Admin (Full Access)</option>
                  <option value="Admin">Admin (Full Edit / No Delete)</option>
                  <option value="Manager">Manager (Edit catalog / No Export)</option>
                  <option value="Sales">Sales (CRM Leads Workspace only)</option>
                  <option value="Support">Support (View dashboard & reviews replies)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-bdrl flex gap-2 justify-end">
                <button
                  type="submit"
                  className="bg-primary text-wht rounded px-5 py-2 text-[0.74rem] font-bold cursor-pointer"
                >
                  Invite staff
                </button>
                {/* No separate cancel button, top close button and click backdrop close is enough */}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAccounts;
