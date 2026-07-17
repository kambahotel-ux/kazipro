import { useState, useEffect } from 'react';
import { configPaiementApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestConfigPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: unknown) => {
    setResults(prev => [...prev, { test, success, message, data, time: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setResults([]);
    setLoading(true);

    try {
      if (!user) {
        addResult('Authentification', false, 'Utilisateur non connecté');
      } else {
        addResult('Authentification', true, `Connecté: ${user.email}`, user);
      }

      let configData: Record<string, unknown> | null = null;
      try {
        configData = await configPaiementApi.adminGet();
        if (configData && Object.keys(configData).length > 0) {
          addResult('adminGet', true, 'Configuration récupérée', configData);
        } else {
          addResult('adminGet', false, 'Configuration vide ou absente');
        }
      } catch (e: unknown) {
        addResult('adminGet', false, e instanceof Error ? e.message : 'Erreur adminGet');
      }

      if (configData) {
        const testValue = Math.round(Math.random() * 100) / 10;
        const original = configData.commission_main_oeuvre;
        try {
          const updated = await configPaiementApi.adminUpdate({
            commission_main_oeuvre: testValue,
          });
          addResult('adminUpdate', true, `Valeur mise à jour: ${testValue}%`, updated);

          const verified = await configPaiementApi.adminGet();
          const actual = Number(verified?.commission_main_oeuvre);
          if (Math.abs(actual - testValue) < 0.01) {
            addResult('Vérification UPDATE', true, 'La valeur a bien été modifiée via l\'API Laravel');
          } else {
            addResult('Vérification UPDATE', false, `Attendu ${testValue}, reçu ${actual}`);
          }

          if (original !== undefined) {
            await configPaiementApi.adminUpdate({ commission_main_oeuvre: original });
            addResult('Restauration', true, 'Valeur originale restaurée');
          }
        } catch (e: unknown) {
          addResult('adminUpdate', false, e instanceof Error ? e.message : 'Erreur adminUpdate');
        }
      }

      addResult('API Laravel', true, 'Tests exécutés via configPaiementApi (plus de Supabase)');
    } catch (error: unknown) {
      addResult('Erreur générale', false, error instanceof Error ? error.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, [user]);

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🔧 Test Configuration Paiement</h1>
          <p className="text-muted-foreground mt-2">
            Diagnostic de l&apos;API Laravel config-paiement (admin)
          </p>
        </div>

        <div className="flex gap-4">
          <Button onClick={runTests} disabled={loading}>
            {loading ? 'Tests en cours...' : 'Relancer les tests'}
          </Button>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={result.success ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  Test {index + 1}: {result.test}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Alert className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>

                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Voir les données
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Tests réussis:</strong>{' '}
                  <span className="text-green-600 font-bold">
                    {results.filter(r => r.success).length}
                  </span>
                  {' / '}
                  {results.length}
                </p>
                <p>
                  <strong>Tests échoués:</strong>{' '}
                  <span className="text-red-600 font-bold">
                    {results.filter(r => !r.success).length}
                  </span>
                  {' / '}
                  {results.length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
