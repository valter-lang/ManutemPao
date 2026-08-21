# 🍞 ManutenPão — Gestão de Comodato e Manutenção

PWA (aplicativo web instalável) para controle de **equipamentos em comodato** de padaria
(fornos, câmaras frias, modeladoras, etc.) e das **Ordens de Serviço (OS)** de manutenção.

Roda 100% no navegador, funciona offline e salva os dados no **localStorage** do próprio
aparelho — não há backend nem banco de dados na nuvem.

---

## ✨ Funcionalidades

- **Dashboard executivo** — KPIs (Alocados / Disponíveis / Em Manutenção / OS Abertas) e
  gráficos (Chart.js): distribuição de equipamentos, OS por status e OS por técnico.
- **Equipamentos** — cadastro/edição em cards, filtro por status e busca.
- **Ordens de Serviço em Kanban** — colunas *Aberta → Em andamento → Concluída* com
  arrastar-e-soltar e filtros por cliente / mecânico / data.
- **Baixa técnica obrigatória** — só é possível concluir uma OS registrando a solução aplicada.
- **Rastreabilidade** — cada OS guarda o histórico de eventos (quem abriu, distribuiu, iniciou e concluiu).
- **Perfis de acesso** — *Gestão/Colaborador* (vê tudo e distribui) × *Mecânico* (vê só as suas OS).

---

## ▶️ Como rodar localmente

O app precisa ser servido por **HTTP** (abrir o `index.html` direto pelo Windows não executa
o service worker corretamente). O projeto já traz um servidor pronto.

### Opção A — servidor incluso (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File servidor-local.ps1
```

Depois abra no navegador: <http://localhost:8080>

### Opção B — qualquer servidor estático

```bash
# com Python instalado
python -m http.server 8080
```

Depois abra <http://localhost:8080>.

---

## 💻 Trabalhar em duas máquinas (via GitHub)

Repositório: <https://github.com/valter-lang/ManutemPao>

### Primeira vez em uma máquina nova

1. Instale o **Git**: <https://git-scm.com/download/win>
2. Clone o projeto:

   ```bash
   git clone https://github.com/valter-lang/ManutemPao.git
   ```

### No dia a dia

```bash
git pull                    # 1. ao COMEÇAR: baixa o que mudou na outra máquina
# ... edita os arquivos ...
git add -A
git commit -m "descrição do que mudou"
git push                    # 2. ao TERMINAR: envia de volta pro GitHub
```

> **Regra de ouro:** `pull` ao chegar, `push` ao sair. Assim as duas máquinas nunca
> ficam fora de sincronia.

---

## 📁 Estrutura

| Arquivo/Pasta            | Papel                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `index.html`             | Interface (sidebar, dashboard, kanban, modais)              |
| `app.js`                 | Lógica: navegação, CRUD, kanban, perfis, gráficos           |
| `data.js`                | Dados de exemplo (seed) — carregados no 1º acesso           |
| `styles.css`             | Estilo visual                                               |
| `sw.js`                  | Service worker (offline)                                    |
| `manifest.webmanifest`   | Manifesto PWA (instalação)                                  |
| `icons/`                 | Ícones do app (192 / 512)                                   |
| `servidor-local.ps1`     | Servidor HTTP local (Windows)                               |
| `abrir-manutenpao.bat`   | Atalho para abrir o app                                     |

---

## 📝 Notas técnicas

- Os dados ficam no **localStorage** do navegador — cada máquina/navegador tem a sua própria base.
- Depende de **CDN externa** (Chart.js e Google Fonts), então o modo offline é parcial.
- A "data de hoje" está **fixada em `2026-06-02`** na função `today()` do `app.js`, para manter
  o seed de exemplo consistente. Em produção, troque por `new Date().toISOString().slice(0,10)`.
