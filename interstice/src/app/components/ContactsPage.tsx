"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Users,
  Plus,
  Phone,
  Mail,
  Building2,
  Pencil,
  Trash2,
  X,
  User,
} from "lucide-react";
import { cn } from "../../lib/utils";

type Contact = {
  _id: Id<"contacts">;
  _creationTime: number;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  addedBy?: Id<"agents">;
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
      >
        <Users className="w-6 h-6 text-blue-400" />
      </div>
      <p className="text-sm font-medium text-gray-300 mb-1">No contacts yet</p>
      <p className="text-xs text-gray-500">
        Add contacts for your Call Agent to reach out to.
      </p>
    </div>
  );
}

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Contact;
  onSave: (data: {
    name: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      role: role.trim() || undefined,
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onCancel}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl p-6 space-y-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">
            {initial ? "Edit Contact" : "Add Contact"}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <FormField label="Name *" value={name} onChange={setName} placeholder="John Doe" />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Role" value={role} onChange={setRole} placeholder="Investor" />
          <FormField label="Company" value={company} onChange={setCompany} placeholder="Acme Inc" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email" value={email} onChange={setEmail} placeholder="john@example.com" type="email" />
          <FormField label="Phone" value={phone} onChange={setPhone} placeholder="+1 555-0123" type="tel" />
        </div>
        <FormField label="Notes" value={notes} onChange={setNotes} placeholder="Met at HackHayward..." multiline />

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
            style={{ border: "1px solid var(--border)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            {initial ? "Save Changes" : "Add Contact"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  const inputClass =
    "w-full px-3 py-2 rounded-md text-xs text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-blue-500/50";
  const inputStyle = { background: "var(--surface-2)", border: "1px solid var(--border)" };

  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-500 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={cn(inputClass, "resize-none")}
          style={inputStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          style={inputStyle}
        />
      )}
    </div>
  );
}

export function ContactsPage() {
  const contacts = useQuery(api.contacts.list);
  const addContact = useMutation(api.contacts.add);
  const updateContact = useMutation(api.contacts.update);
  const removeContact = useMutation(api.contacts.remove);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const handleAdd = async (data: {
    name: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => {
    await addContact(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: {
    name: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => {
    if (!editing) return;
    await updateContact({ id: editing._id, ...data });
    setEditing(null);
  };

  const handleDelete = async (id: Id<"contacts">) => {
    await removeContact({ id });
  };

  return (
    <div className="max-w-[1000px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-gray-500" />
          <h1 className="text-sm font-semibold text-white">Contacts</h1>
          {contacts && (
            <span className="text-[11px] text-gray-500 font-medium">
              {contacts.length} total
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Contact
        </button>
      </div>

      {/* List */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {!contacts ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading…</div>
        ) : contacts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {contacts.map((contact) => (
              <div
                key={contact._id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{contact.name}</span>
                    {contact.role && (
                      <span className="text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded-full bg-white/5">
                        {contact.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {contact.company && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Building2 className="w-3 h-3" />
                        {contact.company}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(contact)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes preview */}
      {contacts && contacts.some((c) => c.notes) && (
        <div className="text-[11px] text-gray-600 px-1">
          Hover over a contact for edit/delete actions.
        </div>
      )}

      {/* Modal */}
      {showForm && <ContactForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editing && (
        <ContactForm
          initial={editing}
          onSave={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
