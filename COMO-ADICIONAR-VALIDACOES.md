# 📝 Como Adicionar Validações de Campos

**Deploy 33 Fix** - Sistema de validação baseado na planilha ConfigCampos

---

## 🎯 Visão Geral

O sistema agora usa a coluna **ValidaçãoRegex** da aba **ConfigCampos** para validar o formato dos campos. Você pode adicionar validações sem modificar código!

---

## 📋 Como Funciona

1. **Planilha ConfigCampos**: Você define o padrão regex na coluna ValidaçãoRegex
2. **Sistema valida**: Quando usuário preenche o campo, o sistema verifica se está no formato correto
3. **Mensagem de erro**: Se inválido, mostra a mensagem da coluna MensagemErro

---

## 🔧 Passo a Passo

### 1. Abra a aba ConfigCampos

Na planilha, vá para a aba **ConfigCampos**.

### 2. Encontre o campo que quer validar

Exemplo: Campo "Telefone do Cliente" na seção "Abertura"

### 3. Adicione o regex na coluna ValidaçãoRegex

**Coluna I (ValidaçãoRegex)**

Exemplos de regex úteis:

#### Telefone (formato brasileiro):
```regex
^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$
```

Aceita:
- (11) 98765-4321
- 11 98765-4321
- 11987654321

#### Email:
```regex
^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

#### CEP:
```regex
^\d{5}-?\d{3}$
```

Aceita:
- 01310-100
- 01310100

#### Somente números:
```regex
^\d+$
```

#### CPF (com ou sem formatação):
```regex
^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$
```

Aceita:
- 123.456.789-09
- 12345678909

#### CNPJ (com ou sem formatação):
```regex
^\d{2}\.?\d{3}\.?\d{3}/?000\d-?\d{2}$
```

#### Data brasileira (DD/MM/AAAA):
```regex
^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\d{4}$
```

#### Valor monetário:
```regex
^\d+[\d{2}]?$
```

Aceita:
- 100,50
- 1000,00
- 50,5

### 4. Adicione a mensagem de erro na coluna MensagemErro

**Coluna J (MensagemErro)**

Escreva uma mensagem clara que o usuário entenderá:

#### Exemplos:

| Campo | MensagemErro |
|-------|--------------|
| Telefone do Cliente | Telefone inválido. Use o formato: (XX) XXXXX-XXXX |
| Email | Email inválido. Use o formato: exemplo@dominio.com |
| CEP | CEP inválido. Use o formato: XXXXX-XXX |
| CPF | CPF inválido. Deve ter 11 dígitos |
| Data da Análise | Data inválida. Use o formato DD/MM/AAAA |
| Valor | Valor inválido. Use formato numérico (ex: 100,50) |

### 5. Salve a planilha

As validações entram em vigor imediatamente!

---

## ✅ Teste sua Validação

1. Abra o formulário de RNC
2. Preencha o campo com um valor **inválido**
3. Tente salvar
4. Deve aparecer a mensagem de erro que você definiu

---

## 📊 Exemplo Completo

Vamos adicionar validação para "Telefone do Cliente":

### Na aba ConfigCampos:

| Seção | Campo | Tipo | Obrigatório | ValidaçãoRegex | MensagemErro |
|-------|-------|------|-------------|----------------|--------------|
| Abertura | Telefone do Cliente | input | Não | `^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$` | Telefone inválido. Use o formato: (XX) XXXXX-XXXX |

### Resultado:

Quando usuário digitar:
- ✅ `(11) 98765-4321` → Aceita
- ✅ `11987654321` → Aceita
- ❌ `1234` → Mostra: "Telefone inválido. Use o formato: (XX) XXXXX-XXXX"

---

## 🚀 Validações Recomendadas

Baseado na sua planilha ConfigCampos atual, recomendo adicionar validações para:

### Seção: Abertura

| Campo | ValidaçãoRegex | MensagemErro |
|-------|----------------|--------------|
| Telefone do Cliente | `^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$` | Telefone inválido. Use o formato: (XX) XXXXX-XXXX |

### Seção: Qualidade

| Campo | ValidaçãoRegex | MensagemErro |
|-------|----------------|--------------|
| Valor | `^\d+[\d{2}]?$` | Valor inválido. Use formato numérico (ex: 100,50) |
| Req de Cortesia | `^\d+$` | Req de Cortesia deve conter apenas números |

---

## 🔍 Testador de Regex

Para testar seus regex antes de adicionar na planilha:

1. Acesse: https://regex101.com/
2. Selecione flavor: **ECMAScript (JavaScript)**
3. Cole seu regex
4. Teste com exemplos de valores válidos e inválidos

---

## ❓ Perguntas Frequentes

### Q: O que acontece se deixar ValidaçãoRegex vazio?
**A:** O campo não será validado por regex, apenas verificará se está preenchido (se for obrigatório).

### Q: Posso ter validação sem mensagem de erro?
**A:** Sim, o sistema mostrará uma mensagem padrão: "Campo [nome] está em formato inválido"

### Q: A validação funciona em tempo real ou só ao salvar?
**A:** Atualmente valida apenas ao salvar. Validação em tempo real pode ser adicionada depois.

### Q: Posso usar funções especiais de regex?
**A:** Sim, use regex padrão JavaScript/ECMAScript.

### Q: E se meu regex estiver errado?
**A:** O sistema logará um aviso nos Logs mas não bloqueará o save. Teste bem seu regex primeiro!

---

## 🛠️ Regex Úteis - Biblioteca

Copie e cole conforme necessário:

### Telefone brasileiro:
```regex
^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$
```

### Email:
```regex
^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### CEP:
```regex
^\d{5}-?\d{3}$
```

### CPF:
```regex
^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$
```

### CNPJ:
```regex
^\d{2}\.?\d{3}\.?\d{3}/?000\d-?\d{2}$
```

### Data DD/MM/AAAA:
```regex
^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/\d{4}$
```

### Somente números:
```regex
^\d+$
```

### Números decimais (vírgula):
```regex
^\d+,\d{2}$
```

### Números decimais (ponto):
```regex
^\d+\.\d{2}$
```

### Alfanumérico:
```regex
^[a-zA-Z0-9]+$
```

### Somente letras:
```regex
^[a-zA-Z\s]+$
```

### Placa de carro (formato antigo):
```regex
^[A-Z]{3}-\d{4}$
```

### Placa de carro (Mercosul):
```regex
^[A-Z]{3}\d[A-Z0-9]\d{2}$
```

---

## 📞 Suporte

Se tiver dúvidas:
1. Consulte regex101.com para testar
2. Veja exemplos neste documento
3. Verifique logs na aba Logs da planilha

---

**Versão:** Deploy 33 Fix (@58)
**Data:** 02/12/2025
**Status:** ✅ Pronto para uso
