import { AlertBlock } from '@/components/shared/alert-block';
import { CodeEditor } from '@/components/shared/code-editor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface Props {
  serviceId: string;
  serviceType: 'application' | 'postgres' | 'redis' | 'mongo' | 'redis' | 'mysql' | 'mariadb' | 'compose';
  refetch: () => void;
  children?: React.ReactNode;
}

const mountSchema = z.object({
  mountPath: z.string().min(1, 'Mount path required'),
});

const mySchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('bind'),
      hostPath: z.string().min(1, 'Host path required'),
    })
    .merge(mountSchema),
  z
    .object({
      type: z.literal('volume'),
      volumeName: z.string().min(1, 'Volume name required'),
    })
    .merge(mountSchema),
  z
    .object({
      type: z.literal('file'),
      filePath: z.string().min(1, 'File path required'),
      content: z.string().optional(),
    })
    .merge(mountSchema),
]);

type AddMount = z.infer<typeof mySchema>;

export const AddVolumes = ({ serviceId, serviceType, refetch, children = <PlusIcon className='h-4 w-4' /> }: Props) => {
  const { t } = useTranslation('dashboard');
  const [isOpen, setIsOpen] = useState(false);
  const { mutateAsync } = api.mounts.create.useMutation();
  const form = useForm<AddMount>({
    defaultValues: {
      type: serviceType === 'compose' ? 'file' : 'bind',
      hostPath: '',
      mountPath: serviceType === 'compose' ? '/' : '',
    },
    resolver: zodResolver(mySchema),
  });
  const type = form.watch('type');

  useEffect(() => {
    form.reset();
  }, [form, form.reset, form.formState.isSubmitSuccessful]);

  const onSubmit = async (data: AddMount) => {
    if (data.type === 'bind') {
      await mutateAsync({
        serviceId,
        hostPath: data.hostPath,
        mountPath: data.mountPath,
        type: data.type,
        serviceType,
      })
        .then(() => {
          toast.success(t('dashboard.volumes.mountCreated'));
          setIsOpen(false);
        })
        .catch(() => {
          toast.error(t('dashboard.volumes.errorCreatingBindMount'));
        });
    } else if (data.type === 'volume') {
      await mutateAsync({
        serviceId,
        volumeName: data.volumeName,
        mountPath: data.mountPath,
        type: data.type,
        serviceType,
      })
        .then(() => {
          toast.success(t('dashboard.volumes.mountCreated'));
          setIsOpen(false);
        })
        .catch(() => {
          toast.error(t('dashboard.volumes.errorCreatingVolumeMount'));
        });
    } else if (data.type === 'file') {
      await mutateAsync({
        serviceId,
        content: data.content,
        mountPath: data.mountPath,
        filePath: data.filePath,
        type: data.type,
        serviceType,
      })
        .then(() => {
          toast.success(t('dashboard.volumes.mountCreated'));
          setIsOpen(false);
        })
        .catch(() => {
          toast.error(t('dashboard.volumes.errorCreatingFileMount'));
        });
    }

    refetch();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className='' asChild>
        <Button>{children}</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{t('dashboard.volumes.volumesMounts')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form id='hook-form-volume' onSubmit={form.handleSubmit(onSubmit)} className='grid w-full gap-8 '>
            {type === 'bind' && (
              <AlertBlock>
                <div className='space-y-2'>
                  <p>{t('dashboard.volumes.bindMountWarning')}</p>
                  <p className='text-sm text-muted-foreground'>
                    {t('dashboard.volumes.clusterWarning', {
                      strong: (chunks: string) => <strong className='font-bold'>{chunks}</strong>,
                    })}
                  </p>
                </div>
              </AlertBlock>
            )}
            <FormField
              control={form.control}
              defaultValue={form.control._defaultValues.type}
              name='type'
              render={({ field }) => (
                <FormItem className='space-y-3'>
                  <FormLabel className='text-muted-foreground'>{t('dashboard.volumes.selectMountType')}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'
                    >
                      {serviceType !== 'compose' && (
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl className='w-full'>
                            <div>
                              <RadioGroupItem value='bind' id='bind' className='peer sr-only' />
                              <Label
                                htmlFor='bind'
                                className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer'
                              >
                                {t('dashboard.volumes.bindMount')}
                              </Label>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}

                      {serviceType !== 'compose' && (
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl className='w-full'>
                            <div>
                              <RadioGroupItem value='volume' id='volume' className='peer sr-only' />
                              <Label
                                htmlFor='volume'
                                className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer'
                              >
                                {t('dashboard.volumes.volumeMount')}
                              </Label>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}

                      <FormItem
                        className={cn(
                          serviceType === 'compose' && 'col-span-3',
                          'flex items-center space-x-3 space-y-0'
                        )}
                      >
                        <FormControl className='w-full'>
                          <div>
                            <RadioGroupItem value='file' id='file' className='peer sr-only' />
                            <Label
                              htmlFor='file'
                              className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer'
                            >
                              {t('dashboard.volumes.fileMount')}
                            </Label>
                          </div>
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex flex-col gap-4'>
              <FormLabel className='text-lg font-semibold leading-none tracking-tight'>
                {t('dashboard.volumes.fillFields')}
              </FormLabel>
              <div className='flex flex-col gap-2'>
                {type === 'bind' && (
                  <FormField
                    control={form.control}
                    name='hostPath'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dashboard.volumes.hostPath')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('dashboard.volumes.hostPathPlaceholder')} {...field} />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {type === 'volume' && (
                  <FormField
                    control={form.control}
                    name='volumeName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dashboard.volumes.volumeName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('dashboard.volumes.volumeNamePlaceholder')}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {type === 'file' && (
                  <>
                    <FormField
                      control={form.control}
                      name='content'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('dashboard.volumes.content')}</FormLabel>
                          <FormControl>
                            <FormControl>
                              <CodeEditor
                                language='properties'
                                placeholder={`NODE_ENV=production
PORT=3000`}
                                className='h-96 font-mono'
                                {...field}
                              />
                            </FormControl>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='filePath'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('dashboard.volumes.filePath')}</FormLabel>
                          <FormControl>
                            <FormControl>
                              <Input placeholder={t('dashboard.volumes.filePathPlaceholder')} {...field} />
                            </FormControl>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {serviceType !== 'compose' && (
                  <FormField
                    control={form.control}
                    name='mountPath'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('dashboard.volumes.mountPath')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('dashboard.volumes.mountPathPlaceholder')} {...field} />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button isLoading={form.formState.isSubmitting} form='hook-form-volume' type='submit'>
              {t('dashboard.volumes.create')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
