import { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { requests } from '../../lib/mockData';
import { toast, Toaster } from 'sonner'


export function StaffRequests() {
  const [requestList, setRequestList] = useState(requests);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState('leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmitRequest = () => {
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill all fields');
      return;
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      staffId: '2', // Current staff ID
      type: requestType,
      startDate,
      endDate,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setRequestList([newRequest, ...requestList]);
    setIsDialogOpen(false);
    setStartDate('');
    setEndDate('');
    setReason('');
    toast.success('Request submitted successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-transparent';
      case 'approved':
        return 'bg-green-500/10 text-green-700 border-transparent';
      case 'rejected':
        return '';
      default:
        return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Requests</h1>
          <p className="text-muted-foreground mt-1">Manage your leave and overtime requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit New Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="type">Request Type</Label>
                <Select value={requestType} onValueChange={(value) => setRequestType(value)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">Leave Request</SelectItem>
                    <SelectItem value="overtime">Overtime Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for your request"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmitRequest} className="w-full">
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {requestList.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {request.type === 'leave' ? (
                      <Calendar className="w-5 h-5 text-primary" />
                    ) : (
                      <Clock className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg capitalize">{request.type} Request</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.startDate).toLocaleDateString()} -{' '}
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusColor(request.status)} className={`flex items-center gap-1 ${getStatusClassName(request.status)}`}>
                  {getStatusIcon(request.status)}
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Reason:</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                  {request.approvedAt && (
                    <span>
                      {request.status === 'approved' ? 'Approved' : 'Rejected'}:{' '}
                      {new Date(request.approvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {requestList.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">Submit your first request to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
