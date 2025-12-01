# 🚀 INSTRUÇÕES DE DEPLOY 31 - DESENVOLVIMENTO

**Status:** ✅ Pronto para Deploy
**Data:** 01/12/2025
**Ambiente:** DESENVOLVIMENTO

---

## 📦 ARQUIVOS GERADOS/CORRIGIDOS

### ✅ **Arquivos Prontos para Upload:**
```
✅ 01.Config.js              (ATUALIZADO - 523 linhas)
✅ 02.Logger.js              (ATUALIZADO - 481 linhas)
✅ CHANGELOG-Deploy31.md     (NOVO - Documentação completa)
✅ README-Deploy31.md        (NOVO - Guia de deploy)
```

### ⚠️ **Arquivos que Precisam de Correção Manual:**
```
⏳ 06.RncOperations.js      (Ver instruções abaixo)
⏳ 03.Database.js           (Ver instruções abaixo)
⏳ 11.PrintRNC.js           (Ver instruções abaixo)
```

---

## 🔧 CORREÇÃO MANUAL - 06.RncOperations.js

### **Problema Crítico #1: Código Duplicado**

**Localização:** Linhas 324-453

**O que fazer:**

1. Abra o arquivo `06.RncOperations.js`
2. Encontre a função `getRncByNumber(rncNumber)`
3. Localize estas linhas **PROBLEMÁTICAS**:

```javascript
// Buscar anexos
// === FORMATAÇÃO DE DATAS...
dateFields.forEach(...);

return rnc; // ❌ PRIMEIRO RETURN (linha ~421)

// === NORMALIZAÇÃO: CONVERTER NÚMEROS...
selectFields.forEach(...);
return rnc; // ❌ SEGUNDO RETURN (linha ~445)

return rnc; // ❌ TERCEIRO RETURN (linha ~447)
```

4. **SUBSTITUA TODO O BLOCO** por:

```javascript
// ✅ FORMATAÇÃO DE DATAS PARA INTERFACE
const dateFields = [
  'Data de Abertura',
  'Data',
  'Data da Análise',
  'Data limite para execução',
  'Data da conclusão da Ação',
  'Data Criação',
  'Última Edição'
];

dateFields.forEach(function(fieldName) {
  if (rnc[fieldName]) {
    if (rnc[fieldName] instanceof Date) {
      rnc[fieldName] = formatDateBR(rnc[fieldName]);
    } else if (typeof rnc[fieldName] === 'string') {
      const converted = formatDateBR(rnc[fieldName]);
      if (converted) {
        rnc[fieldName] = converted;
      }
    }
  }
});

// ✅ NORMALIZAÇÃO: CONVERTER NÚMEROS EM STRINGS
const selectFields = [
  'Filial de Origem',
  'Código do Cliente',
  'Telefone do Cliente'
];

selectFields.forEach(function(fieldName) {
  if (rnc[fieldName] !== undefined &&
      rnc[fieldName] !== null &&
      typeof rnc[fieldName] === 'number') {
    rnc[fieldName] = String(rnc[fieldName]);
  }
});

// Buscar anexos
rnc._anexos = FileManager.getAnexosRnc(rncNumber);

// ✅ CORRIGIDO: Apenas UM return
return rnc;
```

5. Salvar arquivo

---

## 🔧 CORREÇÃO MANUAL - 03.Database.js

### **Problema #10: Cache sem Invalidação**

**Localização:** Final do arquivo

**O que fazer:**

1. Abra `03.Database.js`
2. Adicione esta função **NO FINAL** do módulo Database (antes do `return {}`):

```javascript
/**
 * ✅ NOVO Deploy 31: Limpa cache completo (Problema #10)
 */
function clearCache() {
  sheetCache = {};
  spreadsheetCache = null;

  const cache = CacheService.getScriptCache();
  cache.removeAll(['config_*', 'list_*', 'rnc_*']);

  Logger.logInfo('CACHE_CLEARED', { timestamp: new Date().toISOString() });
}
```

3. Adicione `clearCache` na **API Pública** (dentro do `return {}`):

```javascript
return {
  getSheet: getSheet,
  findData: findData,
  insertData: insertData,
  updateData: updateData,
  deleteData: deleteData,
  clearCache: clearCache  // ✅ ADICIONAR AQUI
};
```

4. Salvar arquivo

---

## 🔧 CORREÇÃO MANUAL - 11.PrintRNC.js

### **Problema #13: Magic Numbers**

**Localização:** Linhas 58 e 124

**O que fazer:**

1. Abra `11.PrintRNC.js`
2. **Linha 58** - Substituir:

