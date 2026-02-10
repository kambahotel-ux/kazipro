import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TestConfigPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, success, message, data, time: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setResults([]);
    setLoading(true);

    try {
      // Test 1: Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        addResult('Authentification', false, authError.message);
      } else if (!user) {
        addResult('Authentification', false, 'Utilisateur non connecté');
      } else {
        addResult('Authentification', true, `Connecté: ${user.email}`, user);
      }

      // Test 2: SELECT sur la table
      const { data: selectData, error: selectError } = await supabase
        .from('configuration_paiement_globale')
        .select('*');

      if (selectError) {
        addResult('SELECT', false, selectError.message, selectError);
      } else if (!selectData || selectData.length === 0) {
        addResult('SELECT', false, 'Aucune ligne trouvée dans la table');
      } else {
        addResult('SELECT', true, `${selectData.length} ligne(s) trouvée(s)`, selectData[0]);
      }

      // Test 3: SELECT avec .eq()
      const { data: selectEqData, error: selectEqError } = await supabase
        .from('configuration_paiement_globale')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (selectEqError) {
        addResult('SELECT avec .eq()', false, selectEqError.message, selectEqError);
      } else if (!selectEqData) {
        addResult('SELECT avec .eq()', false, 'Ligne avec ID spécifique non trouvée');
      } else {
        addResult('SELECT avec .eq()', true, 'Ligne trouvée avec ID correct', selectEqData);
      }

      // Test 4: UPDATE simple
      const testValue = Math.random() * 10;
      const { data: updateData, error: updateError } = await supabase
        .from('configuration_paiement_globale')
        .update({ 
          commission_main_oeuvre: testValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .select();

      if (updateError) {
        addResult('UPDATE', false, updateError.message, updateError);
      } else if (!updateData || updateData.length === 0) {
        addResult('UPDATE', false, 'UPDATE n\'a affecté aucune ligne');
      } else {
        addResult('UPDATE', true, `Valeur mise à jour: ${testValue.toFixed(2)}%`, updateData[0]);
      }

      // Test 5: Vérifier que l'UPDATE a bien fonctionné
      const { data: verifyData, error: verifyError } = await supabase
        .from('configuration_paiement_globale')
        .select('commission_main_oeuvre')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (verifyError) {
        addResult('Vérification UPDATE', false, verifyError.message);
      } else if (Math.abs(verifyData.commission_main_oeuvre - testValue) < 0.01) {
        addResult('Vérification UPDATE', true, 'La valeur a bien été modifiée en base!');
      } else {
        addResult('Vérification UPDATE', false, 
          `Valeur attendue: ${testValue.toFixed(2)}, valeur réelle: ${verifyData.commission_main_oeuvre}`);
      }

      // Test 6: Vérifier les policies RLS
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_policies_info', {}, { count: 'exact' })
        .catch(() => ({ data: null, error: { message: 'RPC non disponible (normal)' } }));

      if (policiesData) {
        addResult('Policies RLS', true, 'Policies récupérées', policiesData);
      } else {
        addResult('Policies RLS', false, 'Impossible de récupérer les policies (test optionnel)');
      }

    } catch (error: any) {
      addResult('Erreur générale', false, error.message, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🔧 Test Configuration Paiement</h1>
          <p className="text-muted-foreground mt-2">
            Diagnostic complet de la connexion et des permissions
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

                {results.filter(r => !r.success).length === 0 ? (
                  <Alert className="bg-green-50 border-green-500 mt-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      <strong>✅ Tous les tests sont passés!</strong>
                      <br />
                      La configuration devrait fonctionner correctement.
                      Si tu as encore des problèmes, vérifie la console du navigateur.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-red-50 border-red-500 mt-4">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      <strong>❌ Certains tests ont échoué</strong>
                      <br />
                      Vérifie les erreurs ci-dessus et exécute le script FIX_CONFIG_UPDATE_COMPLET.sql
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
