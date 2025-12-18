# Troubleshooting (clasp / Google Apps Script)

## Erro: `Request is missing required authentication credential` ao fazer deploy

Sintoma comum:
- `clasp versions` funciona
- `clasp deployments` e/ou `clasp deploy ...` falha com `UNAUTHENTICATED (401)`

Isso normalmente acontece quando o token OAuth salvo pelo `clasp` ficou “sem permissão” para operações de *deployments* (escopos/consentimento antigos, token corrompido, ou autorização revogada/limitada).

### Passo 1: Reautenticar o clasp

No PowerShell, rode:

```powershell
clasp logout
if (Test-Path "$env:USERPROFILE\.clasprc.json") {
  Move-Item "$env:USERPROFILE\.clasprc.json" "$env:USERPROFILE\.clasprc.json.bak" -Force
}
clasp login --no-localhost
```

Depois teste:

```powershell
clasp deployments
```

### Passo 1.5: Confirmar se você está logado na conta “dona” do script

Se o projeto foi criado por outra conta Google (ex.: conta de produção), o `clasp` pode listar versões mas falhar ao listar/criar deployments.

Confira a conta logada no `clasp`:

```powershell
clasp show-authorized-user --json
```

Na prática: faça login no `clasp` com a conta que criou/é dona do Apps Script (ou transfira a propriedade no Drive/Apps Script).

Para manter mais de uma conta no mesmo PC:

```powershell
clasp login --no-localhost -u producao
clasp -u producao deployments
```

### Passo 2 (se continuar): Revogar e autorizar de novo no Google

1. Abra `https://myaccount.google.com/permissions`
2. Remova/revogue o acesso do “clasp”/“Google Apps Script CLI”
3. Rode novamente `clasp login --no-localhost`

### Passo 3 (se continuar): Verificar API e projeto GCP

- Abra a tela de credenciais do projeto do script: `clasp open-credentials-setup`
- Garanta que a “Google Apps Script API” está habilitada no Google Cloud Console.

### Passo 4 (comum em contas Workspace): Usar credenciais OAuth próprias no clasp

Em alguns ambientes (principalmente Google Workspace), o client OAuth padrão do `clasp` pode ficar bloqueado/limitado para operações de *deployments* mesmo com você sendo owner/editor.

1. No Google Cloud Console do seu projeto, crie um **OAuth Client ID** (tipo **Desktop app**).
2. Baixe o JSON (ex.: `oauth-client.json`).
3. Refaça o login usando esse arquivo:

```powershell
clasp logout
clasp login --no-localhost --creds oauth-client.json
clasp deployments
```

### Alternativa rápida: Deploy via UI (sem usar a API de deployments)

Se `clasp push` e `clasp version` funcionam mas `clasp deploy/redeploy` falha:
1. Rode `clasp push --force`
2. Rode `clasp version "descricao"`
3. No editor do Apps Script: **Implantar → Gerenciar implantações** e aponte o deployment para a nova versão.
