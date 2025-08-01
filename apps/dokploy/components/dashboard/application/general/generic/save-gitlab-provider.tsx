import { GitlabIcon } from '@/components/icons/data-tools-icons';
import { AlertBlock } from '@/components/shared/alert-block';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon, ChevronsUpDown, HelpCircle, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const GitlabProviderSchema = z.object({
  buildPath: z.string().min(1, 'Path is required').default('/'),
  repository: z
    .object({
      repo: z.string().min(1, 'Repo is required'),
      owner: z.string().min(1, 'Owner is required'),
      gitlabPathNamespace: z.string().min(1),
      id: z.number().nullable(),
    })
    .required(),
  branch: z.string().min(1, 'Branch is required'),
  gitlabId: z.string().min(1, 'Gitlab Provider is required'),
  watchPaths: z.array(z.string()).optional(),
  enableSubmodules: z.boolean().default(false),
});

type GitlabProvider = z.infer<typeof GitlabProviderSchema>;

interface Props {
  applicationId: string;
}

export const SaveGitlabProvider = ({ applicationId }: Props) => {
  const { t } = useTranslation('dashboard');
  const { data: gitlabProviders } = api.gitlab.gitlabProviders.useQuery();
  const { data, refetch } = api.application.one.useQuery({ applicationId });

  const { mutateAsync, isLoading: isSavingGitlabProvider } = api.application.saveGitlabProvider.useMutation();

  const GitlabProviderSchema = z.object({
    buildPath: z.string().min(1, t('dashboard.gitlabProvider.pathRequired')).default('/'),
    repository: z
      .object({
        repo: z.string().min(1, t('dashboard.gitlabProvider.repoRequired')),
        owner: z.string().min(1, t('dashboard.gitlabProvider.ownerRequired')),
        gitlabPathNamespace: z.string().min(1),
        id: z.number().nullable(),
      })
      .required(),
    branch: z.string().min(1, t('dashboard.gitlabProvider.branchRequired')),
    gitlabId: z.string().min(1, t('dashboard.gitlabProvider.gitlabProviderRequired')),
    watchPaths: z.array(z.string()).optional(),
    enableSubmodules: z.boolean().default(false),
  });

  type GitlabProvider = z.infer<typeof GitlabProviderSchema>;

  const gitlabUrl = useMemo(() => {
    const url = gitlabProviders?.find((provider) => provider.gitlabId === gitlabId)?.gitlabUrl;

    const gitlabUrl = url?.replace(/\/$/, '');

    return gitlabUrl || 'https://gitlab.com';
  }, [gitlabId, gitlabProviders]);

  const {
    data: repositories,
    isLoading: isLoadingRepositories,
    error,
  } = api.gitlab.getGitlabRepositories.useQuery(
    {
      gitlabId,
    },
    {
      enabled: !!gitlabId,
    }
  );

  const repository = form.watch('repository');
  const gitlabId = form.watch('gitlabId');

  const {
    data: repositories,
    isLoading: isLoadingRepositories,
    error,
  } = api.gitlab.getGitlabRepositories.useQuery(
    {
      gitlabId,
    },
    {
      enabled: !!gitlabId,
    }
  );

  const {
    data: branches,
    fetchStatus,
    status,
  } = api.gitlab.getGitlabBranches.useQuery(
    {
      owner: repository?.owner,
      repo: repository?.repo,
      id: repository?.id || 0,
      gitlabId: gitlabId,
    },
    {
      enabled: !!repository?.owner && !!repository?.repo && !!gitlabId,
    }
  );

  useEffect(() => {
    if (data) {
      form.reset({
        branch: data.gitlabBranch || '',
        repository: {
          repo: data.gitlabRepository || '',
          owner: data.gitlabOwner || '',
          gitlabPathNamespace: data.gitlabPathNamespace || '',
          id: data.gitlabProjectId,
        },
        buildPath: data.gitlabBuildPath || '/',
        gitlabId: data.gitlabId || '',
        watchPaths: data.watchPaths || [],
        enableSubmodules: data.enableSubmodules ?? false,
      });
    }
  }, [form.reset, data?.applicationId, form]);

  const onSubmit = async (data: GitlabProvider) => {
    await mutateAsync({
      gitlabBranch: data.branch,
      gitlabRepository: data.repository.repo,
      gitlabOwner: data.repository.owner,
      gitlabBuildPath: data.buildPath,
      gitlabId: data.gitlabId,
      applicationId,
      gitlabProjectId: data.repository.id,
      gitlabPathNamespace: data.repository.gitlabPathNamespace,
      watchPaths: data.watchPaths || [],
      enableSubmodules: data.enableSubmodules,
    })
      .then(async () => {
        toast.success(t('dashboard.gitlabProvider.serviceProviderSaved'));
        await refetch();
      })
      .catch(() => {
        toast.error(t('dashboard.gitlabProvider.errorSavingGitlabProvider'));
      });
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='grid w-full gap-4 py-3'>
          {error && <AlertBlock type='error'>{error?.message}</AlertBlock>}
          <div className='grid md:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='gitlabId'
              render={({ field }) => (
                <FormItem className='md:col-span-2 flex flex-col'>
                  <FormLabel>{t('dashboard.gitlabProvider.gitlabAccount')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('repository', {
                        owner: '',
                        repo: '',
                        id: null,
                        gitlabPathNamespace: '',
                      });
                      form.setValue('branch', '');
                    }}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('dashboard.gitlabProvider.selectGitlabAccount')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gitlabProviders?.map((gitlabProvider) => (
                        <SelectItem key={gitlabProvider.gitlabId} value={gitlabProvider.gitlabId}>
                          {gitlabProvider.gitProvider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='repository'
              render={({ field }) => (
                <FormItem className='md:col-span-2 flex flex-col'>
                  <div className='flex items-center justify-between'>
                    <FormLabel>{t('dashboard.gitlabProvider.repository')}</FormLabel>
                    {field.value.owner && field.value.repo && (
                      <Link
                        href={`https://gitlab.com/${field.value.owner}/${field.value.repo}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 text-sm text-muted-foreground hover:text-primary'
                      >
                        <GitlabIcon className='h-4 w-4' />
                        <span>{t('dashboard.gitlabProvider.viewRepository')}</span>
                      </Link>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn('w-full justify-between !bg-input', !field.value && 'text-muted-foreground')}
                        >
                          {isLoadingRepositories
                            ? t('dashboard.gitlabProvider.loading')
                            : field.value.owner
                            ? repositories?.find((repo) => repo.name === field.value.repo)?.name
                            : t('dashboard.gitlabProvider.selectRepository')}

                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='p-0' align='start'>
                      <Command>
                        <CommandInput placeholder={t('dashboard.gitlabProvider.searchRepository')} className='h-9' />
                        {isLoadingRepositories && (
                          <span className='py-6 text-center text-sm'>
                            {t('dashboard.gitlabProvider.loadingRepositories')}
                          </span>
                        )}
                        <CommandEmpty>{t('dashboard.gitlabProvider.noRepositoriesFound')}</CommandEmpty>
                        <ScrollArea className='h-96'>
                          <CommandGroup>
                            {repositories && repositories.length === 0 && (
                              <CommandEmpty>{t('dashboard.gitlabProvider.noRepositoriesFound')}</CommandEmpty>
                            )}
                            {repositories?.map((repo) => {
                              return (
                                <CommandItem
                                  value={repo.url}
                                  key={repo.url}
                                  onSelect={() => {
                                    form.setValue('repository', {
                                      owner: repo.owner.username as string,
                                      repo: repo.name,
                                      id: repo.id,
                                      gitlabPathNamespace: repo.url,
                                    });
                                    form.setValue('branch', '');
                                  }}
                                >
                                  <span className='flex items-center gap-2'>
                                    <span>{repo.name}</span>
                                    <span className='text-muted-foreground text-xs'>{repo.owner.username}</span>
                                  </span>
                                  <CheckIcon
                                    className={cn(
                                      'ml-auto h-4 w-4',
                                      repo.url === field.value.gitlabPathNamespace ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </ScrollArea>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.repository && (
                    <p className={cn('text-sm font-medium text-destructive')}>
                      {t('dashboard.gitlabProvider.repositoryRequired')}
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='branch'
              render={({ field }) => (
                <FormItem className='block w-full'>
                  <FormLabel>{t('dashboard.gitlabProvider.branch')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn(' w-full justify-between !bg-input', !field.value && 'text-muted-foreground')}
                        >
                          {status === 'loading' && fetchStatus === 'fetching'
                            ? t('dashboard.gitlabProvider.loading')
                            : field.value
                            ? branches?.find((branch) => branch.name === field.value)?.name
                            : t('dashboard.gitlabProvider.selectBranch')}
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='p-0' align='start'>
                      <Command>
                        <CommandInput placeholder={t('dashboard.gitlabProvider.searchBranch')} className='h-9' />
                        {status === 'loading' && fetchStatus === 'fetching' && (
                          <span className='py-6 text-center text-sm text-muted-foreground'>
                            {t('dashboard.gitlabProvider.loadingBranches')}
                          </span>
                        )}
                        {!repository?.owner && (
                          <span className='py-6 text-center text-sm text-muted-foreground'>
                            {t('dashboard.gitlabProvider.selectRepository')}
                          </span>
                        )}
                        <ScrollArea className='h-96'>
                          <CommandEmpty>{t('dashboard.gitlabProvider.noBranchFound')}</CommandEmpty>

                          <CommandGroup>
                            {branches?.map((branch) => (
                              <CommandItem
                                value={branch.name}
                                key={branch.commit.id}
                                onSelect={() => {
                                  form.setValue('branch', branch.name);
                                }}
                              >
                                {branch.name}
                                <CheckIcon
                                  className={cn(
                                    'ml-auto h-4 w-4',
                                    branch.name === field.value ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </ScrollArea>
                      </Command>
                    </PopoverContent>

                    <FormMessage />
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='buildPath'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dashboard.gitlabProvider.buildPath')}</FormLabel>
                  <FormControl>
                    <Input placeholder='/' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='watchPaths'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <div className='flex items-center gap-2'>
                    <FormLabel>{t('dashboard.gitlabProvider.watchPaths')}</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className='size-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('dashboard.gitlabProvider.watchPathsTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className='flex flex-wrap gap-2 mb-2'>
                    {field.value?.map((path, index) => (
                      <Badge key={index} variant='secondary' className='flex items-center gap-1'>
                        {path}
                        <X
                          className='size-3 cursor-pointer hover:text-destructive'
                          onClick={() => {
                            const newPaths = [...(field.value || [])];
                            newPaths.splice(index, 1);
                            field.onChange(newPaths);
                          }}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className='flex gap-2'>
                    <FormControl>
                      <Input
                        placeholder={t('dashboard.gitProvider.watchPathsPlaceholder')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.currentTarget;
                            const path = input.value.trim();
                            if (path) {
                              field.onChange([...(field.value || []), path]);
                              input.value = '';
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      variant='secondary'
                      onClick={() => {
                        const input = document.querySelector(
                          `input[placeholder*="${t('dashboard.gitProvider.watchPathsPlaceholder')}"]`
                        ) as HTMLInputElement;
                        const value = input.value.trim();
                        if (value) {
                          const newPaths = [...(field.value || []), value];
                          form.setValue('watchPaths', newPaths);
                          input.value = '';
                        }
                      }}
                    >
                      {t('dashboard.gitProvider.add')}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='enableSubmodules'
              render={({ field }) => (
                <FormItem className='flex items-center space-x-2'>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className='!mt-0'>{t('dashboard.gitlabProvider.enableSubmodules')}</FormLabel>
                </FormItem>
              )}
            />
          </div>
          <div className='flex w-full justify-end'>
            <Button isLoading={isSavingGitlabProvider} type='submit' className='w-fit'>
              {t('dashboard.gitlabProvider.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
