# 🧹 SCRIPT LIMPEZA VERCEL - Remove deployments antigos

Write-Host "🧹 LIMPANDO DEPLOYMENTS ANTIGOS DO VERCEL" -ForegroundColor Red

# Lista de deployments antigos para deletar (mantém só os 2 mais recentes)
$deploymentsToDelete = @(
    "https://ai-synth-fruqgvl6i-dj-correas-projects.vercel.app",
    "https://ai-synth-49d6ke2eu-dj-correas-projects.vercel.app", 
    "https://ai-synth-c57g1xdh3-dj-correas-projects.vercel.app",
    "https://ai-synth-2u1kk1bzv-dj-correas-projects.vercel.app",
    "https://ai-synth-p4dlifzpi-dj-correas-projects.vercel.app",
    "https://ai-synth-eb73gae4e-dj-correas-projects.vercel.app"
)

Write-Host "Deletando $($deploymentsToDelete.Count) deployments antigos..." -ForegroundColor Yellow

foreach ($deployment in $deploymentsToDelete) {
    Write-Host "🗑️  Deletando: $deployment" -ForegroundColor Gray
    try {
        vercel rm $deployment --yes
        Write-Host "✅ Deletado com sucesso" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro ao deletar: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "🎯 VERIFICANDO DEPLOYMENTS RESTANTES:" -ForegroundColor Cyan
vercel ls

Write-Host ""
Write-Host "🔗 TESTANDO DOMÍNIO PRINCIPAL:" -ForegroundColor Cyan
Write-Host "URL: https://ai-synth.vercel.app" -ForegroundColor Blue

Write-Host ""
Write-Host "✅ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host "Agora teste o domínio principal no navegador para ver se o erro foi corrigido." -ForegroundColor White
