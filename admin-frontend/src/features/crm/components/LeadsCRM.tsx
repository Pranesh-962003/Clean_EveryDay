import React, { useState, useEffect } from 'react';
import { useApp } from '../../../core/context/AppContext';
import type { Lead, LeadActivity } from '../../../core/types';
import {
  Search,
  FileDown,
  Layers,
  List,
  Clock,
  PlusCircle,
  CheckSquare,
  Square,
  User,
  X,
  FileText
} from 'lucide-react';

const LeadsCRM: React.FC = () => {
  const {
    leads,
    addLead,
    updateLeadStatus,
    updateLeadNotes,
    addLeadComment,
    addLeadTask,
    toggleLeadTask,
    addLeadReminder,
    addLeadActivity,
    showToast
  } = useApp();

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  // Toggle layout: 'table' | 'kanban'
  const [layoutMode, setLayoutMode] = useState<'table' | 'kanban'>('kanban');

  // Lead Details drawer
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Drag and Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);

  // Sorting for Table
  const [sortField, setSortField] = useState<keyof Lead>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination for Table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form states for creating a new lead
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [nlName, setNlName] = useState('');
  const [nlEmail, setNlEmail] = useState('');
  const [nlPhone, setNlPhone] = useState('');
  const [nlCompany, setNlCompany] = useState('');
  const [nlSource, setNlSource] = useState('Web Inquiry');
  const [nlSubject, setNlSubject] = useState('');
  const [nlService, setNlService] = useState('Floor Care');
  const [nlMessage, setNlMessage] = useState('');
  const [nlPriority, setNlPriority] = useState<Lead['priority']>('Medium');

  const openDetailsDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setActiveWorkspaceTab('notes');
  };

  // Escape key down to close workspace details drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLead(null);
      }
    };
    if (selectedLead) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedLead]);

  // Escape key down to close create lead modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNewLeadModalOpen(false);
      }
    };
    if (newLeadModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [newLeadModalOpen]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priorityFilter, serviceFilter]);

  // Filter Leads
  const filteredLeads = leads.filter((l) => {
    const name = l.name || '';
    const email = l.email || '';
    const subj = l.subject || '';
    const comp = l.company || '';

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'All' || l.priority === priorityFilter;
    const matchesService = serviceFilter === 'All' || l.service === serviceFilter;

    return matchesSearch && matchesPriority && matchesService;
  });

  // Sort Leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  // Paginated leads
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeads = sortedLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);

  // Sorting header click handler
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Unique Services for Filter dropdown
  const services = Array.from(new Set(leads.map((l) => l.service || 'General')));

  // Kanban Columns statuses
  const KANBAN_STATUSES: Lead['status'][] = [
    'New',
    'Contacted',
    'Interested',
    'Negotiation',
    'Won',
    'Lost',
    'Archived'
  ];

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('text/plain', String(leadId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Lead['status']) => {
    e.preventDefault();
    const leadId = draggedLeadId;
    if (leadId === null) return;
    
    updateLeadStatus(leadId, targetStatus);
    showToast(`Lead pipeline status updated to ${targetStatus}`);

    // If the expanded lead in details drawer is the dragged one, refresh drawer state
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, status: targetStatus });
    }
    setDraggedLeadId(null);
  };

  // CSV Export
  const handleCSVExport = () => {
    const flatLeads = filteredLeads.map((l) => ({
      leadId: l.id,
      name: l.name,
      email: l.email,
      phone: l.phone || 'N/A',
      company: l.company || '',
      source: l.source,
      subject: l.subject,
      service: l.service,
      priority: l.priority,
      status: l.status,
      assignedTo: l.assignedTo || '',
      createdDate: l.date
    }));

    if (flatLeads.length === 0) {
      showToast('No leads available to export.');
      return;
    }

    const headers = Object.keys(flatLeads[0]).join(',');
    const rows = flatLeads.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CE_leads_crm_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlName.trim() || !nlEmail.trim() || !nlSubject.trim()) {
      showToast('Please check required fields.');
      return;
    }

    addLead(
      nlName.trim(),
      nlEmail.trim(),
      nlPhone.trim(),
      nlCompany.trim(),
      nlSource,
      nlSubject.trim(),
      nlService,
      nlMessage.trim(),
      nlPriority
    );

    // Reset Form
    setNlName('');
    setNlEmail('');
    setNlPhone('');
    setNlCompany('');
    setNlSubject('');
    setNlMessage('');
    setNlPriority('Medium');
    setNewLeadModalOpen(false);
  };

  // Drawer Action inputs staging
  const [commentInput, setCommentInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [actTitle, setActTitle] = useState('');
  const [actType, setActType] = useState<LeadActivity['type']>('Call');
  const [actContent, setActContent] = useState('');

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'notes' | 'activities' | 'tasks' | 'reminders' | 'comments'>('notes');

  const triggerAddComment = () => {
    if (!selectedLead || !commentInput.trim()) return;
    addLeadComment(selectedLead.id, 'Super Admin', commentInput.trim());
    
    // Refresh drawer view local state
    const commentsList = selectedLead.comments ? [...selectedLead.comments] : [];
    commentsList.push({
      id: `c-${Date.now()}`,
      author: 'Super Admin',
      body: commentInput.trim(),
      date: new Date().toLocaleString('en-IN')
    });
    setSelectedLead({ ...selectedLead, comments: commentsList });
    setCommentInput('');
  };

  const triggerAddTask = () => {
    if (!selectedLead || !taskInput.trim()) return;
    addLeadTask(selectedLead.id, taskInput.trim());
    
    // Refresh local
    const tasksList = selectedLead.tasks ? [...selectedLead.tasks] : [];
    tasksList.push({
      id: `t-${Date.now()}`,
      title: taskInput.trim(),
      done: false
    });
    setSelectedLead({ ...selectedLead, tasks: tasksList });
    setTaskInput('');
  };

  const triggerAddReminder = () => {
    if (!selectedLead || !reminderTitle.trim() || !reminderDate) return;
    addLeadReminder(selectedLead.id, reminderTitle.trim(), reminderDate);
    
    // Refresh local
    const remList = selectedLead.reminders ? [...selectedLead.reminders] : [];
    remList.push({
      id: `rem-${Date.now()}`,
      title: reminderTitle.trim(),
      date: reminderDate
    });
    setSelectedLead({ ...selectedLead, reminders: remList });
    setReminderTitle('');
    setReminderDate('');
  };

  const triggerAddActivity = () => {
    if (!selectedLead || !actTitle.trim()) return;
    addLeadActivity(selectedLead.id, actType, actTitle.trim(), actContent.trim());
    
    // Refresh local
    const actList = selectedLead.activities ? [...selectedLead.activities] : [];
    actList.push({
      type: actType,
      title: actTitle.trim(),
      content: actContent.trim(),
      date: new Date().toLocaleString('en-IN')
    });
    setSelectedLead({ ...selectedLead, activities: actList });
    setActTitle('');
    setActContent('');
    showToast('Activity logged.');
  };

  return (
    <div className="animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h2 className="font-display text-[1.6rem] font-bold text-blk tracking-tight">Leads pipeline CRM</h2>
          <p className="text-[0.78rem] text-mut">Follow up on customer inquiries, wholesale questions, and custom contracts.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* CSV Export */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 border border-bdr text-mid bg-wht hover:border-primary hover:text-primary rounded shadow-premium-sm cursor-pointer"
          >
            <FileDown size={14} /> Export CSV
          </button>

          {/* Toggle View Layout */}
          <div className="flex border border-bdr rounded overflow-hidden shadow-premium-sm">
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`p-2 transition-colors cursor-pointer ${
                layoutMode === 'kanban' ? 'bg-primary text-wht' : 'bg-wht text-mid hover:text-blk'
              }`}
              title="Kanban Board view"
            >
              <Layers size={14} />
            </button>
            <button
              onClick={() => setLayoutMode('table')}
              className={`p-2 transition-colors cursor-pointer ${
                layoutMode === 'table' ? 'bg-primary text-wht' : 'bg-wht text-mid hover:text-blk'
              }`}
              title="Tabular Data Grid view"
            >
              <List size={14} />
            </button>
          </div>

          <button
            onClick={() => setNewLeadModalOpen(true)}
            className="bg-primary text-wht rounded px-5 py-2 text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-premium-sm"
          >
            <PlusCircle size={14} /> Create lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="bg-wht border border-bdrl rounded-xl p-4 shadow-premium-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fnt" size={14} />
          <input
            type="text"
            placeholder="Search leads by client name, email, company or subject..."
            className="w-full border border-bdr rounded bg-wht pl-9 pr-4 py-2 text-sm outline-none focus:border-primary placeholder:text-mut/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Priority</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Service filter */}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-mut">Category</label>
          <select
            className="border border-bdr rounded bg-wht px-3 py-2 text-sm outline-none cursor-pointer focus:border-primary text-mid font-medium"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="All">All categories</option>
            {services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEWPORT LAYOUT SWITCH */}
      {layoutMode === 'table' ? (
        /* TABLE LAYOUT VIEW */
        <div className="bg-wht border border-bdrl rounded-xl shadow-premium-sm overflow-hidden mb-6">
          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
              <tr className="bg-sur border-b border-bdrl text-xs font-medium text-mut select-none sticky top-0 z-10">
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('id')}>
                  Lead ID {sortField === 'id' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('name')}>
                  Client name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('company')}>
                  Company {sortField === 'company' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('subject')}>
                  Subject enquiry {sortField === 'subject' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('service')}>
                  Category {sortField === 'service' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Source</th>
                <th className="py-3 px-4 text-center whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('priority')}>
                  Priority {sortField === 'priority' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-blk" onClick={() => handleSort('followUpDate')}>
                  Follow-up date {sortField === 'followUpDate' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-3 px-5 text-right whitespace-nowrap">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-bdrl text-sm">
                {currentLeads.length > 0 ? (
                  currentLeads.map((l) => (
                    <tr key={l.id} className="hover:bg-sur/10 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-mid whitespace-nowrap">LD-{String(l.id).substring(5, 10) || l.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blk">{l.name}</div>
                        <div className="text-xs text-mut mt-0.5 leading-normal">{l.email}</div>
                      </td>
                      <td className="py-3 px-4 text-mid whitespace-nowrap">{l.company || 'Individual'}</td>
                      <td className="py-3 px-4 text-blk truncate max-w-[200px]" title={l.subject}>{l.subject}</td>
                      <td className="py-3 px-4">
                        <span className="bg-primary-soft text-primary-hover border border-primary-light/40 px-2.5 py-1 rounded-full text-xs font-medium">
                          {l.service}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-mut font-medium whitespace-nowrap">{l.source}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                          l.priority === 'High'
                            ? 'bg-red-bg text-red'
                            : l.priority === 'Medium'
                            ? 'bg-yellow-50 text-amber-700'
                            : 'bg-sur text-mut'
                        }`}>
                          {l.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <select
                          className="border border-bdr rounded bg-wht px-2.5 py-1.5 text-sm font-semibold text-mid focus:border-primary outline-none cursor-pointer"
                          value={l.status}
                          onChange={(e) => updateLeadStatus(l.id, e.target.value as any)}
                        >
                          {KANBAN_STATUSES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-mid whitespace-nowrap">{l.followUpDate || 'Not set'}</td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openDetailsDrawer(l)}
                          className="text-xs font-semibold px-3 py-1.5 border border-bdr text-mid bg-wht hover:border-primary hover:text-primary rounded cursor-pointer"
                        >
                          Workspace
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-fnt text-[0.82rem]">
                      <span>No client leads found matching the filters.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-bdrl select-none">
              <span className="text-xs text-mut font-medium">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (<strong>{sortedLeads.length}</strong> leads)
              </span>
              <div className="flex gap-1.5 text-xs">
                <button
                  onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 border border-bdr rounded bg-wht hover:border-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 border rounded cursor-pointer transition-all ${
                      currentPage === i + 1
                        ? 'bg-primary text-wht border-primary font-bold'
                        : 'bg-wht border-bdr text-mid hover:border-primary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 border border-bdr rounded bg-wht hover:border-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* KANBAN BOARD LAYOUT VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none max-h-[600px]">
          {KANBAN_STATUSES.map((status) => {
            const columnLeads = filteredLeads.filter((l) => l.status === status);

            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className="w-[280px] bg-sur/40 border border-bdrl rounded-md p-4 shrink-0 flex flex-col max-h-[550px] overflow-y-auto"
              >
                {/* Column header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-bdrl mb-4">
                  <span className="text-xs font-semibold text-blk capitalize">
                    {status}
                  </span>
                  <span className="text-xs font-medium text-mut bg-wht border border-bdr px-2 py-0.5 rounded-full leading-none">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Cards grid */}
                <div className="flex flex-col gap-3 flex-1">
                  {columnLeads.length > 0 ? (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => openDetailsDrawer(lead)}
                        className="bg-wht border border-bdr rounded-md p-4 hover:border-primary shadow-premium-sm hover:shadow-premium-md cursor-grab active:cursor-grabbing transition-all select-none animate-fadeIn"
                      >
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-2 capitalize ${
                          lead.priority === 'High'
                            ? 'bg-red-bg text-red'
                            : lead.priority === 'Medium'
                            ? 'bg-yellow-50 text-amber-700'
                            : 'bg-sur text-mut'
                        }`}>
                          {lead.priority} priority
                        </span>
                        
                        <h4 className="text-sm font-semibold text-blk truncate mb-0.5" title={lead.subject}>
                          {lead.subject}
                        </h4>
                        <span className="text-xs text-mid font-medium block truncate">{lead.name}</span>
                        {lead.company && <span className="text-xs text-mut block mt-0.5">{lead.company}</span>}
 
                        <div className="flex items-center justify-between border-t border-bdrl pt-2.5 mt-3 text-xs text-mut">
                          <span>{lead.date}</span>
                          <span className="bg-sur px-2 py-0.5 rounded border border-bdrl">{lead.service}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 border-2 border-dashed border-bdrl rounded-md flex items-center justify-center p-6 text-center text-[0.7rem] text-mut font-medium">
                      Drag here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Workspace Leads details drawer */}
      {selectedLead && (
        <div 
          className="fixed inset-0 z-[1000] flex justify-end bg-blk/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedLead(null);
            }
          }}
        >
          <div
            className="bg-wht border-l border-bdr shadow-premium-xl w-full max-w-[660px] h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between"
          >
            {/* Header */}
            <div>
              <div className="flex justify-between items-center border-b border-bdrl pb-3.5 mb-5 select-none">
                <div>
                  <span className="text-xs font-medium text-mut">CRM leads workspace</span>
                  <h3 className="font-display text-lg font-semibold text-blk mt-0.5">{selectedLead.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded-full hover:bg-sur text-mut hover:text-blk cursor-pointer animate-fadeIn"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lead Information block */}
              <div className="grid grid-cols-2 gap-4 bg-sur/50 p-4 rounded border border-bdrl mb-6 text-sm leading-relaxed">
                <div>
                  <span className="text-mut text-xs block">Client contact</span>
                  <span className="font-semibold text-blk block">{selectedLead.name}</span>
                  <span className="text-xs text-mut block mt-0.5">{selectedLead.email} • {selectedLead.phone || 'No phone'}</span>
                </div>
                <div>
                  <span className="text-mut text-xs block">Company & source</span>
                  <span className="font-semibold text-blk block">{selectedLead.company || 'Individual client'}</span>
                  <span className="text-xs text-mid block mt-0.5">Acquired via: {selectedLead.source}</span>
                </div>
                <div>
                  <span className="text-mut text-xs block">Service category</span>
                  <span className="font-semibold text-primary block mt-0.5">{selectedLead.service}</span>
                </div>
                <div>
                  <span className="text-mut text-xs block">Priority status</span>
                  <span className="font-semibold text-blk block mt-0.5">{selectedLead.priority} priority • {selectedLead.status}</span>
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex gap-4 border-b border-bdrl pb-2 mb-5 select-none text-xs text-mut font-medium">
                <button
                  onClick={() => setActiveWorkspaceTab('notes')}
                  className={`pb-1 cursor-pointer ${
                    activeWorkspaceTab === 'notes' ? 'text-primary border-b-2 border-primary font-semibold' : 'hover:text-blk'
                  }`}
                >
                  1. Profile details & notes
                </button>
                <button
                  onClick={() => setActiveWorkspaceTab('activities')}
                  className={`pb-1 cursor-pointer ${
                    activeWorkspaceTab === 'activities' ? 'text-primary border-b-2 border-primary font-semibold' : 'hover:text-blk'
                  }`}
                >
                  2. Activities ({selectedLead.activities?.length || 0})
                </button>
                <button
                  onClick={() => setActiveWorkspaceTab('tasks')}
                  className={`pb-1 cursor-pointer ${
                    activeWorkspaceTab === 'tasks' ? 'text-primary border-b-2 border-primary font-semibold' : 'hover:text-blk'
                  }`}
                >
                  3. Tasks ({selectedLead.tasks?.filter((t) => !t.done).length || 0})
                </button>
                <button
                  onClick={() => setActiveWorkspaceTab('reminders')}
                  className={`pb-1 cursor-pointer ${
                    activeWorkspaceTab === 'reminders' ? 'text-primary border-b-2 border-primary font-semibold' : 'hover:text-blk'
                  }`}
                >
                  4. Reminders
                </button>
                <button
                  onClick={() => setActiveWorkspaceTab('comments')}
                  className={`pb-1 cursor-pointer ${
                    activeWorkspaceTab === 'comments' ? 'text-primary border-b-2 border-primary font-semibold' : 'hover:text-blk'
                  }`}
                >
                  5. Comments ({selectedLead.comments?.length || 0})
                </button>
              </div>

              {/* Tabs contents */}
               <div className="text-sm">
                {/* Notes TAB */}
                {activeWorkspaceTab === 'notes' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div>
                      <span className="text-xs font-semibold text-mut block mb-1.5 flex items-center gap-1"><FileText size={10} /> Message enquiry body</span>
                      <div className="border border-bdr rounded p-4 bg-sur/30 text-ink leading-relaxed whitespace-pre-wrap">
                        {selectedLead.message}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-mut block mb-1.5">Internal sales follow up notes (Auto-saved)</span>
                      <textarea
                        rows={4}
                        placeholder="Log phone call remarks, user requirements details, scheduling quotes details..."
                        className="w-full border border-bdr focus:border-primary rounded px-3 py-2.5 outline-none resize-none placeholder:text-mut/50 bg-wht"
                        value={selectedLead.internalNotes || ''}
                        onChange={(e) => {
                          updateLeadNotes(selectedLead.id, e.target.value);
                          setSelectedLead({ ...selectedLead, internalNotes: e.target.value });
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Activities TAB */}
                {activeWorkspaceTab === 'activities' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    {/* Add Activity log */}
                    <div className="border border-bdr rounded p-4 bg-sur/10 flex flex-col gap-3">
                      <span className="text-xs font-semibold text-mid leading-none">Log customer touchpoint</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-mut font-semibold">Touchpoint type</label>
                          <select
                            className="border border-bdr rounded bg-wht px-2.5 py-1.5 text-sm outline-none cursor-pointer"
                            value={actType}
                            onChange={(e) => setActType(e.target.value as any)}
                          >
                            <option value="Call">Call log</option>
                            <option value="Email">Email sent</option>
                            <option value="Note">General note</option>
                            <option value="Task">Task action</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-mut font-semibold">Activity title</label>
                          <input
                            type="text"
                            placeholder="e.g. Sent pricing catalog"
                            className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary bg-wht"
                            value={actTitle}
                            onChange={(e) => setActTitle(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-xs text-mut font-semibold">Interaction details / notes</label>
                          <input
                            type="text"
                            placeholder="Discussed pricing options for 5L Floor Cleaner concentrate..."
                            className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary bg-wht"
                            value={actContent}
                            onChange={(e) => setActContent(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={triggerAddActivity}
                        className="bg-primary text-wht rounded px-4 py-2 text-xs font-semibold hover:bg-primary-hover self-start cursor-pointer"
                      >
                        Add activity log
                      </button>
                    </div>

                    {/* Activities List */}
                    <div className="flex flex-col gap-3 relative pl-4 border-l border-bdr ml-2 mt-2">
                      {(selectedLead.activities || []).map((act, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-wht" />
                          <span className="text-xs text-mut block">{act.date}</span>
                          <span className="font-semibold text-blk text-xs inline-block mt-0.5">{act.title}</span>
                          {act.content && <p className="text-xs text-mid mt-0.5 italic">{act.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks TAB */}
                {activeWorkspaceTab === 'tasks' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    {/* Add Task input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add checklist task (e.g. Schedule call)..."
                        className="border border-bdr rounded px-3 py-2 text-sm outline-none focus:border-primary flex-1 placeholder:text-mut/50 bg-wht"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                      />
                      <button
                        onClick={triggerAddTask}
                        className="bg-primary text-wht rounded px-4 py-2 text-sm font-semibold cursor-pointer"
                      >
                        Add task
                      </button>
                    </div>

                    {/* Tasks Checklist */}
                    <div className="flex flex-col gap-2 mt-2 border border-bdrl rounded p-2 bg-sur/30">
                      {(selectedLead.tasks || []).length > 0 ? (
                        (selectedLead.tasks || []).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              toggleLeadTask(selectedLead.id, t.id);
                              // Refresh local view
                              const updatedTasks = selectedLead.tasks?.map((tsk) =>
                                tsk.id === t.id ? { ...tsk, done: !tsk.done } : tsk
                              );
                              setSelectedLead({ ...selectedLead, tasks: updatedTasks });
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-sur/50 rounded cursor-pointer select-none"
                          >
                            {t.done ? (
                              <CheckSquare size={16} className="text-primary" />
                            ) : (
                              <Square size={16} className="text-mut" />
                            )}
                            <span className={`text-sm ${t.done ? 'line-through text-mut' : 'text-blk font-medium'}`}>
                              {t.title}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-mut text-xs">No tasks created yet.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reminders TAB */}
                {activeWorkspaceTab === 'reminders' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    <div className="border border-bdr rounded p-4 bg-sur/10 flex flex-col gap-3">
                      <span className="text-xs font-semibold text-mid leading-none">Schedule follow-up calendar reminder</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 col-span-2">
                          <label className="text-xs font-medium text-mut">Reminder title</label>
                          <input
                            type="text"
                            placeholder="e.g. Follow up on bulk discount approval"
                            className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary bg-wht"
                            value={reminderTitle}
                            onChange={(e) => setReminderTitle(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-mut">Target schedule date</label>
                          <input
                            type="date"
                            className="border border-bdr rounded px-2.5 py-1.5 text-sm outline-none focus:border-primary bg-wht"
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={triggerAddReminder}
                        className="bg-primary text-wht rounded px-4 py-2 text-xs font-semibold hover:bg-primary-hover self-start cursor-pointer"
                      >
                        Set reminder
                      </button>
                    </div>

                    {/* Reminders list */}
                    <div className="flex flex-col gap-2 mt-2">
                      {(selectedLead.reminders || []).length > 0 ? (
                        (selectedLead.reminders || []).map((rem) => (
                           <div className="p-3 border border-bdrl rounded bg-sur/30 flex justify-between items-center" key={rem.id}>
                            <span className="text-sm font-semibold text-blk">{rem.title}</span>
                            <span className="text-xs text-primary flex items-center gap-1"><Clock size={11} /> {rem.date}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-mut text-xs">No active follow-up reminders scheduled.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments TAB */}
                {activeWorkspaceTab === 'comments' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                    {/* Add comment input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type internal staff comment (e.g. CEO approved discount)..."
                        className="border border-bdr rounded px-3 py-2 text-sm outline-none focus:border-primary flex-1 placeholder:text-mut/50 bg-wht"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                      />
                      <button
                        onClick={triggerAddComment}
                        className="bg-primary text-wht rounded px-4 py-2 text-sm font-semibold cursor-pointer"
                      >
                        Comment
                      </button>
                    </div>

                    {/* Internal Comments List */}
                    <div className="flex flex-col gap-3 mt-2">
                      {(selectedLead.comments || []).length > 0 ? (
                        (selectedLead.comments || []).map((c) => (
                          <div className="p-3 border border-bdrl rounded bg-sur/20 hover:bg-sur/40" key={c.id}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-blk text-xs flex items-center gap-1">
                                <User size={11} className="text-primary" /> {c.author}
                              </span>
                              <span className="text-xs text-mut">{c.date}</span>
                            </div>
                            <p className="text-xs text-mid italic leading-normal">"{c.body}"</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-mut text-xs">No discussion comments yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>
      )}

      {/* Create Lead Modal Dialog */}
      {newLeadModalOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-blk/60 p-4 backdrop-blur-xs overflow-y-auto animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewLeadModalOpen(false);
            }
          }}
        >
          <div className="bg-wht rounded-xl border border-bdr shadow-premium-lg w-full max-w-[600px] p-6 sm:p-8 relative my-auto animate-slideUp">
            <button
              onClick={() => setNewLeadModalOpen(false)}
              className="absolute top-5 right-5 text-mut hover:text-blk transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-lg font-semibold text-blk mb-5 pb-3 border-b border-bdrl">Create customer lead</h3>

            <form onSubmit={handleCreateLeadSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-mut">Subject Enquiry / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulk discount quote for 5L Laundry Concentrate"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full"
                  value={nlSubject}
                  onChange={(e) => setNlSubject(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Client Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Patil"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full"
                  value={nlName}
                  onChange={(e) => setNlName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. amit@techsolutions.com"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full font-mono"
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 98112 34567"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full font-mono"
                  value={nlPhone}
                  onChange={(e) => setNlPhone(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tech Solutions Pvt Ltd"
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full"
                  value={nlCompany}
                  onChange={(e) => setNlCompany(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Lead Category *</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none bg-wht cursor-pointer"
                  value={nlService}
                  onChange={(e) => setNlService(e.target.value)}
                >
                  <option>Floor Care</option>
                  <option>Dish Care</option>
                  <option>Laundry Care</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Lead Source</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none bg-wht cursor-pointer"
                  value={nlSource}
                  onChange={(e) => setNlSource(e.target.value)}
                >
                  <option>Web Inquiry</option>
                  <option>Google Search</option>
                  <option>Reference</option>
                  <option>Direct Call</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-mut">Priority Status *</label>
                <select
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none bg-wht cursor-pointer"
                  value={nlPriority}
                  onChange={(e) => setNlPriority(e.target.value as any)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[0.72rem] font-semibold text-mut">Enquiry details / Message</label>
                <textarea
                  rows={3}
                  placeholder="Details of client inquiry requirements..."
                  className="border border-bdr focus:border-primary rounded px-3 py-2 outline-none w-full resize-none placeholder:text-mut/50"
                  value={nlMessage}
                  onChange={(e) => setNlMessage(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 pt-4 border-t border-bdrl mt-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-primary text-wht rounded py-2 px-5 text-sm font-semibold hover:bg-primary-hover cursor-pointer"
                >
                  Create lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsCRM;
