# 🚀 CHECKLIST PRÉ-LANÇAMENTO - Sistema RNC v2.4
**Data do Lançamento:** Segunda-feira, 05/01/2026
**Versão:** Deploy 123 (com HOTFIX)

---

## ✅ VERIFICAÇÕES TÉCNICAS

### Sistema Funcionando
- [ ] Abrir nova RNC funciona
- [ ] Editar RNC funciona
- [ ] Kanban carrega corretamente
- [ ] Dashboard exibe métricas
- [ ] Relatórios geram corretamente
- [ ] Upload de anexos funciona
- [ ] Impressão de RNC funciona
- [ ] Notificações por email funcionam

### Permissões
- [ ] Admin tem acesso total
- [ ] Usuários normais veem apenas seu setor
- [ ] Espectadores só visualizam
- [ ] Aba Configurações aparece só para Admin

### Performance
- [ ] Sistema carrega em menos de 3 segundos
- [ ] Dashboard atualiza rapidamente
- [ ] Filtros respondem instantaneamente

---

## 👥 GESTÃO DE USUÁRIOS

### Cadastro de Usuários
- [ ] Listar TODOS os funcionários que vão usar
- [ ] Definir setor de cada um
- [ ] Definir permissões (role) de cada um:
  - Admin
  - Qualidade
  - Liderança
  - Abertura
  - Espectador

### Onde Cadastrar
**No Sistema:**
1. Login como Admin
2. Aba **Configurações**
3. Seção **Gerenciar Usuários**
4. Botão **➕ Novo Usuário**
5. Preencher:
   - Email (Google Workspace)
   - Nome completo
   - Setor
   - Roles (pode ter múltiplas)

---

## 📧 COMUNICAÇÃO INTERNA

### Email de Lançamento (Enviar Sexta 03/01)
```
ASSUNTO: 🚀 Novo Sistema RNC - Lançamento Segunda 05/01

Prezados colaboradores,

A partir de segunda-feira (05/01/2026), entraremos em fase de testes do 
NOVO SISTEMA RNC (Registro de Não Conformidade) v2.4.

📍 LINK DE ACESSO: [inserir link da PRODUÇÃO aqui]

📖 MANUAL DE AJUDA: 
Dentro do sistema, clique na aba "📖 Ajuda" para ver o guia completo.

🎯 FUNCIONALIDADES:
✅ Abrir e gerenciar RNCs
✅ Kanban visual por status
✅ Dashboard com métricas
✅ Relatórios personalizados
✅ Upload de anexos
✅ Notificações automáticas

👥 SUPORTE:
Em caso de dúvidas: TI Neoformula
📧 ti.neoformula@neoformula.com.br
📞 Ramal: 9929

Contamos com a colaboração de todos!
```

---

## 🛡️ BACKUP E SEGURANÇA

### Backup Pré-Lançamento
- [ ] Fazer backup da planilha principal
- [ ] Fazer backup do código (Git já está ok ✅)
- [ ] Documentar deployments atuais:
  - PRODUÇÃO: @134
  - DEV: @135

### Plano de Contingência
**Se der problema:**
1. Reverter para Deploy 122 (estava funcionando)
2. Avisar usuários por email
3. Investigar problema no DEV
4. Corrigir e reimplantar

**Comandos de Rollback:**
```bash
# Reverter PRODUÇÃO para Deploy 122
clasp deploy -d "PRODUÇÃO - Rollback Deploy 122" -i AKfycbxfn2Es1tmP-13ynnn67XloIoXF3GCQbG4z0Zadt1XvOxzdIcLwEfXkXdz-YWJZ6TGX
```

---

## 📊 MONITORAMENTO (Segunda 05/01)

### Manhã (08:00 - 12:00)
- [ ] Verificar se usuários conseguem acessar
- [ ] Monitorar erros no console do Apps Script
- [ ] Responder dúvidas rapidamente
- [ ] Verificar logs de acesso

### Tarde (13:00 - 18:00)
- [ ] Verificar se RNCs estão sendo criadas
- [ ] Conferir se notificações estão sendo enviadas
- [ ] Coletar feedback dos usuários
- [ ] Anotar sugestões de melhoria

### Fim do Dia
- [ ] Fazer backup da planilha com dados do dia
- [ ] Revisar logs de erro
- [ ] Planejar correções para terça-feira

---

## 📚 TREINAMENTO RÁPIDO (Opcional)

### Sessão de 30 minutos (Sexta à tarde)
**Para os principais usuários:**
1. Como abrir uma RNC (5 min)
2. Como editar e acompanhar (5 min)
3. Como usar o Kanban (5 min)
4. Dashboard e Relatórios (5 min)
5. Onde buscar ajuda (5 min)
6. Perguntas e respostas (5 min)

**Ou:** Gravar vídeo curto e enviar para todos

---

## ✅ CHECKLIST FINAL - Sexta 03/01/2026

- [ ] Todos os usuários cadastrados
- [ ] Email de lançamento enviado
- [ ] Backup completo feito
- [ ] Testes finais realizados
- [ ] Plano de contingência documentado
- [ ] Link de PRODUÇÃO compartilhado
- [ ] Equipe de TI preparada para suporte

---

## 🎯 MÉTRICAS DE SUCESSO (Primeira Semana)

**Indicadores:**
- [ ] 100% dos usuários conseguem acessar
- [ ] Pelo menos 10 RNCs criadas na primeira semana
- [ ] Menos de 5 erros críticos reportados
- [ ] Feedback positivo de 80% dos usuários
- [ ] Tempo médio de resposta do sistema < 3s

---

**SISTEMA PRONTO PARA PRODUÇÃO! 🎉**
