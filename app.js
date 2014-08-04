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
