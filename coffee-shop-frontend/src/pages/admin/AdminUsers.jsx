import { users } from '../../lib/mockData';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';

export function AdminUsers() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl mb-1">Users & Roles</h2>
        <p className="text-sm text-muted-foreground">Manage customer and staff accounts</p>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Loyalty Points</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      user.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : user.role === 'staff'
                        ? 'bg-accent/10 text-accent-foreground'
                        : ''
                    }
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.role === 'customer' ? (
                    <span className="text-primary">{user.points} pts</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
