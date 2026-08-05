import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, Activity, Search, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import type { AnalyticsSnapshot, SystemHealth } from '@nexora/shared';

export function AdminPage() {
  const navigate = useNavigate();

  const { data: analytics } = useQuery<AnalyticsSnapshot>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data.data;
    },
  });

  const { data: health } = useQuery<SystemHealth>({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const { data } = await api.get('/admin/health');
      return data.data;
    },
    refetchInterval: 30000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold gradient-text">Admin Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-indigo-400" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalUsers ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Search className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalSearches ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Total Searches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-cyan-400" />
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalArticlesRead ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Articles Read</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold capitalize">{health?.status ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">System Health</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-indigo-400" />
                Popular Interests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.popularInterests?.slice(0, 10).map((item) => (
                  <div key={item.interest} className="flex justify-between text-sm">
                    <span>{item.interest}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                )) ?? <p className="text-muted-foreground text-sm">No data yet</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-400" />
                Popular Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics?.popularSearches?.slice(0, 10).map((item) => (
                  <div key={item.query} className="flex justify-between text-sm">
                    <span>{item.query}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                )) ?? <p className="text-muted-foreground text-sm">No data yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {health && (
          <Card>
            <CardHeader>
              <CardTitle>System Health Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span>Firestore</span>
                  <span className={health.firestore ? 'text-emerald-400' : 'text-red-400'}>
                    {health.firestore ? 'Connected' : 'Down'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>OpenAI</span>
                  <span className={health.openai ? 'text-emerald-400' : 'text-red-400'}>
                    {health.openai ? 'Connected' : 'Down'}
                  </span>
                </div>
                {Object.entries(health.newsProviders).map(([provider, status]) => (
                  <div key={provider} className="flex justify-between">
                    <span className="capitalize">{provider.replace('-', ' ')}</span>
                    <span className={status ? 'text-emerald-400' : 'text-red-400'}>
                      {status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Role</th>
                    <th className="text-left py-2 px-2">Country</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: { id: string; firstName: string; lastName: string; email: string; role: string; country: string }) => (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 px-2">{u.firstName} {u.lastName}</td>
                      <td className="py-2 px-2 text-muted-foreground">{u.email}</td>
                      <td className="py-2 px-2 capitalize">{u.role}</td>
                      <td className="py-2 px-2">{u.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
