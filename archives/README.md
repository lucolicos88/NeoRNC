# Archives - Versões Anteriores

Esta pasta contém backups automáticos de todas as versões do sistema NeoRNC.

## Estrutura:

```
archives/
├── deploy-37_2025-12-04/    # Backup do Deploy 37
│   ├── index.html
│   ├── 01.Config.js
│   ├── ... (todos os arquivos)
│   └── metadata.json        # Informações do backup
│
├── deploy-38_2025-12-05/    # Próximo backup
└── ...
```

## Como os backups são criados:

Automaticamente pelo script `backup-deploy.js` antes de cada deploy:

```bash
node backup-deploy.js "Descrição do deploy"
```

## Recuperar uma versão anterior:

```bash
# Ver backups disponíveis
ls archives/

# Copiar versão desejada
cp archives/deploy-37_2025-12-04/* .

# Deploy
clasp push
clasp deploy --description "Rollback para Deploy 37"
```

## Informações de cada backup:

Cada pasta contém:
- Todos os arquivos .js e .html da versão
- `metadata.json` com informações do deploy (data, git commit, descrição)

## Limpeza:

Recomendado manter últimos 10 deploys.
Backups antigos (>6 meses) podem ser deletados.

---

**📚 Documentação completa:** [VERSIONAMENTO.md](../VERSIONAMENTO.md)
