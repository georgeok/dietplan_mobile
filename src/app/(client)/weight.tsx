import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useWeightLogs, useLogWeight, useDeleteWeight } from '@/hooks/useWeightLogs';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { WeightStatCard } from '@/components/client/WeightStatCard';
import { WeightChart } from '@/components/client/WeightChart';
import { LogWeightForm } from '@/components/client/LogWeightForm';
import { WeightHistoryRow } from '@/components/client/WeightHistoryRow';

export default function WeightScreen() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const clientId = role.kind === 'client' ? role.clientId : null;
  const logsQuery = useWeightLogs(clientId);
  const logWeight = useLogWeight(clientId);
  const deleteWeight = useDeleteWeight(clientId);

  const logs = logsQuery.data ?? [];
  const reversed = [...logs].reverse();

  if (logsQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={logsQuery.isRefetching} onRefresh={() => logsQuery.refetch()} />
        }
      >
        <PageHeader title={t('weight.title')} />
        {logs.length === 0 ? (
          <EmptyState title={t('weight.empty')} />
        ) : (
          <>
            <WeightStatCard logs={logs} />
            <WeightChart logs={logs} />
          </>
        )}
        <LogWeightForm onSubmit={(kg) => logWeight.mutateAsync({ kg })} />
        {reversed.length > 0 ? (
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {reversed.map((log) => (
              <WeightHistoryRow key={log.id} log={log} onDelete={(id) => deleteWeight.mutate(id)} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
