import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'login', username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка входа');
      } else {
        login(username);
      }
    } catch {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="mb-10 text-center">
          <div className="felt-texture rounded-3xl px-8 py-5 inline-block mb-6 shadow-lg">
            <img
              src="https://cdn.poehali.dev/projects/ebab8bd9-031b-48f4-a7d3-fccb5d4b6d46/bucket/3cafc0df-c8ed-447c-9221-2af5234d84c1.png"
              alt="SmartBilliard"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Добро пожаловать</h1>
          <p className="text-muted-foreground mt-2 text-sm">Войдите в панель администратора</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <div className="relative">
              <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="rounded-xl h-12 pl-9"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl h-12 pl-9"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-4 py-3">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} size="lg" className="w-full rounded-xl h-12 mt-2">
            {loading ? (
              <Icon name="Loader2" size={18} className="animate-spin mr-2" />
            ) : (
              <Icon name="LogIn" size={18} className="mr-2" />
            )}
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;