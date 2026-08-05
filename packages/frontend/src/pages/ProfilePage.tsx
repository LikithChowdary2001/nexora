import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Globe, Briefcase, Heart, BarChart3, LogOut, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export function ProfilePage() {
  const { profile, logout, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    age: profile?.age?.toString() ?? '',
    country: profile?.country ?? '',
    profession: profile?.profession ?? '',
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put('/users/profile', { ...form, age: +form.age });
      await refreshProfile();
    },
    onSuccess: () => setEditing(false),
  });

  if (loading || !profile) return (
    <AppLayout><div className="page-container py-8 max-w-2xl"><ProfileSkeleton /></div></AppLayout>
  );

  const initials = `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <AppLayout>
      <div className="page-container py-8 max-w-2xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6">
          <Avatar className="h-24 w-24 ring-4 ring-primary/20">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-display">{profile.firstName} {profile.lastName}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1"><Mail className="h-4 w-4" />{profile.email}</p>
            <Badge variant="outline" className="mt-2 capitalize">{profile.role}</Badge>
          </div>
        </motion.div>

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-heading flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Profile</h2>
            <Button variant="ghost" size="sm" className="rounded-button" onClick={() => {
              if (editing) updateMutation.mutate();
              else { setForm({ firstName: profile.firstName, lastName: profile.lastName, age: profile.age.toString(), country: profile.country, profession: profile.profession }); setEditing(true); }
            }}>
              <Edit2 className="h-4 w-4 mr-1" /> {editing ? 'Save' : 'Edit'}
            </Button>
          </div>

          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Profession</Label><Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{profile.firstName} {profile.lastName}</span></div>
              <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /><span>Age {profile.age}</span></div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><span>{profile.country}</span></div>
              <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{profile.profession}</span></div>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-heading flex items-center gap-2 mb-4"><Heart className="h-5 w-5 text-primary" /> Interests</h2>
          <div className="flex flex-wrap gap-2">
            {[...profile.interests, ...profile.customInterests].map((i) => (
              <Badge key={i} variant="default">{i}</Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="rounded-button flex-1" onClick={() => navigate('/settings')}>Settings</Button>
          <Button variant="outline" className="rounded-button flex-1 text-destructive hover:text-destructive" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
