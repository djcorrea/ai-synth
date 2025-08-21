# Limpeza de deployments antigos
Write-Host "Limpando deployments antigos..." -ForegroundColor Yellow

vercel rm https://ai-synth-fruqgvl6i-dj-correas-projects.vercel.app --yes
vercel rm https://ai-synth-49d6ke2eu-dj-correas-projects.vercel.app --yes 
vercel rm https://ai-synth-c57g1xdh3-dj-correas-projects.vercel.app --yes

Write-Host "Limpeza concluida!" -ForegroundColor Green
vercel ls
