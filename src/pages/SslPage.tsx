import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/KpiCard';
import { SslIndicator, getSslStatus } from '@/components/shared/SslIndicator';
import { Shield, Calendar, Globe, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useApplication, useLatestCheck } from '@/hooks/useMonitoring';
import { formatDateTime } from '@/services/mockData';

export function SslPage() {
  const { app } = useApplication();
  const { check, loading } = useLatestCheck(app?.id);

  if (loading || !check) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>;
  }

  const sslStatus = getSslStatus(check.ssl_days_remaining);
  const expirationDate = check.ssl_expiration
    ? formatDateTime(check.ssl_expiration)
    : '—';

  const statusInfo = {
    healthy: { icon: CheckCircle2, text: 'Le certificat est valide et dispose de plus de 30 jours avant expiration.' },
    warning: { icon: AlertTriangle, text: 'Le certificat expire dans moins de 30 jours. Pensez à le renouveler.' },
    critical: { icon: AlertTriangle, text: 'Le certificat expire dans moins de 7 jours. Renouvellement urgent requis.' },
    expired: { icon: XCircle, text: 'Le certificat est expiré. Action immédiate requise.' },
  };
  const InfoIcon = statusInfo[sslStatus].icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">SSL</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Surveillance du certificat SSL/TLS
        </p>
      </div>

      {/* SSL Status banner */}
      <Card className="p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
              sslStatus === 'healthy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' :
              sslStatus === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' :
              'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
            }`}>
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut SSL</p>
              <SslIndicator daysRemaining={check.ssl_days_remaining} className="text-base" />
            </div>
          </div>
          <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm max-w-md ${
            sslStatus === 'healthy' ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' :
            sslStatus === 'warning' ? 'border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' :
            'border-red-200 bg-red-50/50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'
          }`}>
            <InfoIcon className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{statusInfo[sslStatus].text}</span>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Statut SSL"
          value={check.ssl_valid === 'OK' ? 'Valide' : 'Invalide'}
          icon={Shield}
          accent={check.ssl_valid === 'OK' ? 'success' : 'danger'}
        />
        <KpiCard
          label="Jours restants"
          value={`${check.ssl_days_remaining} j`}
          icon={Clock}
          accent={check.ssl_days_remaining > 30 ? 'success' : check.ssl_days_remaining > 7 ? 'warning' : 'danger'}
        />
        <KpiCard
          label="Date d'expiration"
          value={check.ssl_expiration ? formatDateTime(check.ssl_expiration).split(' ')[0] : '—'}
          icon={Calendar}
          accent="default"
        />
        <KpiCard
          label="URL surveillée"
          value={<span className="text-sm">{app?.url ?? '—'}</span>}
          icon={Globe}
          accent="default"
        />
      </div>

      {/* Detail card */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du certificat</CardTitle>
          <CardDescription>Informations techniques du certificat SSL/TLS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">URL surveillée</span>
              <span className="text-sm font-medium font-mono">{check.url}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Certificat valide</span>
              <span className="text-sm font-medium">{check.ssl_valid === 'OK' ? 'Oui' : 'Non'}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Date d'expiration</span>
              <span className="text-sm font-medium">{expirationDate}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Jours avant expiration</span>
              <span className={`text-sm font-bold ${check.ssl_days_remaining <= 7 ? 'text-red-600 dark:text-red-400' : check.ssl_days_remaining <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {check.ssl_days_remaining} jours
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SSL legend */}
      <Card>
        <CardHeader>
          <CardTitle>Légende des seuils</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm">Plus de 30 jours</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm">Entre 7 et 30 jours</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm">Moins de 7 jours</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <div className="h-3 w-3 rounded-full bg-red-700" />
              <span className="text-sm">Certificat expiré</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
