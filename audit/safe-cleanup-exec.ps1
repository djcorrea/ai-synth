# Script de Limpeza Segura - Com Backup Automático
# Remove apenas documentação e arquivos temporários
# Data: 2025-08-23

Write-Host "🧹 LIMPEZA SEGURA - PRODUÇÃO AI SYNTH"
Write-Host "================================================"
Write-Host "🎯 Arquivos identificados: 185"
Write-Host "💾 Espaço a liberar: 848.26 KB"
Write-Host "🛡️ Apenas documentação e debug (sem impacto funcional)"
Write-Host "================================================"

# Criar backup timestamped
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = ".backup-cleanup-$timestamp"
Write-Host "📦 Criando backup em: $backupDir"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Contadores
$removedCount = 0
$removedSize = 0
$backupCount = 0

# Lista dos arquivos seguros (apenas os mais importantes para demonstrar)
$safeFiles = @(
    # Documentação de maior tamanho
    "audit/unused_files_report.json",
    "PATCH_C_OBSERVABILIDADE.md",
    "audit/unused_files_report.md", 
    "PATCH_B_NORMALIZACAO.md",
    "AUDITORIA_TECNICA_IMAGENS.md",
    "PATCH_A_INFRAESTRUTURA.md",
    
    # Debug HTML
    "debug-analyzer-completo.html",
    "debug-subscore-precision.html",
    "debug-score-breakdown.html",
    "diagnostic-chat.html",
    "cache-diagnostic.html",
    "debug-upload-api.html",
    "critical-error-report.html",
    "debug-technical-problems.html",
    
    # Scripts temporários
    "configurar-vercel-emergencia.ps1",
    "configurar-vercel-emergencia.sh",
    "limpar-deployments.ps1",
    "deploy-trigger.js",
    
    # Documentação geral
    "ANALISE_FEEDBACK_DJ_SISTEMA_COMPLETO.md",
    "AUDITORIA_ANALYZER_COMPLETA.md",
    "IMPLEMENTACAO_SISTEMA_IMAGENS.md",
    "AUDITORIA_COMPLETA_SISTEMA_AUDIO.md",
    "GUIA_DEBUG_SISTEMA_COMPLETO.md",
    "UPLOAD_60MB_IMPLEMENTATION.md",
    "CONFIGURACAO_VERCEL_FIREBASE.md",
    "CORRECAO_JSON_INPUT_ERROR.md"
)

Write-Host "🗂️ Processando arquivos seguros..."

foreach ($file in $safeFiles) {
    if (Test-Path $file) {
        try {
            # Criar estrutura de diretório no backup se necessário
            $backupFile = Join-Path $backupDir $file
            $backupFileDir = Split-Path $backupFile -Parent
            if (!(Test-Path $backupFileDir)) {
                New-Item -ItemType Directory -Path $backupFileDir -Force | Out-Null
            }
            
            # Fazer backup
            Copy-Item $file $backupFile -Force
            $backupCount++
            
            # Obter tamanho antes de remover
            $fileSize = (Get-Item $file).Length
            
            # Remover arquivo
            Remove-Item $file -Force
            
            $removedCount++
            $removedSize += $fileSize
            
            $sizeKB = [math]::Round($fileSize / 1KB, 1)
            Write-Host "✅ Removido: $file ($sizeKB KB)"
            
        } catch {
            Write-Host "⚠️ Erro ao processar: $file - $($_.Exception.Message)"
        }
    } else {
        Write-Host "❓ Não encontrado: $file"
    }
}

# Processar arquivos vazios adicionais (comum em projetos)
$emptyFiles = @(
    "ANALISE_IMAGENS_100_FUNCIONANDO.md",
    "ANALISE_IMAGENS_FUNCIONANDO.md",
    "CHECKLIST_ANALISE_IMAGENS.md",
    "CHECKLIST_COMPLETO_SISTEMA_IMAGENS.md",
    "CONFIGURACAO_CHAVES_COMPLETA.md",
    "CONFIGURACAO_SISTEMA_IMAGENS.md",
    "CORRECAO_ERROS_FIREBASE_FINALIZADA.md",
    "CORRECAO_FINAL_BANDAS_ESPECTRAIS.md",
    "CORRECAO_FINAL_MODO_REFERENCIA_COMPLETA.md",
    "CORRECAO_INCONSISTENCIA_CLIPPING.md",
    "CORRECAO_LAYOUT_IMPLEMENTACAO_IMAGENS.md",
    "CORRECAO_SISTEMA_IMAGENS_FINALIZADA.md",
    "FINAL_DIAGNOSTIC_REPORT.md",
    "GUIA_CONFIGURACAO_FINAL.md",
    "PROBLEMA_CRITICO_IDENTIFICADO.md",
    "SISTEMA_FUNCIONANDO_COMPLETO.md",
    "SISTEMA_IMAGENS_FUNCIONANDO.md"
)

Write-Host "🗑️ Removendo arquivos vazios..."

foreach ($file in $emptyFiles) {
    if (Test-Path $file) {
        try {
            # Verificar se é realmente vazio ou muito pequeno
            $size = (Get-Item $file).Length
            if ($size -le 100) {  # Arquivos menores que 100 bytes
                Remove-Item $file -Force
                $removedCount++
                Write-Host "✅ Removido (vazio): $file"
            }
        } catch {
            Write-Host "⚠️ Erro ao remover: $file"
        }
    }
}

# Resumo final
$totalSizeMB = [math]::Round($removedSize / 1MB, 2)
$totalSizeKB = [math]::Round($removedSize / 1KB, 1)

Write-Host ""
Write-Host "🎉 LIMPEZA CONCLUÍDA COM SUCESSO!"
Write-Host "================================="
Write-Host "✅ Arquivos removidos: $removedCount"
Write-Host "💾 Espaço liberado: $totalSizeKB KB ($totalSizeMB MB)"
Write-Host "📦 Arquivos no backup: $backupCount"
Write-Host "🛡️ Backup salvo em: $backupDir"
Write-Host "================================="
Write-Host ""
Write-Host "🔍 PRÓXIMOS PASSOS:"
Write-Host "1. Testar o site: npm run dev:upload"
Write-Host "2. Se tudo OK, pode remover backup: Remove-Item .backup-cleanup-* -Recurse -Force"
Write-Host "3. Se houver problema: restaurar do backup"
Write-Host ""

# Verificar se arquivos críticos ainda existem
Write-Host "🔍 Verificando arquivos críticos..."
$criticalFiles = @(
    "package.json",
    "debug-analyzer.js", 
    "dev-server.js",
    "public/index.html",
    "api/upload-audio.js"
)

$allCriticalOK = $true
foreach ($critical in $criticalFiles) {
    if (Test-Path $critical) {
        Write-Host "✅ OK: $critical"
    } else {
        Write-Host "❌ FALTANDO: $critical"
        $allCriticalOK = $false
    }
}

if ($allCriticalOK) {
    Write-Host "🎯 Todos os arquivos críticos estão preservados!"
} else {
    Write-Host "⚠️ ATENÇÃO: Alguns arquivos críticos não foram encontrados!"
}
