import { useEffect, useMemo, useState } from 'react';
import { User, Mail, Phone, Edit2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { toast } from 'sonner';
import authenticationService from '../../services/authenticationService';

export function StaffProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await authenticationService.getProfile();
        if (!response?.success) {
          throw new Error(response?.message || 'Khong the tai profile');
        }

        if (isMounted) {
          setProfile(response.data || null);
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Khong the tai profile';
        if (isMounted) {
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!profile) return '';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || profile.username || profile.email || '';
  }, [profile]);

  const roleLabel = useMemo(() => {
    if (!profile) return '';
    return profile.role_name || profile.role || 'staff';
  }, [profile]);

    const genderLabel = useMemo(() => {
    if (!profile) return '';
    const gender = profile.gender;
    if (gender === 1) return 'Male';
    if (gender === 0) return 'Female';
    return 'Other';
  }, [profile]);

  const handleSave = () => {
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">My Profile</h1>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-6 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl">
                    {displayName
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                  <h3 className="text-xl font-semibold">{displayName || '...'}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {roleLabel}
                  </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="name"
                      value={displayName}
                      onChange={(event) => {
                        const value = event.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          first_name: value,
                          last_name: '',
                        }));
                      }}
                    />
                  ) : (
                    <span>{displayName || '-'}</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span>{profile?.email || '-'}</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={profile?.phone || ''}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span>{profile?.phone || '-'}</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {isEditing ? (
                    <Input 
                      id="gender"
                      value={genderLabel}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev, 
                          gender: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span>{genderLabel || '-'}</span>
                  )}
                </div>
            </div>

            {isLoading && (
              <div className="mt-4 text-sm text-muted-foreground">
                Loading information...
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {roleLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Employee ID</p>
                  <p className="text-sm text-muted-foreground">{profile?.id || '-'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your password</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
