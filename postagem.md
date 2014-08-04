# Renderizando templates no Express com dust.js

Uma das coisas mais básicas que um sistema web pode fazer é renderizar uma
página HTML para ser exibida no navegador do seu usuário. Embora essa seja
uma tarefa trivial, muitos recém chegados podem ter uma certa dificuldade de
achar a melhor ferramenta de renderização para o seu projeto, hoje vamos falar
sobre uma delas, o [dust.js][0], em especial o [fork criado pela LinkedIn][1].

### Um pouco sobre o dust.js

O dust.js foi desenvolvido originalmente por [Aleksander Williams][2], este
módulo se destaca dos [demais templates engines][3] por ser assíncrono por
natureza e stream do template para o cliente enquanto ainda está sendo gerado.

Por exemplo, com esse helper abaixo, consigo demonstrar a natureza assíncrona
deste template engine.

```js
dust.makeBase({
    asyncHello : function(chunk){
        // Informamos que o processo é assíncrono
        chunk.map(function(chunk){

            // Depois de um segundo escrevemos uma frase
            // no chunk que recebemos
            setTimeout(function(){
                chunk.write('Hello async world!');

                // Precisamos informar que terminamos
                // nossas operações assíncronas e o dust.js
                // pode seguir seu trabalho
                chunk.end();
            }, 1000);
        });
    }
});
```

Com nosso helper registrado so é necessário chamá-lo no seu template:

```html
<h1>{asyncHello}</h1>

<!-- Será renderizado para -->
<h1>Hello async world!</h1>
```

Com isso podemos deixar o carregamento de dados dinâmico, sem precisar carregar
todos os dados na rota antes de chamar a renderização, assim podemos ter
templates dinâmicos que não dependem da rota para carregar determinada
informação. Quem já trabalha com server side templates no Node.js sabe muito
bem o problema que muitas vezes isso pode causar.

### Express e Adaro

Esse post terá o [Express][4] como gerenciador de rotas da nossa aplicação e o
pacote [Adaro][5] que ajudará a plugar o Dust.js no Express. O pacote [request][5]
servirá como uma ajuda na hora de construir o helper `gists`, responsável por
listar gists de um determinado usuário.

Começaremos criando um diretório e instalando os pacotes necessários:

```bash
mkdir teste-dust
cd teste-dusp
mkdir template
npm init
# Respoder as perguntas
npm install --save express adaro dustjs-helpers dustjs-linkedin request
```

Com a nossa pasta pronta, já podemos começar o código:

```javascript
// Começamos com o require dos pacotes importantes
// para o projeto
var request = require('request');
var express = require('express');
var app = express();
var dustjs = require('adaro');

// Setando opções padrões para o request
var r = request.defaults({
    headers: {
        'User-Agent': 'Node.js'
    }
});

// Usando a api do Express, cadastramos uma nova engine
// e desabilitamos o cache pois estamos em modo de desenvolvimento
app.engine('dust', dustjs.dust({
    cache: false
}));

// Setamos algumas variáveis, como a engine responsável
// por renderizar, desabilitamos o cache do Express e
// setamos o diretório onde estão guardadas nossas views
app.set('view engine', 'dust');
app.set('view cache', 'false');
app.set('views', __dirname + '/template');

// Setamos a nossa primeira rota, onde renderizamos
// o index.dust e passamos algumas variáveis para o template
app.get('/', function(req, res){
    res.render('index', {
        pessoas: [
            {nome: 'Alan', sobrenome: 'Hoffmeister'},
            {nome: 'John', sobrenome: 'Levitt'},
            {nome: 'Lorem', sobrenome: 'Ipsum'}
        ],
        gists: function(chunk, context, bodies, params){

            // Estamos dizendo que esse chunk, ou parte do
            // template que está usando o #gists, é assíncrono
            return chunk.map(function(chunk){
                var url = 'https://api.github.com/users/' +
                    params.user + '/gists';

                // Vamos buscar na API do GitHub os últimos
                // gists do usuário que foi configurado no
                // tag do template
                r.get(url, function(err, headers, body){
                    var json = JSON.parse(body);

                    // Para cada gist encontrado, temos que renderizar
                    // o bloco, enviarmos o gist como o contexto do bloco,
                    // assim poder usar o json do gist como marcação no
                    // template
                    json.forEach(function(repo){
                        chunk.render(bodies.block, context.push(repo));
                    });

                    chunk.end();
                });
            });
        }
    });
});

// Uma segunda rota onde vamos renderizar a nossa pseudo página
// de contato
app.get('/contato', function(req, res){
    res.render('contato');
});

// Essa rota será acionada sempre que o Express detectar uma
// requisição que está pedidindo por uma rota não cadastrada,
// nessa caso específico usaremos para detectar páginas que não
// existem.
app.all('*', function(req, res){
    res.status(404).render('404');
});


// Iniciamos o Express na porta 8080
app.listen(8080);
```

### Templates

Os templates estão disponíveis [neste repositório][6] dentro da pasta `template`,
tudo o que você precisa fazer é copiar os arquivos para a pasta que criamos
anteriormente. Não vou postar aqui pois o intuito desta postagem não é
demonstrar o markup do Dust.js mas sim suas facilidades e integração.

### Conclusão

Escrever um helper para o Dust.js pode não ser a coisa mais fácil do mundo, pois
a natureza da própria plataforma Node.js anceia por métodos assíncronos, e são
esses métodos que tornam essa template engine extremamente performática e
modular, perfeita para o seu próximo projeto em Node.js.

[0]: https://linkedin.github.io/dustjs
[1]: http://engineering.linkedin.com/frontend/client-side-templating-throwdown-mustache-handlebars-dustjs-and-more
[2]: https://github.com/akdubya/dustjs
[3]: http://node-modules.com/search?q=template
[4]: http://expressjs.com
[5]: https://github.com/mikeal/request
[6]: https://github.com/alanhoff/alanhoff.com-dust
