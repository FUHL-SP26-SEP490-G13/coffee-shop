import { vouchers } from '../../lib/mockData';
import { Plus, Percent, DollarSign } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';

export function AdminVouchers() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">Vouchers & Discounts</h2>
          <p className="text-sm text-muted-foreground">Create and manage promotional codes</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {vouchers.map((voucher) => {
          const usagePercentage = (voucher.usageCount / voucher.usageLimit) * 100;
          const daysUntilExpiry = Math.ceil(
            (new Date(voucher.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return (
            <Card key={voucher.id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {voucher.type === 'percentage' ? (
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Percent className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm mb-1">
                      {voucher.type === 'percentage'
                        ? `${voucher.discount}% OFF`
                        : `$${voucher.discount} OFF`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Min. order: ${voucher.minOrder}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    daysUntilExpiry <= 7
                      ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                      : ''
                  }
                >
                  {daysUntilExpiry}d left
                </Badge>
              </div>

              <div className="bg-secondary rounded-lg p-3 mb-3">
                <div className="font-mono text-lg text-center">{voucher.code}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span>
                    {voucher.usageCount} / {voucher.usageLimit}
                  </span>
                </div>
                <Progress value={usagePercentage} />
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