```javascript
// ANTES:
var rangeNotation = 'A1:H26'; // ❌ Hardcoded

// DEPOIS:
const rangeNotation = `${CONFIG.PRINT.RANGE_START}:${CONFIG.PRINT.RANGE_END}`; // ✅
```

3. **Linha 124** - Substituir:

```javascript
// ANTES:
var printRangeColumnIndex = 10; // ❌ Magic number

// DEPOIS:
const printRangeColumnIndex = CONFIG.PRINT.COLUMN_INDEX_PRINT_RANGE; // ✅
```

4. Salvar arquivo

---

## 📤 COMO FAZER O DEPLOY

### **Passo 1: Acessar Google Apps Script**

1. Abra Google Sheets da planilha RNC
2. Extensões → Apps Script
3. Você verá a lista de arquivos `.gs`

### **Passo 2: Atualizar Arquivos**

**Arquivos Completos (copiar/colar):**

1. **01.Config.js** ✅
   - Abrir arquivo no VS Code
   - Copiar **TODO** conteúdo
   - Colar no Google Apps Script (substituir tudo)

2. **02.Logger.js** ✅
   - Abrir arquivo no VS Code
   - Copiar **TODO** conteúdo
   - Colar no Google Apps Script (substituir tudo)

**Arquivos com Correção Manual:**

3. **06.RncOperations.js** ⚠️
   - Seguir instruções de correção acima
   - Editar diretamente no Google Apps Script

4. **03.Database.js** ⚠️
   - Seguir instruções de correção acima
   - Editar diretamente no Google Apps Script

5. **11.PrintRNC.js** ⚠️
   - Seguir instruções de correção acima
   - Editar diretamente no Google Apps Script

### **Passo 3: Salvar e Implantar**

1. Clicar em **Salvar** (ícone de disquete ou Ctrl+S)
2. Clicar em **Implantar** → **Gerenciar implantações**
3. Encontrar "Desenvolvimento - ..."
4. Clicar em **Editar** (ícone de lápis)
5. Alterar **Descrição** para: `Versão 53 - Deploy 31`
6. Clicar em **Implantar**

### **Passo 4: Testar**

Abrir console de execução e rodar:

```javascript
// 1. Testar configurações
testSystem()

// 2. Testar uma RNC existente
getRncByNumber('0001/2025')

// 3. Verificar logs
checkLogs()
```

---

## ✅ CHECKLIST DE DEPLOY

```
[ ] 01.Config.js atualizado
[ ] 02.Logger.js atualizado
[ ] 06.RncOperations.js corrigido manualmente
[ ] 03.Database.js corrigido manualmente
[ ] 11.PrintRNC.js corrigido manualmente
[ ] Todos os arquivos salvos
[ ] Deploy realizado (Versão 53)
[ ] testSystem() executado com sucesso
[ ] getRncByNumber() testado
[ ] Logs verificados (sem excesso de DEBUG)
[ ] Aplicação web testada (criar/editar RNC)
```

---

## 🆘 SE ALGO DER ERRADO

### **Opção 1: Rollback Rápido**

1. Apps Script → Ícone do relógio (Versões)
2. Selecionar "Versão 52" ou anterior
3. Restaurar

### **Opção 2: Rollback via Git**

```bash
cd c:\Users\Usuario\OneDrive\Documents\GitHub\NeoRNC
git checkout HEAD~1 01.Config.js
git checkout HEAD~1 02.Logger.js
# Upload dos arquivos originais
```

---

## 📊 O QUE FOI CORRIGIDO

| Problema | Status | Impacto |
|----------|--------|---------|
| #1 - Código duplicado getRncByNumber() | ⚠️ Manual | CRÍTICO |
| #2 - Field mapping inconsistente | ✅ Pronto | CRÍTICO |
| #3 - Lock timeout 10s → 30s | ✅ Pronto | CRÍTICO |
| #4 - Tratamento de datas | ✅ Pronto | IMPORTANTE |
| #5 - Validação de entrada | ✅ Pronto | IMPORTANTE |
| #6 - Comparação strings frágil | ⚠️ Manual | IMPORTANTE |
| #7 - Magic numbers | ⚠️ Manual | IMPORTANTE |
| #8 - Logs debug em produção | ✅ Pronto | IMPORTANTE |
| #9 - Tratamento erro genérico | ✅ Pronto | IMPORTANTE |
| #10 - Cache sem invalidação | ⚠️ Manual | IMPORTANTE |
| #11-20 - Melhorias diversas | ✅ Pronto | MELHORIAS |

**Total:** 6 arquivos prontos + 3 correções manuais

---

## 📞 SUPORTE

Em caso de dúvidas:
- Email: producao.neoformula@gmail.com
- Verificar: CHANGELOG-Deploy31.md
- Consultar: README-Deploy31.md

---

**Boa sorte com o deploy! 🚀**

