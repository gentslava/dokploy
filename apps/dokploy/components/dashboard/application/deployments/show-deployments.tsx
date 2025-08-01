import { DateTooltip } from '@/components/shared/date-tooltip';
import { DialogAction } from '@/components/shared/dialog-action';
import { StatusTooltip } from '@/components/shared/status-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type RouterOutputs, api } from '@/utils/api';
import { Clock, Loader2, RefreshCcw, RocketIcon, Settings } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShowRollbackSettings } from '../rollbacks/show-rollback-settings';
import { CancelQueues } from './cancel-queues';
import { RefreshToken } from './refresh-token';
import { ShowDeployment } from './show-deployment';

interface Props {
  id: string;
  type: 'application' | 'compose' | 'schedule' | 'server' | 'backup' | 'previewDeployment' | 'volumeBackup';
  refreshToken?: string;
  serverId?: string;
}

export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

export const ShowDeployments = ({ id, type, refreshToken, serverId }: Props) => {
  const { t } = useTranslation('dashboard');
  const [activeLog, setActiveLog] = useState<RouterOutputs['deployment']['all'][number] | null>(null);
  const { data: deployments, isLoading: isLoadingDeployments } = api.deployment.allByType.useQuery(
    {
      id,
      type,
    },
    {
      enabled: !!id,
      refetchInterval: 1000,
    }
  );

  const { mutateAsync: rollback, isLoading: isRollingBack } = api.rollback.rollback.useMutation();
  const { mutateAsync: killProcess, isLoading: isKillingProcess } = api.deployment.killProcess.useMutation();

  const [url, setUrl] = React.useState('');
  useEffect(() => {
    setUrl(document.location.origin);
  }, []);

  return (
    <Card className='bg-background border-none'>
      <CardHeader className='flex flex-row items-center justify-between flex-wrap gap-2'>
        <div className='flex flex-col gap-2'>
          <CardTitle className='text-xl'>{t('dashboard.deployments.deployments')}</CardTitle>
          <CardDescription>{t('dashboard.deployments.seeLastDeployments', { type })}</CardDescription>
        </div>
        <div className='flex flex-row items-center gap-2'>
          {(type === 'application' || type === 'compose') && <CancelQueues id={id} type={type} />}
          {type === 'application' && (
            <ShowRollbackSettings applicationId={id}>
              <Button variant='outline'>
                {t('dashboard.deployments.configureRollbacks')} <Settings className='size-4' />
              </Button>
            </ShowRollbackSettings>
          )}
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {refreshToken && (
          <div className='flex flex-col gap-2 text-sm'>
            <span>{t('dashboard.deployments.redeployInstructions')}</span>
            <div className='flex flex-row items-center gap-2 flex-wrap'>
              <span>{t('dashboard.deployments.webhookUrl')}: </span>
              <div className='flex flex-row items-center gap-2'>
                <span className='break-all text-muted-foreground'>
                  {`${url}/api/deploy${type === 'compose' ? '/compose' : ''}/${refreshToken}`}
                </span>
                {(type === 'application' || type === 'compose') && <RefreshToken id={id} type={type} />}
              </div>
            </div>
          </div>
        )}

        {isLoadingDeployments ? (
          <div className='flex w-full flex-row items-center justify-center gap-3 pt-10 min-h-[25vh]'>
            <Loader2 className='size-6 text-muted-foreground animate-spin' />
            <span className='text-base text-muted-foreground'>{t('dashboard.deployments.loadingDeployments')}</span>
          </div>
        ) : deployments?.length === 0 ? (
          <div className='flex w-full flex-col items-center justify-center gap-3 pt-10 min-h-[25vh]'>
            <RocketIcon className='size-8 text-muted-foreground' />
            <span className='text-base text-muted-foreground'>{t('dashboard.deployments.noDeploymentsFound')}</span>
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {deployments?.map((deployment, index) => (
              <div
                key={deployment.deploymentId}
                className='flex items-center justify-between rounded-lg border p-4 gap-2'
              >
                <div className='flex flex-col'>
                  <span className='flex items-center gap-4 font-medium capitalize text-foreground'>
                    {index + 1}. {deployment.status}
                    <StatusTooltip status={deployment?.status} className='size-2.5' />
                  </span>
                  <span className='text-sm text-muted-foreground'>{deployment.title}</span>
                  {deployment.description && (
                    <span className='break-all text-sm text-muted-foreground'>{deployment.description}</span>
                  )}
                </div>
                <div className='flex flex-col items-end gap-2'>
                  <div className='text-sm capitalize text-muted-foreground flex items-center gap-2'>
                    <DateTooltip date={deployment.createdAt} />
                    {deployment.startedAt && deployment.finishedAt && (
                      <Badge variant='outline' className='text-[10px] gap-1 flex items-center'>
                        <Clock className='size-3' />
                        {formatDuration(
                          Math.floor(
                            (new Date(deployment.finishedAt).getTime() - new Date(deployment.startedAt).getTime()) /
                              1000
                          )
                        )}
                      </Badge>
                    )}
                  </div>

                  <div className='flex flex-row items-center gap-2'>
                    {deployment.pid && deployment.status === 'running' && (
                      <DialogAction
                        title={t('dashboard.deployments.killProcess')}
                        description={t('dashboard.deployments.killProcessConfirmation')}
                        type='default'
                        onClick={async () => {
                          await killProcess({
                            deploymentId: deployment.deploymentId,
                          })
                            .then(() => {
                              toast.success(t('dashboard.deployments.processKilledSuccessfully'));
                            })
                            .catch(() => {
                              toast.error(t('dashboard.deployments.errorKillingProcess'));
                            });
                        }}
                      >
                        <Button variant='destructive' size='sm' isLoading={isKillingProcess}>
                          {t('dashboard.deployments.killProcess')}
                        </Button>
                      </DialogAction>
                    )}
                    <Button
                      onClick={() => {
                        setActiveLog(deployment);
                      }}
                    >
                      {t('dashboard.deployments.view')}
                    </Button>

                    {deployment?.rollback && deployment.status === 'done' && type === 'application' && (
                      <DialogAction
                        title={t('dashboard.deployments.rollbackToDeployment')}
                        description={t('dashboard.deployments.rollbackConfirmation')}
                        type='default'
                        onClick={async () => {
                          await rollback({
                            rollbackId: deployment.rollback.rollbackId,
                          })
                            .then(() => {
                              toast.success(t('dashboard.deployments.rollbackInitiatedSuccessfully'));
                            })
                            .catch(() => {
                              toast.error(t('dashboard.deployments.errorInitiatingRollback'));
                            });
                        }}
                      >
                        <Button variant='secondary' size='sm' isLoading={isRollingBack}>
                          <RefreshCcw className='size-4 text-primary group-hover:text-red-500' />
                          {t('dashboard.deployments.rollback')}
                        </Button>
                      </DialogAction>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <ShowDeployment
          serverId={serverId}
          open={Boolean(activeLog && activeLog.logPath !== null)}
          onClose={() => setActiveLog(null)}
          logPath={activeLog?.logPath || ''}
          errorMessage={activeLog?.errorMessage || ''}
        />
      </CardContent>
    </Card>
  );
};
