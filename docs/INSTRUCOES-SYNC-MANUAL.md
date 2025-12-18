# Instruções para Sincronizar index.html Manualmente

## Problema
O `clasp push` está com bug e não está enviando o `index.html` atualizado para o Google Apps Script.

## Solução Manual

### Passo 1: Abrir o Apps Script Editor
```
https://script.google.com/home/projects/1fQpX8VKoJu9wDojDvFqwLNIA1MT0NDDzdY-uNXqxNjqyZKdAp0J4bDBh/edit
```

### Passo 2: Abrir index.html no Editor Web

1. Clique em "index.html" na lista de arquivos
2. Você verá o código antigo

### Passo 3: Copiar Código Novo

Abra o arquivo local:
```
c:\Users\Usuario\OneDrive\Documents\GitHub\NeoRNC\index.html
```

### Passo 4: Substituir o Código

1. Selecione TODO o conteúdo do index.html no Apps Script
2. Delete
3. Cole o conteúdo do arquivo local
4. Salve (Ctrl+S)

### Passo 5: Criar Novo Deployment

```bash
clasp deploy --description "Deploy 40 - Manual sync fix"
```

### Passo 6: Testar

Use a nova URL do deployment @81

## Alternativa: Forçar Sync via Git

Se preferir automatizar, podemos criar um script Python que usa a API do Google Apps Script diretamente.

Quer que eu crie esse script?
