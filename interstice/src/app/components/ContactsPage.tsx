"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Users, Plus, Phone, Mail, Building2, Pencil, Trash2, X, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

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

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Contact;
  onSave: (data: { name: string; role?: string; company?: string; email?: string; phone?: string; notes?: string }) => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg p-6 space-y-4 bg-card border border-border shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            {initial ? "Edit Contact" : "Add Contact"}
          </h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Role</label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Investor" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Phone</label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0123" />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Met at HackHayward..." rows={2} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!name.trim()}>
            {initial ? "Save Changes" : "Add Contact"}
          </Button>
        </div>
      </form>
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

  const handleAdd = async (data: { name: string; role?: string; company?: string; email?: string; phone?: string; notes?: string }) => {
    await addContact(data);
    setShowForm(false);
  };

  const handleUpdate = async (data: { name: string; role?: string; company?: string; email?: string; phone?: string; notes?: string }) => {
    if (!editing) return;
    await updateContact({ id: editing._id, ...data });
    setEditing(null);
  };

  const handleDelete = async (id: Id<"contacts">) => {
    await removeContact({ id });
  };

  return (
    <div className="max-w-[1000px] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Contacts</h1>
          {contacts && (
            <span className="text-[11px] text-muted-foreground font-medium">{contacts.length} total</span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" />
          Add Contact
        </Button>
      </div>

      <Card className="overflow-hidden">
        {!contacts ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No contacts yet</p>
            <p className="text-xs text-muted-foreground">Add contacts for your Call Agent to reach out to.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((contact) => (
              <div
                key={contact._id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-accent/20 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/15">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{contact.name}</span>
                    {contact.role && (
                      <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 rounded-full bg-accent">
                        {contact.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {contact.company && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {contact.company}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(contact)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showForm && <ContactForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editing && <ContactForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />}
    </div>
  );
}
