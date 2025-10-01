import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface Employee {
  id: number;
  username: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  status: string;
}

interface Request {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  authorName: string;
}

interface Stats {
  totalEmployees: number;
  totalRequests: number;
  pendingRequests: number;
  resolvedRequests: number;
}

const API_URLS = {
  auth: 'https://functions.poehali.dev/79f52abf-6019-4592-8ac1-10540fea6d22',
  employees: 'https://functions.poehali.dev/4425d475-de9f-4e79-81ab-a9eb1376bb3a',
  requests: 'https://functions.poehali.dev/f165cb8c-9f6d-4368-936a-459297066088',
  stats: 'https://functions.poehali.dev/9998c142-84ea-4771-8292-c75afcabcb97',
  messages: 'https://functions.poehali.dev/1cd86b29-a8cf-4abb-bb82-bb5d458435f1'
};

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginError, setLoginError] = useState('');

  const [newEmployee, setNewEmployee] = useState({
    username: '',
    password: '',
    fullName: '',
    position: '',
    department: '',
    email: '',
    phone: ''
  });

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  const handleLogin = async () => {
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setLoginError('');
        loadData();
      } else {
        setLoginError(data.error || 'Неверные учетные данные');
      }
    } catch (error) {
      setLoginError('Ошибка подключения');
    }
  };

  const loadData = async () => {
    try {
      const [employeesRes, requestsRes, statsRes] = await Promise.all([
        fetch(API_URLS.employees),
        fetch(API_URLS.requests),
        fetch(API_URLS.stats)
      ]);

      const employeesData = await employeesRes.json();
      const requestsData = await requestsRes.json();
      const statsData = await statsRes.json();

      setEmployees(employeesData.employees || []);
      setRequests(requestsData.requests || []);
      setStats(statsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleCreateEmployee = async () => {
    try {
      const response = await fetch(API_URLS.employees, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee)
      });

      if (response.ok) {
        loadData();
        setNewEmployee({
          username: '',
          password: '',
          fullName: '',
          position: '',
          department: '',
          email: '',
          phone: ''
        });
      }
    } catch (error) {
      console.error('Ошибка создания сотрудника:', error);
    }
  };

  const handleDeactivateEmployee = async (employeeId: number) => {
    try {
      await fetch(API_URLS.employees, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: employeeId, status: 'inactive' })
      });
      loadData();
    } catch (error) {
      console.error('Ошибка деактивации сотрудника:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(API_URLS.requests, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          userId: user.id
        })
      });

      if (response.ok) {
        loadData();
        setNewRequest({
          title: '',
          description: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
    }
  };

  const handleUpdateRequestStatus = async (requestId: number, status: string) => {
    try {
      await fetch(API_URLS.requests, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status })
      });
      loadData();
    } catch (error) {
      console.error('Ошибка обновления заявки:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Icon name="Building2" size={32} className="text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">Корпоративный Портал</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Система управления персоналом и заявками</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Логин</Label>
                <Input
                  id="username"
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {loginError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {loginError}
                </div>
              )}
              <Button onClick={handleLogin} className="w-full" size="lg">
                <Icon name="LogIn" size={20} className="mr-2" />
                Войти в систему
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Building2" size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Корпоративный Портал</h1>
              <p className="text-xs text-muted-foreground">Система управления</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role === 'admin' ? 'Администратор' : 'Сотрудник'}
              </Badge>
            </div>
            <Button variant="outline" onClick={() => setUser(null)}>
              <Icon name="LogOut" size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">
              <Icon name="LayoutDashboard" size={18} className="mr-2" />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Icon name="Users" size={18} className="mr-2" />
              Сотрудники
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Icon name="FileText" size={18} className="mr-2" />
              Заявки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Сотрудников
                  </CardTitle>
                  <Icon name="Users" size={20} className="text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalEmployees || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Всего заявок
                  </CardTitle>
                  <Icon name="FileText" size={20} className="text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalRequests || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    В ожидании
                  </CardTitle>
                  <Icon name="Clock" size={20} className="text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{stats?.pendingRequests || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Решено
                  </CardTitle>
                  <Icon name="CheckCircle" size={20} className="text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats?.resolvedRequests || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Последние заявки</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {requests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{request.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{request.authorName}</p>
                        </div>
                        <Badge variant={
                          request.status === 'resolved' ? 'default' :
                          request.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                    {requests.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Заявок пока нет</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Активные сотрудники</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {employees.filter(e => e.status === 'active').slice(0, 5).map((employee) => (
                      <div key={employee.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={20} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{employee.fullName}</p>
                          <p className="text-xs text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                    ))}
                    {employees.filter(e => e.status === 'active').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Сотрудников пока нет</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Управление сотрудниками</CardTitle>
                {user.role === 'admin' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Icon name="UserPlus" size={18} className="mr-2" />
                        Добавить сотрудника
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Создание нового сотрудника</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Логин</Label>
                          <Input
                            value={newEmployee.username}
                            onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Пароль</Label>
                          <Input
                            type="password"
                            value={newEmployee.password}
                            onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>ФИО</Label>
                          <Input
                            value={newEmployee.fullName}
                            onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Должность</Label>
                          <Input
                            value={newEmployee.position}
                            onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Отдел</Label>
                          <Input
                            value={newEmployee.department}
                            onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Телефон</Label>
                          <Input
                            value={newEmployee.phone}
                            onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateEmployee} className="w-full">
                        Создать сотрудника
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">{employee.position} • {employee.department}</p>
                          <p className="text-xs text-muted-foreground mt-1">{employee.email} • {employee.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                          {employee.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                        {user.role === 'admin' && employee.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateEmployee(employee.id)}
                          >
                            <Icon name="UserX" size={16} className="mr-1" />
                            Деактивировать
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Сотрудников пока нет</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Система заявок</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon name="Plus" size={18} className="mr-2" />
                      Создать заявку
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новая заявка</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Заголовок</Label>
                        <Input
                          value={newRequest.title}
                          onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Описание</Label>
                        <Textarea
                          value={newRequest.description}
                          onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Приоритет</Label>
                        <Select
                          value={newRequest.priority}
                          onValueChange={(value) => setNewRequest({...newRequest, priority: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Низкий</SelectItem>
                            <SelectItem value="medium">Средний</SelectItem>
                            <SelectItem value="high">Высокий</SelectItem>
                            <SelectItem value="urgent">Срочный</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleCreateRequest} className="w-full">
                      Создать заявку
                    </Button>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{request.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Автор: {request.authorName} • {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant={
                            request.priority === 'urgent' ? 'destructive' :
                            request.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {request.priority}
                          </Badge>
                          <Badge variant={
                            request.status === 'resolved' ? 'default' :
                            request.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(request.id, 'in_progress')}
                            disabled={request.status === 'in_progress'}
                          >
                            В работе
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(request.id, 'resolved')}
                            disabled={request.status === 'resolved'}
                          >
                            Решено
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateRequestStatus(request.id, 'closed')}
                            disabled={request.status === 'closed'}
                          >
                            Закрыто
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Заявок пока нет</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
