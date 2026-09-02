# extract_csv

API serverless para transformar arquivos XLS, XLSX e CSV em texto CSV puro. O processamento acontece exclusivamente em memória: nenhum arquivo, dado ou informação é armazenado.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` para abrir a documentação e testar um arquivo no navegador.

## API

### `POST /api/convert`

Envie JSON com uma string base64 pura, data URI base64 ou URL HTTP/HTTPS pública de qualquer provedor. `filename` é opcional, mas recomendado para identificar arquivos Excel enviados em base64.

```json
{
  "file": "data:text/csv;base64,bmFtZSx2YWx1ZQpBbGljZSwyMA==",
  "filename": "dados.csv"
}
```

Para baixar um arquivo público diretamente:

```json
{
  "url": "https://raw.githubusercontent.com/usuario/repositorio/main/dados.xlsx"
}
```

Use o link direto do arquivo, não uma página HTML. A URL pode baixar até 10 MB; a entrada base64 permanece limitada a 3 MB por causa do limite de request da Vercel. Endereços internos, como `localhost` e IPs privados, são bloqueados.

Para XLS/XLSX, a primeira aba é convertida. O sucesso retorna `text/csv; charset=utf-8` com o conteúdo no corpo:

```text
name,value
Alice,20
```

O limite é de 3 MB após a decodificação. Esse limite considera o limite de request da Vercel e o aumento de aproximadamente 33% do base64. Erros retornam JSON:

```json
{ "error": "O conteúdo não é um base64 válido." }
```

Não envie `file` e `url` juntos. Status usados: `200` sucesso, `400` entrada inválida, `413` arquivo acima do limite, `415` formato não suportado ou URL não permitida e `422` arquivo inválido, vazio ou indisponível.

## Qualidade e deploy

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

O projeto pode ser importado diretamente na Vercel. Não há variáveis de ambiente necessárias nem banco de dados para configurar.
