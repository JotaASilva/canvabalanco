# Fechado para Balanço

Assistente de balanço pessoal multi-página (HTML + Tailwind + FontAwesome + jsPDF).

## Como executar

### Via servidor local Python
```bash
python -m http.server 5500
```
Abra: http://localhost:5500/index.html

## Recursos
- Persistência por sessão (`sessionStorage`) com metadados.
- PDF com cabeçalho (logo), seções e perguntas/respostas.
- Navegação com tabs e barra de progresso.
- Campos padronizados: alturas consistentes, limites (text 80 / textarea 200), responsivo.

## Estrutura
- Páginas: `index.html`, `step2.html`, `step5.html`, `step6.html`, `step7.html`, `step8.html`, `step9.html`, `step10.html`, `step11.html`
- Script central: `wizard.js` (navegação, persistência, PDF)
- Imagens: `assets/FechadoBalançoLogo.png`

## Publicação
Use GitHub Pages ou qualquer servidor estático para hospedar.
